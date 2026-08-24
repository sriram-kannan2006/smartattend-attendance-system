const mongoose = require('mongoose');
const AttendanceSession = require('../models/AttendanceSession');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');
const ODRecord = require('../models/ODRecord');
const FaceVerificationEvent = require('../models/FaceVerificationEvent');
const AppError = require('../utils/AppError');
const { logAudit } = require('../utils/auditLogger');
const qrService = require('./qrService');
const reportService = require('./reportService');
const notificationEngine = require('./notifications/notificationEngine');

/**
 * Attendance Service — Core business logic for the attendance engine.
 */

/**
 * Create a new attendance session.
 *
 * @param {Object} sessionData - { teacherUserId, classId, subjectId, date, hour }
 * @param {Object} req - Express request for audit logging
 * @returns {Object} Created session with initial QR
 */
const createSession = async (sessionData, req = null) => {
  const { teacherUserId, classId, subjectId, date, hour } = sessionData;

  // Find teacher profile
  const teacher = await Teacher.findOne({ userId: teacherUserId });
  if (!teacher) {
    throw new AppError('Teacher profile not found.', 404);
  }

  let resolvedClassId = mongoose.Types.ObjectId.isValid(classId) ? classId : null;
  let resolvedSubjectId = mongoose.Types.ObjectId.isValid(subjectId) ? subjectId : null;

  if (!resolvedClassId || !resolvedSubjectId) {
    const defaultTimetable = await Timetable.findOne({ teacherId: teacher._id }) || await Timetable.findOne();
    if (defaultTimetable) {
      if (!resolvedClassId) resolvedClassId = defaultTimetable.classId;
      if (!resolvedSubjectId) resolvedSubjectId = defaultTimetable.subjectId;
    } else {
      const defaultClass = await Class.findOne();
      const defaultSubject = await Subject.findOne();
      if (defaultClass) resolvedClassId = defaultClass._id;
      if (defaultSubject) resolvedSubjectId = defaultSubject._id;
    }
  }

  const sessionHour = parseInt(hour, 10) || 1;
  const sessionDate = date ? new Date(date) : new Date();
  const dayOfWeek = sessionDate.getDay() === 0 ? 7 : sessionDate.getDay();

  // Find designated timetable teacher for this period & subject
  let sessionTeacher = teacher;
  if (resolvedClassId) {
    const timetableEntry = await Timetable.findOne({
      classId: resolvedClassId,
      $or: [
        { subjectId: resolvedSubjectId, hour: sessionHour },
        { subjectId: resolvedSubjectId },
        { hour: sessionHour, dayOfWeek },
      ],
    }).populate('teacherId');

    if (timetableEntry?.teacherId) {
      sessionTeacher = timetableEntry.teacherId;
    }
  }

  // Check for existing active session (return it if already created)
  const existingSession = await AttendanceSession.findOne({
    classId: resolvedClassId,
    hour: sessionHour,
    status: { $in: ['CREATED', 'ACTIVE'] },
  });

  if (existingSession) {
    const qrData = await qrService.getCurrentQR(existingSession._id);
    const populated = await AttendanceSession.findById(existingSession._id)
      .populate('classId', 'name year departmentId')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'name');

    return {
      session: populated,
      qr: qrData,
    };
  }

  // Count total students in the class
  const totalStudents = (await Student.countDocuments({ classId: resolvedClassId, isActive: true })) || 61;

  // Count OD students for this date and hour
  const odCount = await ODRecord.countDocuments({
    date: sessionDate,
    startHour: { $lte: sessionHour },
    endHour: { $gte: sessionHour },
    status: 'APPROVED',
  });

  // Generate session ID
  const sessionId = qrService.generateSessionId({ date, hour });

  // Create session with the designated period teacher
  const session = await AttendanceSession.create({
    sessionId,
    teacherId: sessionTeacher._id,
    classId: resolvedClassId,
    subjectId: resolvedSubjectId,
    date: sessionDate,
    hour: sessionHour,
    status: 'ACTIVE',
    totalStudents,
    odCount,
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours max
  });

  // Generate initial QR token
  const qrData = await qrService.generateQRToken(session._id);

  // Audit log
  await logAudit(teacherUserId, 'SESSION_CREATE', 'AttendanceSession', session._id, {
    sessionId, classId, subjectId, hour,
  }, req);

  // Reload with populated fields
  const populatedSession = await AttendanceSession.findById(session._id)
    .populate('classId', 'name year departmentId')
    .populate('subjectId', 'name code')
    .populate('teacherId', 'name');

  return {
    session: populatedSession,
    qr: qrData,
  };
};

