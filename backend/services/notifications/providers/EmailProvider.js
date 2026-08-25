const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const dns = require('dns');
const BaseProvider = require('./BaseProvider');
const config = require('../../../config');

// Explicit IPv4 DNS lookup to guarantee zero IPv6 socket attempts on cloud platforms
const ipv4Lookup = (hostname, options, callback) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  dns.lookup(hostname, { family: 4, all: false }, callback);
};

class EmailProvider extends BaseProvider {
  constructor() {
    super('EMAIL');
    this.isConfigured = false;
    this.transporter = null;
    this.checkConfiguration();
  }

  checkConfiguration() {
    const smtpHost = process.env.SMTP_HOST || config.smtp?.host || 'smtp.gmail.com';
    const smtpUser = process.env.SMTP_USER || config.smtp?.user || 'studentattend2026@gmail.com';
    const smtpPass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS || config.smtp?.password || 'qdjd aadb dnyr slja';
    const smtpPort = parseInt(process.env.SMTP_PORT || config.smtp?.port, 10) || 587;
    const smtpSecure = process.env.SMTP_SECURE === 'true' || config.smtp?.secure === true;

    const hasSmtp = Boolean(smtpHost && smtpUser && smtpPass);
    this.isConfigured = config.notifications?.emailEnabled !== false && hasSmtp;

    if (this.isConfigured && !this.transporter) {
      try {
        const isGmail = smtpHost.includes('gmail.com') || (!smtpHost && smtpUser.includes('@gmail.com'));
        
        const transportOptions = isGmail
          ? {
              host: 'smtp.gmail.com',
              port: 587,
              secure: false, // Use STARTTLS
              lookup: ipv4Lookup, // CRITICAL: Guarantees IPv4 socket resolution
              auth: {
                user: smtpUser,
                pass: smtpPass,
              },
              connectionTimeout: 15000,
              greetingTimeout: 15000,
              socketTimeout: 20000,
              tls: {
                rejectUnauthorized: false,
              },
            }
          : {
              host: smtpHost,
              port: smtpPort,
              secure: smtpSecure,
              lookup: ipv4Lookup, // Guarantees IPv4 socket resolution
              auth: {
                user: smtpUser,
                pass: smtpPass,
              },
              connectionTimeout: 15000,
              greetingTimeout: 15000,
              socketTimeout: 20000,
              tls: {
                rejectUnauthorized: false,
              },
            };

        this.transporter = nodemailer.createTransport(transportOptions);
      } catch (err) {
        console.error('[EmailProvider] Error initializing nodemailer transport:', err.message);
        this.isConfigured = false;
        this.transporter = null;
      }
    }
  }

  async verifyConnection() {
    this.checkConfiguration();
    if (!this.isConfigured || !this.transporter) {
      return { success: false, error: 'Email provider is not configured' };
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'SMTP connection verified successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  validate(job) {
    const baseValidation = super.validate(job);
    if (!baseValidation.isValid) return baseValidation;

    const email = job.recipientAddress || job.payload?.recipientEmail || job.payload?.email;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { isValid: false, error: 'Valid recipient email address is required' };
    }
    return { isValid: true };
  }

  async send(job) {
    const validation = this.validate(job);
    if (!validation.isValid) {
      return {
        success: false,
        status: 'FAILED',
        error: validation.error,
      };
    }

    this.checkConfiguration();

    if (!this.isConfigured || !this.transporter) {
      return {
        success: false,
        status: 'FAILED',
        code: 'EMAIL_PROVIDER_NOT_CONFIGURED',
        message: 'Email provider is prepared but not configured. Configure SMTP credentials to activate.',
        deliveredAt: null,
      };
    }

    try {
      const recipient = job.recipientAddress || job.payload?.recipientEmail;
      const subject = job.payload?.subject || job.payload?.title || 'Attendance Session Report — Kongu Engineering College';
      const textBody = job.payload?.body || job.payload?.message || '';
      const htmlBody = job.payload?.html || null;

      // Handle file attachments (e.g. session Excel report)
      const attachments = [];
      if (job.payload?.attachmentBuffer) {
        attachments.push({
          filename: job.payload.attachmentName || 'KEC_Attendance_Report.xlsx',
          content: Buffer.isBuffer(job.payload.attachmentBuffer) ? job.payload.attachmentBuffer : Buffer.from(job.payload.attachmentBuffer),
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
      } else if (job.payload?.attachmentPath && fs.existsSync(job.payload.attachmentPath)) {
        attachments.push({
          filename: job.payload.attachmentName || path.basename(job.payload.attachmentPath),
          path: job.payload.attachmentPath,
        });
      } else if (job.payload?.attachments && Array.isArray(job.payload.attachments)) {
        for (const att of job.payload.attachments) {
          if (att.content) {
            attachments.push({
              filename: att.filename || 'Attachment.xlsx',
              content: att.content,
              contentType: att.contentType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
          } else if (att.path && fs.existsSync(att.path)) {
            attachments.push({
              filename: att.filename || path.basename(att.path),
              path: att.path,
            });
          }
        }
      }

      const mailOptions = {
        from: `"SmartAttend | Kongu Engineering College" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
        to: recipient,
        subject,
        text: textBody,
        ...(htmlBody ? { html: htmlBody } : {}),
        attachments,
      };

      console.log(`[EmailProvider] Dispatching email to ${recipient} (Attachments: ${attachments.length})...`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EmailProvider] Email accepted by SMTP server! Message ID: ${info.messageId}`);

      return {
        success: true,
        status: 'SENT',
        deliveredAt: new Date(),
        providerResponse: {
          messageId: info.messageId,
          response: info.response,
          accepted: info.accepted,
          rejected: info.rejected,
          attachmentsCount: attachments.length,
          attachmentNames: attachments.map((a) => a.filename),
        },
      };
    } catch (error) {
      console.error('[EmailProvider] SMTP Dispatch Error:', error.message);
      return {
        success: false,
        status: 'FAILED',
        error: error.message || 'Email delivery failed',
      };
    }
  }

  getStatus() {
    this.checkConfiguration();
    return {
      channel: this.channelName,
      enabled: Boolean(config.notifications?.emailEnabled),
      mode: this.isConfigured ? 'active' : 'unconfigured',
      status: this.isConfigured ? 'READY' : 'EMAIL_PROVIDER_NOT_CONFIGURED',
      sender: process.env.EMAIL_FROM || process.env.SMTP_USER || null,
    };
  }
}

module.exports = EmailProvider;
