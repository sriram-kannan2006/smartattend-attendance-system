/**
 * Notification Logger — Secure, structured logger for notification events.
 * Masks sensitive authentication data, face biometrics, tokens, and credentials.
 */
class NotificationLogger {
  log(event) {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const sanitized = this.sanitize(event);

    console.log(
      `[NOTIFICATION] [${sanitized.channel || 'SYSTEM'}] [${sanitized.status || 'INFO'}] ` +
      `Type: ${sanitized.type || 'N/A'} | Recipient: ${sanitized.recipient || 'N/A'} | ` +
      `Timestamp: ${timestamp}`
    );
  }

  error(event, error) {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const sanitized = this.sanitize(event);

    console.error(
      `[NOTIFICATION_ERROR] [${sanitized.channel || 'SYSTEM'}] [FAILED] ` +
      `Type: ${sanitized.type || 'N/A'} | Recipient: ${sanitized.recipient || 'N/A'} | ` +
      `Error: ${error?.message || error || 'Unknown'} | Timestamp: ${timestamp}`
    );
  }

  sanitize(obj) {
    if (!obj || typeof obj !== 'object') return {};

    const copy = { ...obj };
    const sensitiveKeys = ['password', 'token', 'jwt', 'secret', 'faceDescriptor', 'descriptor', 'apiKey'];

    for (const key of sensitiveKeys) {
      if (copy[key]) copy[key] = '[REDACTED]';
    }

    return copy;
  }
}

module.exports = new NotificationLogger();
