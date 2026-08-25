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

const axios = require('axios');

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
    const hasHttpsKey = Boolean(process.env.RESEND_API_KEY || process.env.BREVO_API_KEY || process.env.SENDGRID_API_KEY);

    const hasSmtp = Boolean(smtpHost && smtpUser && smtpPass) || hasHttpsKey;
    this.isConfigured = config.notifications?.emailEnabled !== false && hasSmtp;
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

    if (process.env.RESEND_API_KEY || process.env.BREVO_API_KEY) {
      return { success: true, message: 'HTTPS REST Email API configured and ready (Port 443)' };
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
      fromEmail: senderEmail,
      to: recipient,
      subject: subject,
      text: textBody,
      html: htmlBody || textBody.replace(/\n/g, '<br/>'),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    // 1. Try HTTPS REST API over Port 443 if configured (Bypasses all cloud port blocks)
    const httpsResult = await this.sendViaHttpsRest(job, mailOptions);
    if (httpsResult && httpsResult.success) {
      return httpsResult;
    }

    // 2. Direct SMTP with Google IPv4 pool fallback
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

    console.error(`[EmailProvider] All delivery channels failed for ${recipient}:`, lastError.message);
    return {
      success: false,
      status: 'FAILED',
      code: 'EMAIL_SEND_FAILED',
      error: lastError.message,
      deliveredAt: null,
    };
  }

  async sendViaHttpsRest(job, mailOptions) {
    const resendApiKey = process.env.RESEND_API_KEY || config.smtp?.resendApiKey;
    const brevoApiKey = process.env.BREVO_API_KEY || config.smtp?.brevoApiKey;

    if (resendApiKey) {
      try {
        console.log(`[EmailProvider] Dispatching email via Resend HTTPS API (Port 443)...`);
        const res = await axios.post(
          'https://api.resend.com/emails',
          {
            from: 'KEC SmartAttend <onboarding@resend.dev>',
            to: [mailOptions.to],
            subject: mailOptions.subject,
            html: mailOptions.html,
            attachments: mailOptions.attachments?.map((att) => ({
              filename: att.filename,
              content: att.content ? (Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content) : undefined,
              path: att.path,
            })),
          },
          {
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 15000,
          }
        );

        return {
          success: true,
          status: 'SENT',
          code: 'EMAIL_SENT',
          messageId: res.data?.id,
          deliveredAt: new Date(),
        };
      } catch (err) {
        console.warn(`[EmailProvider] Resend HTTPS API warning: ${err.response?.data?.message || err.message}`);
      }
    }

    if (brevoApiKey) {
      try {
        console.log(`[EmailProvider] Dispatching email via Brevo HTTPS API (Port 443)...`);
        const res = await axios.post(
          'https://api.brevo.com/v3/smtp/email',
          {
            sender: { name: 'KEC SmartAttend', email: mailOptions.fromEmail || 'studentattend2026@gmail.com' },
            to: [{ email: mailOptions.to }],
            subject: mailOptions.subject,
            htmlContent: mailOptions.html,
            attachment: mailOptions.attachments?.map((att) => ({
              name: att.filename,
              content: att.content ? (Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content) : undefined,
            })),
          },
          {
            headers: {
              'api-key': brevoApiKey,
              'Content-Type': 'application/json',
            },
            timeout: 15000,
          }
        );

        return {
          success: true,
          status: 'SENT',
          code: 'EMAIL_SENT',
          messageId: res.data?.messageId,
          deliveredAt: new Date(),
        };
      } catch (err) {
        console.warn(`[EmailProvider] Brevo HTTPS API warning: ${err.response?.data?.message || err.message}`);
      }
    }

    return null;
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
