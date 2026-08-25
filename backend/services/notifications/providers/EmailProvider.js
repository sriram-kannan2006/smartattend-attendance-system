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
              port: 465,
              secure: true, // Direct SSL on port 465 (Allowed through Render firewall)
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
              port: smtpPort || 465,
              secure: smtpSecure !== false,
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

  async getTransporter(targetHost = '74.125.130.108') {
    const smtpHost = process.env.SMTP_HOST || config.smtp?.host || 'smtp.gmail.com';
    const smtpUser = process.env.SMTP_USER || config.smtp?.user || 'studentattend2026@gmail.com';
    const smtpPass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS || config.smtp?.password || 'qdjd aadb dnyr slja';
    const isGmail = smtpHost.includes('gmail.com') || (!smtpHost && smtpUser.includes('@gmail.com'));

    const transportOptions = {
      host: isGmail ? targetHost : smtpHost,
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        servername: isGmail ? 'smtp.gmail.com' : smtpHost,
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    };

    return nodemailer.createTransport(transportOptions);
  }

  async verifyConnection() {
    this.checkConfiguration();
    if (!this.isConfigured) {
      return { success: false, error: 'Email provider is not configured' };
    }

    try {
      const transporter = await this.getTransporter();
      await transporter.verify();
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

    if (!this.isConfigured) {
      return {
        success: false,
        status: 'FAILED',
        code: 'EMAIL_PROVIDER_NOT_CONFIGURED',
        message: 'Email provider is prepared but not configured. Configure SMTP credentials to activate.',
        deliveredAt: null,
      };
    }

    const recipient = job.recipientAddress || job.payload?.recipientEmail;
    const subject = job.payload?.subject || job.payload?.title || 'Attendance Session Report — Kongu Engineering College';
    const textBody = job.payload?.body || job.payload?.message || '';
    const htmlBody = job.payload?.html || null;

    // Handle file attachments (e.g. session Excel report)
    const attachments = [];
    if (job.payload?.attachmentBuffer) {
      attachments.push({
        filename: job.payload.attachmentName || 'Attendance_Report.xlsx',
        content: job.payload.attachmentBuffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    } else if (job.payload?.attachmentPath && fs.existsSync(job.payload.attachmentPath)) {
      attachments.push({
        filename: job.payload.attachmentName || path.basename(job.payload.attachmentPath),
        path: job.payload.attachmentPath,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    }

    const senderEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || config.smtp?.from || 'studentattend2026@gmail.com';

    const mailOptions = {
      from: `"KEC SmartAttend" <${senderEmail}>`,
      to: recipient,
      subject: subject,
      text: textBody,
      html: htmlBody || textBody.replace(/\n/g, '<br/>'),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const GMAIL_IPV4_POOL = ['74.125.130.108', '173.194.76.108', '108.177.127.108', '142.250.190.108'];
    let lastError = null;

    for (const hostIp of GMAIL_IPV4_POOL) {
      try {
        console.log(`[EmailProvider] Dispatching email to ${recipient} via IPv4 host ${hostIp}:465 (Attachments: ${attachments.length})...`);
        const transporter = await this.getTransporter(hostIp);
        const sendResult = await transporter.sendMail(mailOptions);
        console.log(`[EmailProvider] Email accepted by SMTP server! Message ID: ${sendResult.messageId}`);

        return {
          success: true,
          status: 'SENT',
          code: 'EMAIL_SENT',
          messageId: sendResult.messageId,
          response: sendResult.response,
          deliveredAt: new Date(),
          metadata: {
            recipient,
            subject,
            host: hostIp,
            attachmentsCount: attachments.length,
          },
        };
      } catch (error) {
        lastError = error;
        console.warn(`[EmailProvider] Delivery via ${hostIp} failed (${error.message}). Trying fallback IPv4...`);
      }
    }

    console.error(`[EmailProvider] All IPv4 hosts failed for ${recipient}:`, lastError.message);
    return {
      success: false,
      status: 'FAILED',
      code: 'EMAIL_SEND_FAILED',
      error: lastError.message,
      deliveredAt: null,
    };
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
