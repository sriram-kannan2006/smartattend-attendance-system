const { v4: uuidv4 } = require('uuid');
const NotificationJob = require('../../models/NotificationJob');
const NotificationRule = require('../../models/NotificationRule');
const Attendance = require('../../models/Attendance');
const Timetable = require('../../models/Timetable');
const InAppProvider = require('./providers/InAppProvider');
const EmailProvider = require('./providers/EmailProvider');
const MockWhatsAppProvider = require('./providers/MockWhatsAppProvider');
const recipientResolver = require('./recipientResolver');
const templateService = require('./templateService');
const notificationLogger = require('./notificationLogger');
const config = require('../../config');

const DEFAULT_RULES = [
  // ABSENCE ALERT
  { eventType: 'ABSENCE_ALERT', recipientRole: 'STUDENT', channels: { inApp: true, email: false, whatsapp: false } },
  { eventType: 'ABSENCE_ALERT', recipientRole: 'PARENT', channels: { inApp: true, email: false, whatsapp: true } },
  { eventType: 'ABSENCE_ALERT', recipientRole: 'WARDEN', channels: { inApp: true, email: false, whatsapp: false } },

  // HOD SUMMARY (One per session)
  { eventType: 'HOD_ATTENDANCE_SUMMARY', recipientRole: 'HOD', channels: { inApp: true, email: false, whatsapp: true } },

  // LOW ATTENDANCE ALERT
  { eventType: 'LOW_ATTENDANCE_ALERT', recipientRole: 'STUDENT', channels: { inApp: true, email: false, whatsapp: false } },
  { eventType: 'LOW_ATTENDANCE_ALERT', recipientRole: 'PARENT', channels: { inApp: true, email: true, whatsapp: true } },
  { eventType: 'LOW_ATTENDANCE_ALERT', recipientRole: 'HOD', channels: { inApp: true, email: false, whatsapp: true } },

  // OD NOTIFICATION
  { eventType: 'OD_NOTIFICATION', recipientRole: 'STUDENT', channels: { inApp: true, email: false, whatsapp: false } },
  { eventType: 'OD_NOTIFICATION', recipientRole: 'TEACHER', channels: { inApp: true, email: false, whatsapp: false } },
  { eventType: 'OD_NOTIFICATION', recipientRole: 'PARENT', channels: { inApp: false, email: false, whatsapp: false } },

  // GENERAL NOTIFICATION
  { eventType: 'GENERAL_NOTIFICATION', recipientRole: 'STUDENT', channels: { inApp: true, email: false, whatsapp: false } },
  { eventType: 'GENERAL_NOTIFICATION', recipientRole: 'TEACHER', channels: { inApp: true, email: false, whatsapp: false } },
  { eventType: 'GENERAL_NOTIFICATION', recipientRole: 'PARENT', channels: { inApp: true, email: false, whatsapp: false } },
];

class NotificationEngine {
  constructor() {
    this.providers = new Map();
    this.initProviders();
  }

  initProviders() {
    this.registerProvider(new InAppProvider());
    this.registerProvider(new EmailProvider());
    this.registerProvider(new MockWhatsAppProvider());
  }

  registerProvider(provider) {
    this.providers.set(provider.channelName, provider);
  }

  getProvider(channel) {
    return this.providers.get(channel);
  }

  /**
   * Seed default notification rules if database has none.
   */
  async seedDefaultRules() {
    try {
      for (const rule of DEFAULT_RULES) {
        const exists = await NotificationRule.findOne({
          eventType: rule.eventType,
          recipientRole: rule.recipientRole,
        });
        if (!exists) {
          await NotificationRule.create(rule);
        }
      }
    } catch (err) {
      console.warn('[NotificationEngine] Seed rules warning:', err.message);
    }
  }

