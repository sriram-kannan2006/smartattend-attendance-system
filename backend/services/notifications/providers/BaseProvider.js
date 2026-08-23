/**
 * Base Notification Provider Interface
 * All channel providers (In-App, Email, WhatsApp) implement this common interface.
 */
class BaseProvider {
  constructor(channelName) {
    if (this.constructor === BaseProvider) {
      throw new Error('BaseProvider is an abstract class and cannot be instantiated directly.');
    }
    this.channelName = channelName;
  }

  /**
   * Validate a notification job before dispatching.
   * @param {Object} job - NotificationJob document
   * @returns {Object} { isValid: boolean, error?: string }
   */
  validate(job) {
    if (!job || !job.payload) {
      return { isValid: false, error: 'Job payload is missing or empty' };
    }
    return { isValid: true };
  }

  /**
   * Send / process a notification job.
   * @param {Object} job - NotificationJob document
   * @returns {Promise<{ success: boolean, status: string, deliveredAt?: Date, providerResponse?: any, error?: any }>}
   */
  async send(job) {
    throw new Error(`send() method must be implemented by ${this.constructor.name}`);
  }

  /**
   * Get provider health/configuration status.
   * @returns {Object} { enabled: boolean, mode: string, channel: string }
   */
  getStatus() {
    return {
      channel: this.channelName,
      enabled: false,
      mode: 'unconfigured',
    };
  }
}

module.exports = BaseProvider;
