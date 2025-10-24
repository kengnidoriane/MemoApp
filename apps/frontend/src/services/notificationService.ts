import { api } from '../lib/api';
import type { 
  NotificationPreferences,
  PushSubscription 
} from '@memo-app/shared/types';

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
    const response = await api.get<NotificationPreferences>('/notifications/preferences');
    return response.data;
  },

  updateNotificationPreferences: async (preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    const response = await api.put<NotificationPreferences>('/notifications/preferences', preferences);
    return response.data;
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
    const response = await api.get('/reminders/upcoming');
    return response.data;
  },

  snoozeReminder: async (reminderId: string, snoozeMinutes: number): Promise<void> => {
    await api.post(`/reminders/${reminderId}/snooze`, { minutes: snoozeMinutes });
  },

  dismissReminder: async (reminderId: string): Promise<void> => {
    await api.post(`/reminders/${reminderId}/dismiss`);
  },
};