  /**
   * Resolve enabled channels for a given event type and recipient role from active rules.
   * @param {string} eventType
   * @param {string} recipientRole
   * @returns {Promise<string[]>} List of enabled channels e.g. ['IN_APP', 'WHATSAPP']
   */
  async getEnabledChannels(eventType, recipientRole) {
    const rule = await NotificationRule.findOne({
      eventType,
      recipientRole,
      isActive: true,
    });

    if (!rule) {
      // Fallback default
      const defaultMatch = DEFAULT_RULES.find(
        (r) => r.eventType === eventType && r.recipientRole === recipientRole
      );
      if (!defaultMatch) return ['IN_APP'];
      const enabled = [];
      if (defaultMatch.channels.inApp) enabled.push('IN_APP');
      if (defaultMatch.channels.email) enabled.push('EMAIL');
      if (defaultMatch.channels.whatsapp) enabled.push('WHATSAPP');
      return enabled;
    }

    const enabled = [];
    if (rule.channels?.inApp) enabled.push('IN_APP');
    if (rule.channels?.email) enabled.push('EMAIL');
    if (rule.channels?.whatsapp) enabled.push('WHATSAPP');
    return enabled;
  }

  /**
   * Trigger a notification job or set of jobs.
   */
  async trigger(event) {
    try {
      const { type, payload = {}, recipientRole = 'PARENT' } = event;
      
      // Determine channels: explicit channels or resolved via rules
      let channels = event.channels;
      if (!channels || channels.length === 0) {
        channels = await this.getEnabledChannels(type, recipientRole);
      }

      const jobs = [];

      for (const channel of channels) {
        const formatted = templateService.format(type, channel, payload, recipientRole);
        const mergedPayload = { ...payload, ...formatted };

        const jobId = `NJOB-${uuidv4().slice(0, 8).toUpperCase()}`;

        const job = await NotificationJob.create({
          jobId,
          type,
          channel,
          recipientId: event.recipientId || null,
          recipientRole,
          recipientAddress: event.recipientAddress || null,
          templateId: `${type.toLowerCase()}_${channel.toLowerCase()}`,
          payload: mergedPayload,
          status: 'QUEUED',
          attempts: 0,
          maxAttempts: config.notifications?.maxRetryAttempts || 3,
          scheduledAt: new Date(),
        });

        jobs.push(job);

        // Dispatch job asynchronously in background (non-blocking)
        this.dispatchJob(job._id).catch((dispatchErr) => {
          notificationLogger.error({ channel, type, jobId }, dispatchErr);
        });
      }

      return jobs;
    } catch (error) {
      notificationLogger.error({ type: event?.type }, error);
      return [];
    }
  }

  /**
   * Dispatch a single notification job through its assigned provider.
   */
  async dispatchJob(jobMongoId) {
    const job = await NotificationJob.findById(jobMongoId);
    if (!job || job.status === 'PROCESSING') return;

    const provider = this.getProvider(job.channel);
    if (!provider) {
      job.status = 'FAILED';
      job.error = `No provider registered for channel: ${job.channel}`;
      await job.save();
      return;
    }

    job.status = 'PROCESSING';
    job.processingStartedAt = new Date();
    job.attempts += 1;
    await job.save();

    try {
      const result = await provider.send(job);

      if (result.success) {
        job.status = result.status || (job.channel === 'WHATSAPP' ? 'SIMULATED' : 'SENT');
        job.deliveredAt = result.deliveredAt || new Date();
        job.providerResponse = result.providerResponse || null;
        job.error = null;
        await job.save();

        notificationLogger.log({
          channel: job.channel,
          type: job.type,
          recipient: job.recipientAddress || job.recipientId,
          status: job.status,
        });
      } else {
        if (job.attempts < job.maxAttempts && result.code !== 'EMAIL_PROVIDER_NOT_CONFIGURED') {
          job.status = 'RETRYING';
        } else {
          job.status = 'FAILED';
        }
        job.error = result.error || result.message || 'Provider reported dispatch failure';
        job.providerResponse = result.providerResponse || null;
        await job.save();

        notificationLogger.error({
          channel: job.channel,
          type: job.type,
          recipient: job.recipientAddress || job.recipientId,
          status: job.status,
        }, job.error);
      }
    } catch (error) {
      if (job.attempts < job.maxAttempts) {
        job.status = 'RETRYING';
      } else {
        job.status = 'FAILED';
      }
      job.error = error.message || 'Unexpected provider execution error';
      await job.save();

      notificationLogger.error({
        channel: job.channel,
        type: job.type,
        recipient: job.recipientAddress || job.recipientId,
        status: job.status,
      }, error);
    }
  }

