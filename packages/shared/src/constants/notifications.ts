/**
 * Notification types and constants
 */

export enum NotificationType {
  REMINDER = 'reminder',
  QUIZ_AVAILABLE = 'quiz_available',
  ACHIEVEMENT = 'achievement',
  SYNC_COMPLETE = 'sync_complete',
  SYNC_CONFLICT = 'sync_conflict',
  SYSTEM_UPDATE = 'system_update',
  WELCOME = 'welcome',
  MILESTONE = 'milestone'
}

export type ReminderFrequency = '10min' | '30min' | '1h' | '4h' | '1day' | '3days' | '1week';

export const REMINDER_FREQUENCY_VALUES = {
  TEN_MINUTES: '10min' as const,
  THIRTY_MINUTES: '30min' as const,
  ONE_HOUR: '1h' as const,
  FOUR_HOURS: '4h' as const,
  ONE_DAY: '1day' as const,
  THREE_DAYS: '3days' as const,
  ONE_WEEK: '1week' as const
};

/**
 * Reminder frequency in milliseconds
 */
export const REMINDER_INTERVALS: Record<ReminderFrequency, number> = {
  '10min': 10 * 60 * 1000,
  '30min': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '1day': 24 * 60 * 60 * 1000,
  '3days': 3 * 24 * 60 * 60 * 1000,
  '1week': 7 * 24 * 60 * 60 * 1000
};

/**
 * Human-readable reminder frequency labels
 */
export const REMINDER_FREQUENCY_LABELS: Record<ReminderFrequency, string> = {
  '10min': '10 minutes',
  '30min': '30 minutes',
  '1h': '1 hour',
  '4h': '4 hours',
  '1day': '1 day',
  '3days': '3 days',
  '1week': '1 week'
};

/**
 * Notification priority levels
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Notification status
 */
export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Default notification settings
 */
export const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: true,
  reminderFrequency: '1day' as ReminderFrequency,
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00'
  },
  allowedTypes: [
    NotificationType.REMINDER,
    NotificationType.QUIZ_AVAILABLE,
    NotificationType.ACHIEVEMENT,
    NotificationType.MILESTONE
  ],
  soundEnabled: true,
  vibrationEnabled: true,
  maxRemindersPerDay: 10
};

/**
 * Notification templates
 */
export const NOTIFICATION_TEMPLATES = {
  [NotificationType.REMINDER]: {
    title: 'Time to Review!',
    body: 'You have memos ready for review to boost your memory.',
    icon: '/icons/reminder.png',
    badge: '/icons/badge.png'
  },
  [NotificationType.QUIZ_AVAILABLE]: {
    title: 'Quiz Time!',
    body: 'Test your knowledge with a quick quiz session.',
    icon: '/icons/quiz.png',
    badge: '/icons/badge.png'
  },
  [NotificationType.ACHIEVEMENT]: {
    title: 'Achievement Unlocked!',
    body: 'Congratulations on reaching a new milestone!',
    icon: '/icons/achievement.png',
    badge: '/icons/badge.png'
  },
  [NotificationType.SYNC_COMPLETE]: {
    title: 'Sync Complete',
    body: 'Your memos have been synchronized across all devices.',
    icon: '/icons/sync.png',
    badge: '/icons/badge.png'
  },
  [NotificationType.SYNC_CONFLICT]: {
    title: 'Sync Conflict',
    body: 'Some changes need your attention to resolve conflicts.',
    icon: '/icons/warning.png',
    badge: '/icons/badge.png'
  },
  [NotificationType.WELCOME]: {
    title: 'Welcome to MemoApp!',
    body: 'Start creating your first memo to begin your learning journey.',
    icon: '/icons/welcome.png',
    badge: '/icons/badge.png'
  },
  [NotificationType.MILESTONE]: {
    title: 'Milestone Reached!',
    body: 'You\'ve made great progress in your learning journey.',
    icon: '/icons/milestone.png',
    badge: '/icons/badge.png'
  }
};

/**
 * Push notification actions
 */
export const NOTIFICATION_ACTIONS = {
  REVIEW_NOW: {
    action: 'review',
    title: 'Review Now',
    icon: '/icons/review.png'
  },
  START_QUIZ: {
    action: 'quiz',
    title: 'Start Quiz',
    icon: '/icons/quiz.png'
  },
  VIEW_MEMO: {
    action: 'view',
    title: 'View Memo',
    icon: '/icons/view.png'
  },
  DISMISS: {
    action: 'dismiss',
    title: 'Dismiss',
    icon: '/icons/dismiss.png'
  }
};