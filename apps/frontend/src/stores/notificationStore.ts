import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotificationSettings {
  enabled: boolean;
  permission: NotificationPermission;
  reminderFrequency: 'disabled' | '10min' | '30min' | '1h' | '4h' | '1day' | '3days' | '1week';
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
  categories: {
    reminders: boolean;
    quizzes: boolean;
    achievements: boolean;
    system: boolean;
  };
}

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: Date;
}

interface NotificationState {
  settings: NotificationSettings;
  toasts: ToastNotification[];
  pushSubscription: PushSubscription | null;
  isRequestingPermission: boolean;
  lastReminderAt: Date | null;
  reminderCount: number;
}

interface NotificationActions {
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  requestPermission: () => Promise<NotificationPermission>;
  setPushSubscription: (subscription: PushSubscription | null) => void;
  addToast: (toast: Omit<ToastNotification, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  setLastReminderAt: (date: Date) => void;
  incrementReminderCount: () => void;
  resetReminderCount: () => void;
}

type NotificationStore = NotificationState & NotificationActions;

const initialSettings: NotificationSettings = {
  enabled: false,
  permission: 'default',
  reminderFrequency: '1h',
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
  categories: {
    reminders: true,
    quizzes: true,
    achievements: true,
    system: true,
  },
};

const initialState: NotificationState = {
  settings: initialSettings,
  toasts: [],
  pushSubscription: null,
  isRequestingPermission: false,
  lastReminderAt: null,
  reminderCount: 0,
};

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      updateSettings: (settingsUpdate) => {
        const { settings } = get();
        set({
          settings: { ...settings, ...settingsUpdate },
        });
      },
      
      requestPermission: async () => {
        set({ isRequestingPermission: true });
        
        try {
          const permission = await Notification.requestPermission();
          
          set({
            isRequestingPermission: false,
            settings: {
              ...get().settings,
              permission,
              enabled: permission === 'granted',
            },
          });
          
          return permission;
        } catch (error) {
          set({ isRequestingPermission: false });
          throw error;
        }
      },
      
      setPushSubscription: (subscription) => {
        set({ pushSubscription: subscription });
      },
      
      addToast: (toastData) => {
        const { toasts } = get();
        const toast: ToastNotification = {
          ...toastData,
          id: `toast-${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
        };
        
        set({ toasts: [...toasts, toast] });
        
        // Auto-remove toast after duration (default 5 seconds)
        const duration = toast.duration ?? 5000;
        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(toast.id);
          }, duration);
        }
      },
      
      removeToast: (id) => {
        const { toasts } = get();
        set({ toasts: toasts.filter(t => t.id !== id) });
      },
      
      clearToasts: () => {
        set({ toasts: [] });
      },
      
      setLastReminderAt: (date) => {
        set({ lastReminderAt: date });
      },
      
      incrementReminderCount: () => {
        set({ reminderCount: get().reminderCount + 1 });
      },
      
      resetReminderCount: () => {
        set({ reminderCount: 0 });
      },
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        settings: state.settings,
        lastReminderAt: state.lastReminderAt,
        reminderCount: state.reminderCount,
      }),
    }
  )
);

// Helper functions for notification management
export const isInQuietHours = (settings: NotificationSettings): boolean => {
  if (!settings.quietHours.enabled) return false;
  
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const { start, end } = settings.quietHours;
  
  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (start > end) {
    return currentTime >= start || currentTime <= end;
  }
  
  // Handle same-day quiet hours (e.g., 12:00 to 14:00)
  return currentTime >= start && currentTime <= end;
};

export const canShowNotification = (
  settings: NotificationSettings,
  category: keyof NotificationSettings['categories']
): boolean => {
  return (
    settings.enabled &&
    settings.permission === 'granted' &&
    settings.categories[category] &&
    !isInQuietHours(settings)
  );
};