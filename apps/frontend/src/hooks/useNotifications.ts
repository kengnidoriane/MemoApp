import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notificationService';
import { useAppStore } from '../stores/appStore';
import type { 
  NotificationPreferences,
  PushSubscription 
} from '@memo-app/shared/types';

// Query keys
export const notificationKeys = {
  all: ['notifications'] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
  reminders: () => [...notificationKeys.all, 'reminders'] as const,
};

// Push notification hooks
export const useSubscribeToPush = () => {
  const { setNotificationPermission } = useAppStore();

  return useMutation({
    mutationFn: notificationService.subscribeToPush,
    onSuccess: () => {
      setNotificationPermission('granted');
    },
  });
};

export const useUnsubscribeFromPush = () => {
  const { setNotificationPermission } = useAppStore();

  return useMutation({
    mutationFn: notificationService.unsubscribeFromPush,
    onSuccess: () => {
      setNotificationPermission('denied');
    },
  });
};

// Notification preferences
export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: notificationService.getNotificationPreferences,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.updateNotificationPreferences,
    onSuccess: (updatedPreferences) => {
      queryClient.setQueryData(notificationKeys.preferences(), updatedPreferences);
    },
  });
};

// Test notifications
export const useSendTestNotification = () => {
  return useMutation({
    mutationFn: notificationService.sendTestNotification,
  });
};

// Reminder management
export const useUpcomingReminders = () => {
  return useQuery({
    queryKey: notificationKeys.reminders(),
    queryFn: notificationService.getUpcomingReminders,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useSnoozeReminder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reminderId, minutes }: { reminderId: string; minutes: number }) =>
      notificationService.snoozeReminder(reminderId, minutes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.reminders() });
    },
  });
};

export const useDismissReminder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.dismissReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.reminders() });
    },
  });
};

// Utility hook for requesting notification permission
export const useRequestNotificationPermission = () => {
  const { setNotificationPermission } = useAppStore();

  return useMutation({
    mutationFn: async () => {
      if (!('Notification' in window)) {
        throw new Error('This browser does not support notifications');
      }

      const permission = await Notification.requestPermission();
      return permission;
    },
    onSuccess: (permission) => {
      setNotificationPermission(permission);
    },
  });
};