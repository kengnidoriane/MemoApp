import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Volume2, VolumeX, Smartphone, SmartphoneNfc } from 'lucide-react';
import { Card } from '../ui/Card';
import { Switch } from '../ui/Switch';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

import { useNotificationPreferences, useUpdateNotificationPreferences } from '../../hooks/useNotifications';
import { REMINDER_FREQUENCY_LABELS, NotificationType } from '@memo-app/shared/constants';
import type { NotificationPreferences } from '@memo-app/shared/types';
import type { ReminderFrequency } from '@memo-app/shared/constants';

interface ReminderConfigurationProps {
  className?: string;
}

export const ReminderConfiguration: React.FC<ReminderConfigurationProps> = ({ className }) => {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferencesMutation = useUpdateNotificationPreferences();
  
  const [localPreferences, setLocalPreferences] = useState<Partial<NotificationPreferences>>({});

  // Merge server preferences with local changes
  const currentPreferences = { ...preferences, ...localPreferences };

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const frequency = e.target.value as ReminderFrequency;
    setLocalPreferences(prev => ({ ...prev, reminderFrequency: frequency }));
  };

  const handleToggleEnabled = (enabled: boolean) => {
    setLocalPreferences(prev => ({ ...prev, enabled }));
  };

  const handleToggleSound = (soundEnabled: boolean) => {
    setLocalPreferences(prev => ({ ...prev, soundEnabled }));
  };

  const handleToggleVibration = (vibrationEnabled: boolean) => {
    setLocalPreferences(prev => ({ ...prev, vibrationEnabled }));
  };

  const handleToggleNotificationType = (type: NotificationType, enabled: boolean) => {
    const allowedTypes = currentPreferences.allowedTypes || [];
    const newAllowedTypes = enabled
      ? [...allowedTypes, type]
      : allowedTypes.filter(t => t !== type);
    
    setLocalPreferences(prev => ({ ...prev, allowedTypes: newAllowedTypes }));
  };

  const handleQuietHoursChange = (field: 'start' | 'end', value: string) => {
    setLocalPreferences(prev => ({
      ...prev,
      quietHours: {
        start: currentPreferences.quietHours?.start || '22:00',
        end: currentPreferences.quietHours?.end || '08:00',
        [field]: value
      }
    }));
  };

  const handleSavePreferences = async () => {
    try {
      await updatePreferencesMutation.mutateAsync(localPreferences);
      setLocalPreferences({});
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const hasChanges = Object.keys(localPreferences).length > 0;

  if (isLoading) {
    return (
      <Card className={className}>
        <div className="p-6 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Reminder Configuration
          </h3>
        </div>

        <div className="space-y-6">
          {/* Enable/Disable Reminders */}
          <Switch
            checked={currentPreferences.enabled || false}
            onChange={(e) => handleToggleEnabled(e.target.checked)}
            label="Enable Reminders"
            description="Receive notifications to review your memos based on spaced repetition"
            size="md"
          />

          {currentPreferences.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-6 pl-4 border-l-2 border-blue-200 dark:border-blue-800"
            >
              {/* Reminder Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Reminder Frequency
                </label>
                <Select
                  value={currentPreferences.reminderFrequency || '1day'}
                  onChange={handleFrequencyChange}
                  options={Object.entries(REMINDER_FREQUENCY_LABELS).map(([value, label]) => ({
                    value,
                    label
                  }))}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This sets the base interval, but spaced repetition will adjust timing based on your performance
                </p>
              </div>

              {/* Notification Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Notification Types
                </label>
                <div className="space-y-3">
                  <Switch
                    checked={currentPreferences.allowedTypes?.includes(NotificationType.REMINDER) || false}
                    onChange={(e) => handleToggleNotificationType(NotificationType.REMINDER, e.target.checked)}
                    label="Memo Reminders"
                    description="Get notified when it's time to review specific memos"
                    size="sm"
                  />
                  
                  <Switch
                    checked={currentPreferences.allowedTypes?.includes(NotificationType.QUIZ_AVAILABLE) || false}
                    onChange={(e) => handleToggleNotificationType(NotificationType.QUIZ_AVAILABLE, e.target.checked)}
                    label="Quiz Sessions"
                    description="Reminders to take quiz sessions for better retention"
                    size="sm"
                  />
                  
                  <Switch
                    checked={currentPreferences.allowedTypes?.includes(NotificationType.ACHIEVEMENT) || false}
                    onChange={(e) => handleToggleNotificationType(NotificationType.ACHIEVEMENT, e.target.checked)}
                    label="Achievements"
                    description="Celebrate your learning milestones and progress"
                    size="sm"
                  />
                  
                  <Switch
                    checked={currentPreferences.allowedTypes?.includes(NotificationType.MILESTONE) || false}
                    onChange={(e) => handleToggleNotificationType(NotificationType.MILESTONE, e.target.checked)}
                    label="Learning Milestones"
                    description="Get notified when you reach important learning goals"
                    size="sm"
                  />
                </div>
              </div>

              {/* Sound and Vibration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Notification Behavior
                </label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {currentPreferences.soundEnabled ? (
                        <Volume2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <VolumeX className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Sound
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Play notification sounds
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={currentPreferences.soundEnabled || false}
                      onChange={(e) => handleToggleSound(e.target.checked)}
                      size="sm"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {currentPreferences.vibrationEnabled ? (
                        <Smartphone className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <SmartphoneNfc className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Vibration
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Vibrate on mobile devices
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={currentPreferences.vibrationEnabled || false}
                      onChange={(e) => handleToggleVibration(e.target.checked)}
                      size="sm"
                    />
                  </div>
                </div>
              </div>

              {/* Quiet Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Quiet Hours
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={currentPreferences.quietHours?.start || '22:00'}
                      onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={currentPreferences.quietHours?.end || '08:00'}
                      onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  No notifications will be sent during these hours
                </p>
              </div>
            </motion.div>
          )}

          {/* Save Button */}
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <Button
                onClick={handleSavePreferences}
                isLoading={updatePreferencesMutation.isPending}
                className="min-w-[120px]"
              >
                Save Changes
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </Card>
  );
};