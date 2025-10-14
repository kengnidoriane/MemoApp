export interface PushNotification {
  title: string;
  body: string;
  icon: string;
  badge: string;
  data: Record<string, any>;
  tag?: string;
  requireInteraction?: boolean;
}

export interface NotificationPreferences {
  enabled: boolean;
  reminderFrequency: ReminderFrequency;
  quietHours?: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
  allowedTypes: NotificationType[];
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

// NotificationType is imported from constants
import { NotificationType } from '../constants/notifications';

export interface NotificationSchedule {
  id: string;
  userId: string;
  memoId: string;
  scheduledFor: Date;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  type: NotificationType;
  retryCount: number;
}

export interface ReminderSettings {
  frequency: ReminderFrequency;
  enabled: boolean;
  customIntervals?: number[]; // in minutes
  maxRemindersPerDay: number;
  respectQuietHours: boolean;
}

// ReminderFrequency is imported from constants
import { ReminderFrequency } from '../constants/notifications';