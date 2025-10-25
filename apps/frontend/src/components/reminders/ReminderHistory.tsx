import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Bell, CheckCircle, XCircle, Pause, Trash2, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { useUpcomingReminders, useSnoozeReminder, useDismissReminder } from '../../hooks/useNotifications';
import { NotificationType } from '@memo-app/shared/constants';

interface ReminderHistoryProps {
  className?: string;
}

export const ReminderHistory: React.FC<ReminderHistoryProps> = ({ className }) => {
  const { data: reminders = [], isLoading, error } = useUpcomingReminders();
  const snoozeReminderMutation = useSnoozeReminder();
  const dismissReminderMutation = useDismissReminder();
  
  const [expandedReminder, setExpandedReminder] = useState<string | null>(null);

  const handleSnoozeReminder = async (reminderId: string, minutes: number) => {
    try {
      await snoozeReminderMutation.mutateAsync({ reminderId, minutes });
    } catch (error) {
      console.error('Failed to snooze reminder:', error);
    }
  };

  const handleDismissReminder = async (reminderId: string) => {
    try {
      await dismissReminderMutation.mutateAsync(reminderId);
    } catch (error) {
      console.error('Failed to dismiss reminder:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case NotificationType.REMINDER:
        return Clock;
      case NotificationType.QUIZ_AVAILABLE:
        return Bell;
      default:
        return Bell;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case NotificationType.REMINDER:
        return 'text-blue-600 dark:text-blue-400';
      case NotificationType.QUIZ_AVAILABLE:
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case NotificationType.REMINDER:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case NotificationType.QUIZ_AVAILABLE:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTimeStatus = (scheduledFor: Date) => {
    const now = new Date();
    const scheduled = new Date(scheduledFor);
    const diffMs = scheduled.getTime() - now.getTime();
    
    if (diffMs < 0) {
      return {
        status: 'overdue',
        text: `Overdue by ${formatDistanceToNow(scheduled)}`,
        color: 'text-red-600 dark:text-red-400'
      };
    } else if (diffMs < 60 * 60 * 1000) { // Less than 1 hour
      return {
        status: 'soon',
        text: `In ${formatDistanceToNow(scheduled)}`,
        color: 'text-yellow-600 dark:text-yellow-400'
      };
    } else {
      return {
        status: 'scheduled',
        text: `In ${formatDistanceToNow(scheduled)}`,
        color: 'text-gray-600 dark:text-gray-400'
      };
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upcoming Reminders
            </h3>
          </div>
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upcoming Reminders
            </h3>
          </div>
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Failed to load reminders. Please try again.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upcoming Reminders
            </h3>
            {reminders.length > 0 && (
              <Badge variant="secondary">
                {reminders.length}
              </Badge>
            )}
          </div>
        </div>

        {reminders.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              All Caught Up!
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              No upcoming reminders. Keep creating memos to get personalized review notifications.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => {
              const TypeIcon = getTypeIcon(reminder.type);
              const typeColor = getTypeColor(reminder.type);
              const typeBadgeColor = getTypeBadgeColor(reminder.type);
              const timeStatus = getTimeStatus(reminder.scheduledFor);
              const isExpanded = expandedReminder === reminder.id;

              return (
                <motion.div
                  key={reminder.id}
                  layout
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <TypeIcon className={`h-5 w-5 mt-0.5 ${typeColor}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={typeBadgeColor}>
                            {reminder.type === NotificationType.REMINDER ? 'Review' : 'Quiz'}
                          </Badge>
                          <span className={`text-sm ${timeStatus.color}`}>
                            {timeStatus.text}
                          </span>
                        </div>
                        <div className="text-sm text-gray-900 dark:text-white font-medium mb-1">
                          Memo Review Reminder
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Scheduled for {format(new Date(reminder.scheduledFor), 'MMM d, yyyy h:mm a')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedReminder(isExpanded ? null : reminder.id)}
                        className="p-1"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSnoozeReminder(reminder.id, 15)}
                          disabled={snoozeReminderMutation.isPending}
                          className="text-xs"
                        >
                          <Pause className="h-3 w-3 mr-1" />
                          Snooze 15m
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSnoozeReminder(reminder.id, 60)}
                          disabled={snoozeReminderMutation.isPending}
                          className="text-xs"
                        >
                          <Pause className="h-3 w-3 mr-1" />
                          Snooze 1h
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSnoozeReminder(reminder.id, 24 * 60)}
                          disabled={snoozeReminderMutation.isPending}
                          className="text-xs"
                        >
                          <Pause className="h-3 w-3 mr-1" />
                          Snooze 1d
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDismissReminder(reminder.id)}
                          disabled={dismissReminderMutation.isPending}
                          className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};