  /**
   * Integrated hook called upon Attendance Finalization.
   * Dispatches notifications for absent students and generates EXACTLY ONE HOD summary.
   */
  async triggerAttendanceFinalized(data) {
    const { session, teacher, absentStudentIds = [], reportFilePath, reportFilename, stats = {} } = data;
    if (!session) return;

    const className = session.classId?.name || 'ECE III Year - Section D';
    const year = session.classId?.year ? `${session.classId.year} Year` : '3rd Year';
    const hour = session.hour || 1;
    let classTakenBy = session.teacherId?.name || teacher?.name;
    const sessionDate = session.date ? new Date(session.date) : new Date();
    const dayOfWeek = sessionDate.getDay() === 0 ? 7 : sessionDate.getDay();
    const classId = session.classId?._id || session.classId;
    const subjectId = session.subjectId?._id || session.subjectId;

    if (!classTakenBy || classTakenBy === 'Prof. Anitha Sharma' || classTakenBy === 'Faculty Member') {
      try {
        const ttEntry = await Timetable.findOne({
          classId,
          $or: [
            { subjectId, hour },
            { subjectId },
            { hour, dayOfWeek },
          ],
        }).populate('teacherId');

        if (ttEntry?.teacherId?.name) {
          classTakenBy = ttEntry.teacherId.name;
        }
      } catch (ttErr) {}
    }

    if (!classTakenBy) {
      classTakenBy = session.teacherId?.name || teacher?.name || 'Faculty Member';
    }

    const subjectName = session.subjectId?.name || 'Digital Signal Processing';
    const presentCount = stats.present ?? session.presentCount ?? 0;
    const departmentId = session.classId?.departmentId || session.subjectId?.departmentId;

    // Collect absent student names and OD student names
    const absentStudentNames = [];
    const odStudentNames = [];

    for (const studentId of absentStudentIds) {
      try {
        const studentInfo = await recipientResolver.resolveStudent(studentId);
        if (studentInfo) {
          absentStudentNames.push(`${studentInfo.name} (${studentInfo.registerNumber})`);
        }
      } catch (err) {}
    }

    try {
      const odAttendanceDocs = await Attendance.find({ sessionId: session._id, status: 'OD' }).populate('studentId', 'name registerNumber');
      for (const doc of odAttendanceDocs) {
        if (doc.studentId?.name) {
          odStudentNames.push(`${doc.studentId.name} (${doc.studentId.registerNumber})`);
        }
      }
    } catch (err) {}

    // Required Plaintext & HTML Email Content (Exact User Spec)
    const emailText = `Class: ${className}
Year: ${year}
Hour: ${hour}
Class Taken By: ${classTakenBy}
Period / Subject: ${subjectName}
Present count: ${presentCount}

Absent student names:
${absentStudentNames.length > 0 ? absentStudentNames.map((n, i) => `${i + 1}. ${n}`).join('\n') : 'None'}

On Duty student names:
${odStudentNames.length > 0 ? odStudentNames.map((n, i) => `${i + 1}. ${n}`).join('\n') : 'None'}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b; background-color: #ffffff;">
        <h2 style="color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin-top: 0; font-size: 18px;">
          KEC SmartAttend — Attendance Session Report
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 14px;">
          <tr><td style="padding: 6px 0; font-weight: bold; width: 35%; color: #475569;">Class:</td><td style="color: #0f172a; font-weight: 600;">${className}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold; color: #475569;">Year:</td><td style="color: #0f172a; font-weight: 600;">${year}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold; color: #475569;">Hour:</td><td style="color: #0f172a; font-weight: 600;">Hour ${hour}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold; color: #475569;">Class Taken By:</td><td style="color: #0f172a; font-weight: 600;">${classTakenBy}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold; color: #475569;">Period / Subject:</td><td style="color: #0f172a; font-weight: 600;">${subjectName}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold; color: #475569;">Present count:</td><td style="color: #16a34a; font-weight: bold;">${presentCount}</td></tr>
        </table>

        <div style="margin-top: 20px;">
          <h4 style="margin: 0 0 6px 0; color: #dc2626; font-size: 13px;">Absent student names (${absentStudentNames.length}):</h4>
          <div style="padding: 10px; background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; font-size: 12px; color: #991b1b; line-height: 1.6;">
            ${absentStudentNames.length > 0 ? absentStudentNames.map((n, i) => `${i + 1}. ${n}`).join('<br/>') : '<em>None</em>'}
          </div>
        </div>

        <div style="margin-top: 16px;">
          <h4 style="margin: 0 0 6px 0; color: #2563eb; font-size: 13px;">On Duty student names (${odStudentNames.length}):</h4>
          <div style="padding: 10px; background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 8px; font-size: 12px; color: #1e40af; line-height: 1.6;">
            ${odStudentNames.length > 0 ? odStudentNames.map((n, i) => `${i + 1}. ${n}`).join('<br/>') : '<em>None</em>'}
          </div>
        </div>

        <p style="margin-top: 24px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          📎 <strong>Attachment:</strong> Official Excel attendance report (.xlsx) for this session is attached.
        </p>
      </div>
    `;

    // 1. Dispatch Attendance Report Email to designated recipient
    const reportEmail = process.env.ATTENDANCE_REPORT_EMAIL || 'kannansriram0910@gmail.com';
    if (config.notifications?.emailEnabled && reportEmail) {
      try {
        await this.trigger({
          type: 'HOD_ATTENDANCE_SUMMARY',
          channels: ['EMAIL'],
          recipientAddress: reportEmail,
          recipientRole: 'ADMIN',
          payload: {
            subject: `Attendance Report: ${className} - Hour ${hour} (${subjectName})`,
            title: `Attendance Report: ${className}`,
            body: emailText,
            html: emailHtml,
            attachmentPath: reportFilePath,
            attachmentName: reportFilename || `${className.replace(/[^a-zA-Z0-9]/g, '_')}_Hour_${hour}_Report.xlsx`,
            className,
            year,
            hour,
            classTakenBy,
            subjectName,
            presentCount,
            absentStudentNames,
            odStudentNames,
          },
        });
      } catch (emailErr) {
        notificationLogger.error({ type: 'EMAIL_REPORT', recipient: reportEmail }, emailErr);
      }
    }

    // 2. Process EXACTLY ONE HOD Attendance Summary Notification (In-App / WhatsApp)
    try {
      const hodInfo = await recipientResolver.resolveHODForDepartment(departmentId);
      if (hodInfo) {
        const hodChannels = (await this.getEnabledChannels('HOD_ATTENDANCE_SUMMARY', 'HOD')).filter(c => c !== 'EMAIL');
        if (hodChannels.length > 0) {
          const hodPayload = {
            className,
            subjectName,
            teacherName: classTakenBy,
            hour,
            date: session.date || new Date(),
            totalStudents: stats.totalStudents || session.totalStudents || 61,
            presentCount: stats.present ?? session.presentCount ?? 0,
            absentCount: stats.absent ?? session.absentCount ?? 0,
            odCount: stats.od ?? session.odCount ?? 0,
          };

          await this.trigger({
            type: 'HOD_ATTENDANCE_SUMMARY',
            channels: hodChannels,
            recipientId: hodInfo.userId,
            recipientRole: 'HOD',
            recipientAddress: hodInfo.phone,
            payload: hodPayload,
          });
        }
      }
    } catch (hodErr) {
      notificationLogger.error({ type: 'HOD_ATTENDANCE_SUMMARY' }, hodErr);
    }

    // 2. Process Absence Alerts per student (Student, Parent, Warden)
    for (const studentId of absentStudentIds) {
      try {
        const studentInfo = await recipientResolver.resolveStudent(studentId);
        if (!studentInfo) continue;

        const parentInfo = await recipientResolver.resolveParentForStudent(studentId);

        const absencePayload = {
          studentId: studentInfo.studentId,
          studentName: studentInfo.name,
          registerNumber: studentInfo.registerNumber,
          subjectName,
          hour,
          date: session.date || new Date(),
          className: studentInfo.className,
          department: studentInfo.departmentName,
          parentName: parentInfo?.name,
          parentPhone: parentInfo?.phone,
          whatsappNumber: parentInfo?.whatsappNumber,
        };

        // Notify Student (Respect rules)
        if (studentInfo.user?._id) {
          const studentChannels = await this.getEnabledChannels('ABSENCE_ALERT', 'STUDENT');
          if (studentChannels.length > 0) {
            await this.trigger({
              type: 'ABSENCE_ALERT',
              channels: studentChannels,
              recipientId: studentInfo.user._id,
              recipientRole: 'STUDENT',
              recipientAddress: studentInfo.email,
              payload: absencePayload,
            });
          }
        }

        // Notify Parent (Respect rules and parent WhatsApp opt-in)
        if (parentInfo) {
          let parentChannels = await this.getEnabledChannels('ABSENCE_ALERT', 'PARENT');
          
          if (!parentInfo.optIn) {
            parentChannels = parentChannels.filter((c) => c !== 'WHATSAPP');
          }

          if (parentChannels.length > 0) {
            await this.trigger({
              type: 'ABSENCE_ALERT',
              channels: parentChannels,
              recipientId: parentInfo.parentId,
              recipientRole: 'PARENT',
              recipientAddress: parentInfo.whatsappNumber || parentInfo.phone,
              payload: absencePayload,
            });
          }
        }

        // Notify Hostel Wardens if student is hosteller
        if (studentInfo.hostelId) {
          const wardenChannels = await this.getEnabledChannels('ABSENCE_ALERT', 'WARDEN');
          if (wardenChannels.length > 0) {
            const wardens = await recipientResolver.resolveWardensForStudent(studentId);
            for (const warden of wardens) {
              await this.trigger({
                type: 'ABSENCE_ALERT',
                channels: wardenChannels,
                recipientId: warden.userId,
                recipientRole: 'WARDEN',
                recipientAddress: warden.email || warden.phone,
                payload: { ...absencePayload, hostel: 'KEC Hostel' },
              });
            }
          }
        }
      } catch (studentErr) {
        notificationLogger.error({ type: 'ABSENCE_ALERT', studentId }, studentErr);
      }
    }
  }

