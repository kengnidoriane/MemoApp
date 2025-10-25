import { api } from '../lib/api';
import type { 
  NotificationPreferences
} from '@memo-app/shared/types';
// import type { ReminderFrequency } from '@memo-app/shared/constants';

export const notificationService = {
  // Push notification subscription
  subscribeToPush: async (subscription: PushSubscription): Promise<void> => {
    await api.post('/notifications/subscribe', { subscription });
  },

  unsubscribeFromPush: async (): Promise<void> => {
    await api.post('/notifications/unsubscribe');
  },

  // Notification preferences
  getNotificationPreferences: async (): Promise<NotificationPreferences> => {
    const response = await api.get<{ data: NotificationPreferences }>('/notifications/preferences');
    return response.data?.data || {
      enabled: false,
      reminderFrequency: '1day' as const,
      allowedTypes: [],
      soundEnabled: true,
      vibrationEnabled: true
    };
  },

  updateNotificationPreferences: async (preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    const response = await api.put<{ data: NotificationPreferences }>('/notifications/preferences', preferences);
    return response.data?.data || {
      enabled: false,
      reminderFrequency: '1day' as const,
      allowedTypes: [],
      soundEnabled: true,
      vibrationEnabled: true,
      ...preferences
    };
  },

  // Test notifications
  sendTestNotification: async (): Promise<void> => {
    await api.post('/notifications/test');
  },

  // Reminder management
  getUpcomingReminders: async (): Promise<Array<{
    id: string;
    memoId: string;
    scheduledFor: Date;
    type: string;
  }>> => {
    const response = await api.get<{ data: Array<{
      id: string;
      memoId: string;
      scheduledFor: Date;
      type: string;
    }> }>('/reminders/upcoming');
    return response.data?.data || [];
  },

  snoozeReminder: async (reminderId: string, snoozeMinutes: number): Promise<void> => {
    await api.post(`/reminders/${reminderId}/snooze`, { minutes: snoozeMinutes });
  },

  dismissReminder: async (reminderId: string): Promise<void> => {
    await api.post(`/reminders/${reminderId}/dismiss`);
  },
};