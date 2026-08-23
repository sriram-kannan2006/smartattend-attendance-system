const BaseProvider = require('./BaseProvider');
const config = require('../../../config');

/**
 * MockWhatsAppProvider — Development / Simulation Provider
 *
 * IMPORTANT:
 * - There is currently NO WhatsApp Business account configured.
 * - This provider strictly SIMULATES WhatsApp notifications for testing the architecture.
 * - DO NOT send real WhatsApp messages.
 * - DO NOT use WhatsApp Web automation, Selenium, or unofficial APIs.
 */
class MockWhatsAppProvider extends BaseProvider {
  constructor() {
    super('WHATSAPP');
    this.mode = 'DEVELOPMENT_SIMULATION';
  }

  validate(job) {
    const baseValidation = super.validate(job);
    if (!baseValidation.isValid) return baseValidation;

    const phone = job.recipientAddress || job.payload?.whatsappNumber || job.payload?.parentPhone || job.payload?.phone;
    if (!phone) {
      return { isValid: false, error: 'Recipient phone or WhatsApp number is required' };
    }

    // Clean phone number
    const cleanPhone = String(phone).replace(/[^\d+]/g, '');
    if (cleanPhone.length < 10) {
      return { isValid: false, error: 'Invalid phone number format (minimum 10 digits required)' };
    }

    return { isValid: true, cleanPhone };
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

    const recipient = validation.cleanPhone || job.recipientAddress;
    const type = job.type || 'GENERAL_NOTIFICATION';
    const payload = job.payload || {};

    // Mask phone number for security in logs (e.g., +91 95852 ****)
    const maskedPhone = recipient.length > 6 
      ? recipient.slice(0, recipient.length - 4).replace(/\d/g, (d, idx) => idx < 4 ? d : 'X') + recipient.slice(-4)
      : '***-***-****';

    // Output structured simulation log
    console.log('\n==================================================');
    console.log('[NOTIFICATION] [WHATSAPP_SIMULATION]');
    console.log(`Type:       ${type}`);
    console.log(`Channel:    WHATSAPP`);
    console.log(`Recipient:  ${maskedPhone}`);
    console.log(`Payload:    ${JSON.stringify({
      studentName: payload.studentName,
      registerNumber: payload.registerNumber,
      subject: payload.subjectName || payload.subject,
      hour: payload.hour,
      date: payload.date,
      className: payload.className,
    })}`);
    console.log(`Status:     SIMULATED`);
    console.log(`Note:       No real WhatsApp message was sent. (Development Mode)`);
    console.log('==================================================\n');

    return {
      success: true,
      status: 'SIMULATED',
      message: 'WhatsApp notification simulated. No real WhatsApp message sent.',
      deliveredAt: new Date(),
      providerResponse: {
        simulated: true,
        mode: this.mode,
        channel: 'WHATSAPP',
        recipient: maskedPhone,
        timestamp: new Date().toISOString(),
      },
    };
  }

  getStatus() {
    return {
      channel: this.channelName,
      enabled: true,
      mode: 'DEVELOPMENT_SIMULATION',
      status: 'SIMULATED',
      accountRequired: false,
    };
  }
}

module.exports = MockWhatsAppProvider;