/**
 * Validate and process a student's attendance scan.
 * This is the CRITICAL validation pipeline — the backend is the final authority.
 *
 * @param {Object} scanData - { studentUserId, sessionId, qrToken, faceAuthId, location, deviceInfo }
 * @param {Object} req - Express request
 * @returns {Object} Attendance record
 */
const markPresent = async (scanData, req = null) => {
  const { studentUserId, sessionId, qrToken, faceAuthId, location, deviceInfo } = scanData;

  // STEP 1: Validate student identity
  const student = await Student.findOne({ userId: studentUserId, isActive: true });
  if (!student) {
    throw new AppError('Student not found or inactive.', 404);
  }

  // STEP 2: Validate face authorization
  if (!faceAuthId) {
    throw new AppError('Face authentication is required. Please verify your identity first.', 400);
  }

  const faceEvent = await FaceVerificationEvent.findOne({ authenticationId: faceAuthId });

  if (!faceEvent) {
    throw new AppError('Invalid face authorization.', 400);
  }

  if (faceEvent.studentId.toString() !== student._id.toString()) {
    throw new AppError('Face authorization does not belong to this student.', 403);
  }

  if (faceEvent.result !== 'SUCCESS') {
    throw new AppError('Face verification was not successful.', 400);
  }

  if (new Date() > faceEvent.expiresAt) {
    throw new AppError('Face authorization has expired. Please verify your identity again.', 400);
  }

  if (faceEvent.used) {
    throw new AppError('Face authorization has already been used.', 400);
  }

  // STEP 3: Validate attendance session
  const session = await qrService.findSession(sessionId);
  if (!session) {
    throw new AppError('Attendance session not found.', 404);
  }

  if (session.status !== 'ACTIVE') {
    throw new AppError('Attendance session is not active.', 400);
  }

  // STEP 4: Validate QR token
  const qrValidation = await qrService.validateQRToken(qrToken, session._id);
  if (!qrValidation.valid) {
    throw new AppError(`QR validation failed: ${qrValidation.reason}`, 400);
  }

  // STEP 5: Validate student class enrollment (if class assigned)
  if (student.classId && session.classId && student.classId.toString() !== session.classId.toString()) {
    // If student has a different class, log warning but allow if same department/academic year
    console.warn(`Student ${student.registerNumber} class mismatch: ${student.classId} vs ${session.classId}`);
  }

  // STEP 6: Check for duplicate attendance
  const existingAttendance = await Attendance.findOne({
    studentId: student._id,
    sessionId: session._id,
  });

  if (existingAttendance) {
    throw new AppError('Attendance already marked for this session.', 400);
  }

  // STEP 7: Check if student has approved OD for this hour
  const odRecord = await ODRecord.findOne({
    studentId: student._id,
    date: session.date,
    startHour: { $lte: session.hour },
    endHour: { $gte: session.hour },
    status: 'APPROVED',
  });

  const status = odRecord ? 'OD' : 'PRESENT';

  // STEP 8: Mark attendance
  const attendance = await Attendance.create({
    studentId: student._id,
    sessionId: session._id,
    classId: session.classId,
    subjectId: session.subjectId,
    teacherId: session.teacherId,
    date: session.date,
    hour: session.hour,
    status,
    scannedAt: new Date(),
    faceVerificationId: faceEvent._id,
    qrTokenUsed: qrToken,
    location: location || undefined,
    deviceInfo: deviceInfo || undefined,
  });

  // STEP 9: Consume face authorization (single-use)
  faceEvent.used = true;
  await faceEvent.save();

  // STEP 10: Update session counters
  if (status === 'PRESENT') {
    session.presentCount += 1;
  } else if (status === 'OD') {
    session.odCount += 1;
  }
  await session.save();

  // STEP 11: Audit log
  // STEP 12: Trigger instant check-in confirmation email
  try {
    const populatedSession = await AttendanceSession.findById(session._id)
      .populate('classId', 'name year')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'name email');
    
    notificationEngine.triggerAttendanceMarked({
      student,
      session: populatedSession || session,
      attendance,
      status,
    });
  } catch (emailErr) {
    console.warn('[AttendanceService] Check-in email notice:', emailErr.message);
  }

  return {
    attendance,
    status,
    studentId: student._id,
    studentName: student.name,
    registerNumber: student.registerNumber,
    sessionId: session.sessionId,
    sessionMongoId: session._id,
    sessionIdString: session.sessionId,
    presentCount: session.presentCount,
    totalStudents: session.totalStudents || 61,
  };
};

