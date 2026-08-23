const BaseProvider = require('./BaseProvider');
const Notification = require('../../../models/Notification');
const config = require('../../../config');

class InAppProvider extends BaseProvider {
  constructor(socketService = null) {
    super('IN_APP');
    this.socketService = socketService;
  }

  validate(job) {
    const baseValidation = super.validate(job);
    if (!baseValidation.isValid) return baseValidation;

    if (!job.recipientId) {
      return { isValid: false, error: 'Recipient ID is required for in-app notifications' };
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

    try {
      const { recipientId, recipientRole, type, payload } = job;

      // Extract title & message from payload
      const title = payload.title || payload.subject || 'Attendance Notification';
      const message = payload.message || payload.body || 'You have a new attendance alert.';

      // Create persistent in-app notification document
      const notification = await Notification.create({
        recipientId,
        recipientRole: recipientRole || 'STUDENT',
        type: type || 'SYSTEM',
        title,
        message,
        data: payload,
        channel: 'IN_APP',
        sentAt: new Date(),
        isRead: false,
      });

      // Deliver via real-time WebSocket if connected
      if (this.socketService) {
        try {
          this.socketService.sendToUser(recipientId.toString(), 'notification:new', {
            id: notification._id,
            title,
            message,
            type,
            createdAt: notification.createdAt,
          });
        } catch (sockErr) {
          // Socket delivery is opportunistic, in-app doc is already persisted
        }
      }

      return {
        success: true,
        status: 'SENT',
        deliveredAt: new Date(),
        providerResponse: {
          notificationId: notification._id,
        },
      };
    } catch (error) {
      return {
        success: false,
        status: 'FAILED',
        error: error.message || 'Failed to create in-app notification',
      };
    }
  }

  getStatus() {
    return {
      channel: this.channelName,
      enabled: config.notifications?.inAppEnabled !== false,
      mode: 'active',
    };
  }
}

module.exports = InAppProvider;
