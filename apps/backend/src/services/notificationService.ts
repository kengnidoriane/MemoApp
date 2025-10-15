import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';

export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  reminderTypes: {
    spacedRepetition: boolean;
    custom: boolean;
    quiz: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
}

export interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class NotificationService {
  constructor(private prisma: PrismaClient) {
    this.initializeWebPush();
  }

  /**
   * Initialize Web Push configuration
   */
  private initializeWebPush(): void {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('VAPID keys not configured. Push notifications will not work.');
      return;
    }

    webpush.setVapidDetails(
      'mailto:noreply@memoapp.com',
      vapidPublicKey,
      vapidPrivateKey
    );

    console.log('Web Push initialized with VAPID keys');
  }

  /**
   * Send a reminder notification for a memo
   */
  async sendReminderNotification(user: any, memo: any): Promise<void> {
    // Get user notification preferences
    const preferences = await this.getNotificationPreferences(user.id);
    
    if (!preferences.pushEnabled || !preferences.reminderTypes.spacedRepetition) {
      console.log(`Notifications disabled for user ${user.id}`);
      return;
    }

    // Check quiet hours
    if (this.isInQuietHours(preferences.quietHours)) {
      console.log(`Skipping notification due to quiet hours for user ${user.id}`);
      return;
    }

    // Create notification content
    const notification: PushNotification = {
      title: '📚 Time to Review!',
      body: `Review: ${memo.title}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        memoId: memo.id,
        type: 'reminder',
        url: `/memos/${memo.id}`
      },
      actions: [
        {
          action: 'review',
          title: 'Review Now',
          icon: '/icons/review.png'
        },
        {
          action: 'snooze',
          title: 'Snooze 1h',
          icon: '/icons/snooze.png'
        }
      ]
    };

    // Send push notification (placeholder - will be implemented in task 6.3)
    await this.sendPushNotification(user.id, notification);
  }

  /**
   * Send a quiz reminder notification
   */
  async sendQuizReminderNotification(user: any): Promise<void> {
    const preferences = await this.getNotificationPreferences(user.id);
    
    if (!preferences.pushEnabled || !preferences.reminderTypes.quiz) {
      return;
    }

    if (this.isInQuietHours(preferences.quietHours)) {
      return;
    }

    const notification: PushNotification = {
      title: '🧠 Quiz Time!',
      body: 'Test your knowledge with a quick quiz',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        type: 'quiz',
        url: '/quiz'
      },
      actions: [
        {
          action: 'start-quiz',
          title: 'Start Quiz',
          icon: '/icons/quiz.png'
        }
      ]
    };

    await this.sendPushNotification(user.id, notification);
  }

  /**
   * Send a custom notification
   */
  async sendCustomNotification(
    userId: string,
    notification: PushNotification
  ): Promise<void> {
    const preferences = await this.getNotificationPreferences(userId);
    
    if (!preferences.pushEnabled) {
      return;
    }

    if (this.isInQuietHours(preferences.quietHours)) {
      return;
    }

    await this.sendPushNotification(userId, notification);
  }

  /**
   * Get notification preferences for a user
   */
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const preferences = user.preferences as any;
    return preferences.notifications || {
      pushEnabled: true,
      emailEnabled: false,
      reminderTypes: {
        spacedRepetition: true,
        custom: true,
        quiz: true
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };
  }

  /**
   * Update notification preferences for a user
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: NotificationPreferences
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const userPreferences = user.preferences as any;
    userPreferences.notifications = preferences;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        preferences: userPreferences
      }
    });
  }

  /**
   * Subscribe user to push notifications
   */
  async subscribeToPushNotifications(
    userId: string,
    subscription: WebPushSubscription
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const preferences = user.preferences as any;
    preferences.pushSubscription = subscription;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        preferences
      }
    });
  }

  /**
   * Unsubscribe user from push notifications
   */
  async unsubscribeFromPushNotifications(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const preferences = user.preferences as any;
    delete preferences.pushSubscription;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        preferences
      }
    });
  }

  /**
   * Send push notification using Web Push API
   */
  private async sendPushNotification(
    userId: string,
    notification: PushNotification
  ): Promise<void> {
    try {
      // Get user's push subscription
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const preferences = user.preferences as any;
      const subscription = preferences.pushSubscription;

      if (!subscription) {
        console.log(`No push subscription found for user ${userId}`);
        return;
      }

      // Check if VAPID keys are configured
      if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        console.log(`VAPID keys not configured. Logging notification instead.`);
        console.log(`[PUSH NOTIFICATION] To: ${userId}`, {
          title: notification.title,
          body: notification.body,
          data: notification.data
        });
        return;
      }

      // Prepare the payload
      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/icons/icon-192x192.png',
        badge: notification.badge || '/icons/badge-72x72.png',
        data: notification.data || {},
        actions: notification.actions || [],
        tag: notification.data?.type || 'memo-app',
        requireInteraction: true,
        timestamp: Date.now()
      });

      // Send the notification
      const result = await webpush.sendNotification(subscription, payload, {
        TTL: 24 * 60 * 60, // 24 hours
        urgency: 'normal'
      });

      console.log(`Push notification sent successfully to user ${userId}:`, result.statusCode);

      // Update delivery status in database if this was triggered by a scheduled notification
      await this.updateDeliveryStatus(userId, notification.data?.memoId, 'delivered', null);
    } catch (error: any) {
      console.error(`Failed to send push notification to user ${userId}:`, error);

      // Update delivery status as failed
      await this.updateDeliveryStatus(userId, notification.data?.memoId, 'failed', error.message);

      // Handle specific Web Push errors
      if (error.statusCode === 410 || error.statusCode === 404) {
        // Subscription is no longer valid, remove it
        console.log(`Removing invalid push subscription for user ${userId}`);
        await this.unsubscribeFromPushNotifications(userId);
      } else if (error.statusCode === 413) {
        console.error('Push notification payload too large');
      } else if (error.statusCode === 429) {
        console.error('Push notification rate limit exceeded');
      }

      throw error;
    }
  }

  /**
   * Check if current time is within quiet hours
   */
  private isInQuietHours(quietHours: NotificationPreferences['quietHours']): boolean {
    if (!quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const start = quietHours.start;
    const end = quietHours.end;

    // Handle cases where quiet hours span midnight
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    } else {
      return currentTime >= start && currentTime <= end;
    }
  }

  /**
   * Update delivery status for a notification
   */
  private async updateDeliveryStatus(
    userId: string,
    memoId: string | undefined,
    deliveryStatus: 'delivered' | 'failed',
    errorMessage: string | null
  ): Promise<void> {
    if (!memoId) return;

    try {
      await this.prisma.notificationSchedule.updateMany({
        where: {
          userId,
          memoId,
          status: 'sent',
          deliveryStatus: null // Only update if not already set
        },
        data: {
          deliveryStatus,
          errorMessage
        }
      });
    } catch (error) {
      console.error('Failed to update delivery status:', error);
    }
  }

  /**
   * Get notification delivery statistics
   */
  async getNotificationStats(userId: string): Promise<{
    totalSent: number;
    sentToday: number;
    failedToday: number;
    deliveredToday: number;
    lastSent: Date | null;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalSent, sentToday, failedToday, deliveredToday, lastSentRecord] = await Promise.all([
      this.prisma.notificationSchedule.count({
        where: {
          userId,
          status: 'sent'
        }
      }),
      this.prisma.notificationSchedule.count({
        where: {
          userId,
          status: 'sent',
          sentAt: {
            gte: today
          }
        }
      }),
      this.prisma.notificationSchedule.count({
        where: {
          userId,
          status: 'failed',
          scheduledFor: {
            gte: today
          }
        }
      }),
      this.prisma.notificationSchedule.count({
        where: {
          userId,
          deliveryStatus: 'delivered',
          sentAt: {
            gte: today
          }
        }
      }),
      this.prisma.notificationSchedule.findFirst({
        where: {
          userId,
          status: 'sent'
        },
        orderBy: {
          sentAt: 'desc'
        }
      })
    ]);

    return {
      totalSent,
      sentToday,
      failedToday,
      deliveredToday,
      lastSent: lastSentRecord?.sentAt || null
    };
  }

  /**
   * Test push notification functionality
   */
  async sendTestNotification(userId: string): Promise<void> {
    const testNotification: PushNotification = {
      title: '🧪 Test Notification',
      body: 'This is a test notification from MemoApp!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        type: 'test',
        url: '/dashboard'
      }
    };

    await this.sendPushNotification(userId, testNotification);
  }
}