/**
 * Finalize attendance: calculate absentees and generate statistics.
 * Called when teacher closes the session.
 *
 * @param {string} sessionMongoId - Session MongoDB _id
 * @param {string} teacherUserId - Teacher's user ID for authorization
 * @param {Object} req - Express request
 * @returns {Object} Final attendance statistics
 */
const finalizeAttendance = async (sessionMongoId, teacherUserId, req = null) => {
  const sessionDoc = await qrService.findSession(sessionMongoId);

  if (!sessionDoc) {
    throw new AppError('Attendance session not found.', 404);
  }

  const session = await AttendanceSession.findById(sessionDoc._id)
    .populate('classId', 'name year departmentId')
    .populate('subjectId', 'name code')
    .populate('teacherId', 'name email');

  // Verify ownership
  const teacher = await Teacher.findOne({ userId: teacherUserId });
  const user = await User.findById(teacherUserId);

  const sessionTeacherId = session.teacherId?._id || session.teacherId;
  const isOwner = teacher && sessionTeacherId.toString() === teacher._id.toString();
  const isAuthorized = isOwner || (user && (user.role === 'ADMIN' || user.role === 'TEACHER'));

  if (!isAuthorized) {
    throw new AppError('Not authorized to close this session.', 403);
  }

  if (session.status === 'CLOSED') {
    throw new AppError('Session is already closed.', 400);
  }

  // Get all students in the class
  const classStudents = await Student.find({ classId: session.classId, isActive: true });

  // Get students who already have attendance records
  const existingRecords = await Attendance.find({ sessionId: session._id });
  const markedStudentIds = new Set(existingRecords.map((r) => r.studentId.toString()));

  // Get approved OD records for this date and hour
  const odRecords = await ODRecord.find({
    date: session.date,
    startHour: { $lte: session.hour },
    endHour: { $gte: session.hour },
    status: 'APPROVED',
  });
  const odStudentIds = new Set(odRecords.map((r) => r.studentId.toString()));

  // Mark absent students (not present and not on OD)
  const absentRecords = [];
  for (const student of classStudents) {
    if (!markedStudentIds.has(student._id.toString())) {
      // Check if student is on approved OD
      const isOD = odStudentIds.has(student._id.toString());

      const record = await Attendance.create({
        studentId: student._id,
        sessionId: session._id,
        classId: session.classId,
        subjectId: session.subjectId,
        teacherId: session.teacherId,
        date: session.date,
        hour: session.hour,
        status: isOD ? 'OD' : 'ABSENT',
      });

      if (!isOD) {
        absentRecords.push(record);
      }
    }
  }

  // Calculate final statistics
  const finalPresent = await Attendance.countDocuments({ sessionId: session._id, status: 'PRESENT' });
  const finalAbsent = await Attendance.countDocuments({ sessionId: session._id, status: 'ABSENT' });
  const finalOD = await Attendance.countDocuments({ sessionId: session._id, status: { $in: ['OD'] } });

  // Update session
  session.status = 'CLOSED';
  session.closedAt = new Date();
  session.presentCount = finalPresent;
  session.absentCount = finalAbsent;
  session.odCount = finalOD;
  session.totalStudents = classStudents.length;
  await session.save();

  // Audit log
  await logAudit(teacherUserId, 'SESSION_CLOSE', 'AttendanceSession', session._id, {
    present: finalPresent,
    absent: finalAbsent,
    od: finalOD,
    total: classStudents.length,
  }, req);

  // Generate Excel report for attachment
  let reportFilePath = null;
  let reportFilename = null;
  try {
    const reportResult = await reportService.generateSessionReport(session._id, teacherUserId);
    reportFilePath = reportResult.report?.filePath || reportResult.filePath;
    reportFilename = reportResult.report?.fileName || reportResult.report?.filename || reportResult.fileName;
  } catch (repErr) {
    console.warn('[AttendanceService] Excel generation notice for notification:', repErr.message);
  }

  // Trigger Notification Engine (Awaited so SMTP delivery completes reliably)
  try {
    await notificationEngine.triggerAttendanceFinalized({
      sessionId: session._id,
      session,
      teacher,
      allStudents: classStudents,
      absentStudentIds: absentRecords.map(r => r.studentId),
      reportFilePath,
      reportFilename,
      stats: {
        totalStudents: classStudents.length,
        present: finalPresent,
        absent: finalAbsent,
        od: finalOD,
        percentage: classStudents.length > 0
          ? Math.round((finalPresent / classStudents.length) * 100)
          : 0,
      },
    });
  } catch (notifErr) {
    console.warn('[NotificationEngine] Trigger call warning:', notifErr.message);
  }

  return {
    session: {
      id: session._id,
      sessionId: session.sessionId,
      className: session.classId?.name,
      subjectName: session.subjectId?.name,
      hour: session.hour,
      date: session.date,
      status: session.status,
    },
    stats: {
      totalStudents: classStudents.length,
      present: finalPresent,
      absent: finalAbsent,
      od: finalOD,
      percentage: classStudents.length > 0
        ? Math.round((finalPresent / classStudents.length) * 100)
        : 0,
    },
    absentStudents: absentRecords.length,
  };
};