  /**
   * Get notification statistics for Admin dashboard.
   */
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      total,
      queued,
      sent,
      delivered,
      failed,
      retrying,
      simulated,
      inAppCount,
      emailCount,
      whatsappCount,
      todayCount,
    ] = await Promise.all([
      NotificationJob.countDocuments(),
      NotificationJob.countDocuments({ status: 'QUEUED' }),
      NotificationJob.countDocuments({ status: 'SENT' }),
      NotificationJob.countDocuments({ status: 'DELIVERED' }),
      NotificationJob.countDocuments({ status: 'FAILED' }),
      NotificationJob.countDocuments({ status: 'RETRYING' }),
      NotificationJob.countDocuments({ status: 'SIMULATED' }),
      NotificationJob.countDocuments({ channel: 'IN_APP' }),
      NotificationJob.countDocuments({ channel: 'EMAIL' }),
      NotificationJob.countDocuments({ channel: 'WHATSAPP' }),
      NotificationJob.countDocuments({ createdAt: { $gte: today } }),
    ]);

    return {
      overview: {
        total,
        queued,
        sent,
        delivered,
        failed,
        retrying,
        simulated,
        todayCount,
      },
      channels: {
        inApp: { count: inAppCount, status: 'ACTIVE' },
        email: { count: emailCount, status: 'NOT CONFIGURED' },
        whatsapp: { count: whatsappCount, status: 'DEVELOPMENT SIMULATION' },
      },
    };
  }

  /**
   * Get all active notification rules.
   */
  async getRules() {
    await this.seedDefaultRules();
    const rules = await NotificationRule.find().sort({ eventType: 1, recipientRole: 1 });
    return rules;
  }

  /**
   * Update notification rule.
   */
  async updateRule(ruleId, updates) {
    const rule = await NotificationRule.findByIdAndUpdate(ruleId, updates, { new: true });
    return rule;
  }

  /**
   * Get paginated notification jobs for administrative audit.
   */
  async getJobs(filters = {}, page = 1, limit = 20) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.channel) query.channel = filters.channel;
    if (filters.type) query.type = filters.type;
    if (filters.search) {
      query.$or = [
        { jobId: { $regex: filters.search, $options: 'i' } },
        { recipientAddress: { $regex: filters.search, $options: 'i' } },
        { 'payload.studentName': { $regex: filters.search, $options: 'i' } },
        { 'payload.registerNumber': { $regex: filters.search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      NotificationJob.find(query)
        .populate('recipientId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      NotificationJob.countDocuments(query),
    ]);

    return {
      jobs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

module.exports = new NotificationEngine();