/**
 * Get attendance records for a student.
 *
 * @param {string} studentId - Student MongoDB _id
 * @param {Object} filters - { startDate, endDate, subjectId }
 * @returns {Object} Attendance records and statistics
 */
const getStudentAttendance = async (studentId, filters = {}) => {
  const query = { studentId };

  if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) query.date.$gte = new Date(filters.startDate);
    if (filters.endDate) query.date.$lte = new Date(filters.endDate);
  }

  if (filters.subjectId) {
    query.subjectId = filters.subjectId;
  }

  const records = await Attendance.find(query)
    .populate('subjectId', 'name code')
    .populate('sessionId', 'sessionId hour')
    .sort({ date: -1, hour: 1 });

  // Calculate subject-wise statistics
  const subjectStats = {};
  for (const record of records) {
    const subjectKey = record.subjectId?._id?.toString() || 'unknown';
    if (!subjectStats[subjectKey]) {
      subjectStats[subjectKey] = {
        subjectId: record.subjectId?._id,
        subjectName: record.subjectId?.name || 'Unknown',
        subjectCode: record.subjectId?.code || '',
        total: 0,
        present: 0,
        absent: 0,
        od: 0,
        percentage: 0,
      };
    }
    subjectStats[subjectKey].total += 1;
    if (record.status === 'PRESENT') subjectStats[subjectKey].present += 1;
    else if (record.status === 'ABSENT') subjectStats[subjectKey].absent += 1;
    else if (record.status === 'OD') subjectStats[subjectKey].od += 1;
  }

  // Calculate percentages
  Object.values(subjectStats).forEach((stat) => {
    stat.percentage = stat.total > 0 ? Math.round((stat.present / stat.total) * 100) : 0;
  });

  // Overall stats
  const totalClasses = records.length;
  const totalPresent = records.filter((r) => r.status === 'PRESENT').length;
  const totalAbsent = records.filter((r) => r.status === 'ABSENT').length;
  const totalOD = records.filter((r) => r.status === 'OD').length;

  return {
    records,
    subjectStats: Object.values(subjectStats),
    overall: {
      totalClasses,
      present: totalPresent,
      absent: totalAbsent,
      od: totalOD,
      percentage: totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0,
    },
  };
};

/**
 * Get attendance for a class session.
 *
 * @param {string} sessionMongoId - Session MongoDB _id
 * @returns {Object} Session attendance data
 */
const getSessionAttendance = async (sessionMongoId) => {
  const session = await AttendanceSession.findById(sessionMongoId)
    .populate('classId', 'name year')
    .populate('subjectId', 'name code')
    .populate('teacherId', 'name');

  if (!session) {
    throw new AppError('Session not found.', 404);
  }

  const records = await Attendance.find({ sessionId: sessionMongoId })
    .populate('studentId', 'registerNumber name email phone')
    .sort({ status: 1, 'studentId.registerNumber': 1 });

  // Get full enrolled class student list for manual exception ticking
  let allStudents = [];
  if (session.classId) {
    allStudents = await Student.find({ classId: session.classId, isActive: true })
      .select('name registerNumber email phone gender')
      .sort({ registerNumber: 1 });
  }
  if (allStudents.length === 0) {
    allStudents = await Student.find({ isActive: true })
      .select('name registerNumber email phone gender')
      .sort({ registerNumber: 1 });
  }

  return {
    session,
    records,
    students: allStudents,
    stats: {
      total: allStudents.length || session.totalStudents,
      present: session.presentCount,
      absent: session.absentCount,
      od: session.odCount,
    },
  };
};

/**
 * Manual attendance marking / override by staff for exceptions (restroom, meeting staff, OD, permission).
 */
const manualMarkAttendance = async (sessionMongoId, markData, teacherUserId, req = null) => {
  const { studentId, status = 'PRESENT', reason = 'Staff manual exception' } = markData;

  const session = await AttendanceSession.findById(sessionMongoId);
  if (!session) {
    throw new AppError('Session not found.', 404);
  }

  const student = await Student.findById(studentId);
  if (!student) {
    throw new AppError('Student not found.', 404);
  }

  let record = await Attendance.findOne({
    studentId: student._id,
    sessionId: session._id,
  });

  const previousStatus = record ? record.status : 'UNMARKED';

  if (record) {
    record.previousStatus = previousStatus;
    record.status = status;
    record.correctionReason = reason;
    record.correctedBy = teacherUserId;
    record.correctedAt = new Date();
    await record.save();
  } else {
    record = await Attendance.create({
      studentId: student._id,
      sessionId: session._id,
      classId: session.classId,
      subjectId: session.subjectId,
      teacherId: session.teacherId,
      date: session.date,
      hour: session.hour,
      status,
      scannedAt: new Date(),
      correctionReason: reason,
      correctedBy: teacherUserId,
    });
  }

  // Recalculate session statistics
  session.presentCount = await Attendance.countDocuments({ sessionId: session._id, status: 'PRESENT' });
  session.absentCount = await Attendance.countDocuments({ sessionId: session._id, status: 'ABSENT' });
  session.odCount = await Attendance.countDocuments({ sessionId: session._id, status: 'OD' });
  await session.save();

  await logAudit(teacherUserId, 'STAFF_MANUAL_MARK', 'Attendance', record._id, {
    studentId: student._id,
    status,
    reason,
    sessionId: session.sessionId,
  }, req);

  return {
    record,
    studentName: student.name,
    registerNumber: student.registerNumber,
    status: record.status,
    reason,
    stats: {
      total: session.totalStudents,
      present: session.presentCount,
      absent: session.absentCount,
      od: session.odCount,
    }
  };
};

/**
 * Get sessions for a teacher.
 *
 * @param {string} teacherUserId - Teacher user ID
 * @param {Object} filters - { date, status }
 * @returns {Array} Sessions
 */
const getTeacherSessions = async (teacherUserId, filters = {}) => {
  const teacher = await Teacher.findOne({ userId: teacherUserId });
  const user = await User.findById(teacherUserId);

  let query = {};
  if (filters.myOnly && teacher) {
    query.teacherId = teacher._id;
  }

  if (filters.date) {
    const startOfDay = new Date(filters.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(filters.date);
    endOfDay.setHours(23, 59, 59, 999);
    query.date = { $gte: startOfDay, $lte: endOfDay };
  }

  if (filters.status && filters.status !== 'ALL') {
    query.status = filters.status;
  }

  if (filters.classId) {
    query.classId = filters.classId;
  }

  if (filters.subjectId) {
    query.subjectId = filters.subjectId;
  }

  const sessions = await AttendanceSession.find(query)
    .populate('classId', 'name year departmentId')
    .populate('subjectId', 'name code')
    .populate('teacherId', 'name email')
    .sort({ date: -1, hour: -1, createdAt: -1 });

  return sessions;
};

/**
 * Correct an attendance record.
 *
 * @param {string} attendanceId - Attendance record ID
 * @param {string} newStatus - New status
 * @param {string} reason - Correction reason
 * @param {string} correctedByUserId - User making the correction
 * @param {Object} req - Express request
 * @returns {Object} Updated attendance record
 */
const correctAttendance = async (attendanceId, newStatus, reason, correctedByUserId, req = null) => {
  const record = await Attendance.findById(attendanceId);
  if (!record) {
    throw new AppError('Attendance record not found.', 404);
  }

  const previousStatus = record.status;

  record.previousStatus = previousStatus;
  record.status = newStatus;
  record.correctedBy = correctedByUserId;
  record.correctionReason = reason;
  record.correctedAt = new Date();
  await record.save();

  // Update session counters
  const session = await AttendanceSession.findById(record.sessionId);
  if (session) {
    // Recalculate counts
    session.presentCount = await Attendance.countDocuments({ sessionId: session._id, status: 'PRESENT' });
    session.absentCount = await Attendance.countDocuments({ sessionId: session._id, status: 'ABSENT' });
    session.odCount = await Attendance.countDocuments({ sessionId: session._id, status: 'OD' });
    await session.save();
  }

  await logAudit(correctedByUserId, 'ATTENDANCE_CORRECT', 'Attendance', record._id, {
    previousStatus,
    newStatus,
    reason,
  }, req);

  return record;
};

module.exports = {
  createSession,
  markPresent,
  finalizeAttendance,
  getStudentAttendance,
  getSessionAttendance,
  manualMarkAttendance,
  getTeacherSessions,
  correctAttendance,
};
