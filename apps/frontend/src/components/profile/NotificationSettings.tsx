import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BellIcon, BellSlashIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '../../stores/appStore';
import { useRequestNotificationPermission } from '../../hooks/useNotifications';
import { Card } from '../ui/Card';
import { Switch } from '../ui/Switch';
import { Button } from '../ui/Button';
import { cn } from '../../utils';

interface NotificationSettingsProps {
  className?: string;
}

export const NotificationSettings = ({ className }: NotificationSettingsProps) => {
  const { notifications, setNotificationPermission, toggleNotifications } = useAppStore();
  const requestPermissionMutation = useRequestNotificationPermission();
  const isSupported = 'Notification' in window;
  const [isRequesting, setIsRequesting] = useState(false);

  // Check current notification permission on mount
  useEffect(() => {
    if (isSupported && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [setNotificationPermission, isSupported]);

  const handleRequestPermission = async () => {
    if (!isSupported) return;
    
    setIsRequesting(true);
    try {
      const permission = await requestPermissionMutation.mutateAsync();
      
      if (permission === 'granted' && !notifications.enabled) {
        toggleNotifications();
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleToggleNotifications = () => {
    if (notifications.permission !== 'granted') {
      handleRequestPermission();
    } else {
      toggleNotifications();
    }
  };

  const getPermissionStatus = () => {
    switch (notifications.permission) {
      case 'granted':
        return {
          status: 'Granted',
          description: 'You will receive push notifications',
          color: 'text-success-600 dark:text-success-400',
          bgColor: 'bg-success-50 dark:bg-success-900/20',
          borderColor: 'border-success-200 dark:border-success-800',
        };
      case 'denied':
        return {
          status: 'Blocked',
          description: 'Notifications are blocked. Enable them in your browser settings.',
          color: 'text-error-600 dark:text-error-400',
          bgColor: 'bg-error-50 dark:bg-error-900/20',
          borderColor: 'border-error-200 dark:border-error-800',
        };
      default:
        return {
          status: 'Not requested',
          description: 'Click to enable push notifications',
          color: 'text-warning-600 dark:text-warning-400',
          bgColor: 'bg-warning-50 dark:bg-warning-900/20',
          borderColor: 'border-warning-200 dark:border-warning-800',
        };
    }
  };

  const permissionInfo = getPermissionStatus();

  if (!isSupported) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center space-y-4">
          <BellSlashIcon className="h-12 w-12 text-gray-400 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Notifications Not Supported
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your browser doesn't support push notifications.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <BellIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Notifications
          </h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Manage how you receive notifications for reminders and updates.
        </p>
      </div>

      <div className="space-y-6">
        {/* Permission Status */}
        <div className={cn(
          'p-4 rounded-lg border',
          permissionInfo.bgColor,
          permissionInfo.borderColor
        )}>
          <div className="flex items-center justify-between">
            <div>
              <div className={cn('font-medium', permissionInfo.color)}>
                Permission: {permissionInfo.status}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {permissionInfo.description}
              </div>
            </div>
            
            {notifications.permission !== 'granted' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestPermission}
                isLoading={isRequesting}
                disabled={notifications.permission === 'denied'}
              >
                {notifications.permission === 'denied' ? 'Blocked' : 'Enable'}
              </Button>
            )}
          </div>
        </div>

        {/* Notification Toggle */}
        <Switch
          checked={notifications.enabled && notifications.permission === 'granted'}
          onChange={handleToggleNotifications}
          disabled={notifications.permission === 'denied'}
          label="Push Notifications"
          description="Receive notifications for memo reminders and quiz sessions"
          size="md"
        />

        {/* Notification Types */}
        {notifications.enabled && notifications.permission === 'granted' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 pl-4 border-l-2 border-primary-200 dark:border-primary-800"
          >
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Notification Types
            </div>
            
            <div className="space-y-3">
              <Switch
                checked={true}
                onChange={() => {}}
                label="Memo Reminders"
                description="Get notified when it's time to review your memos"
                size="sm"
              />
              
              <Switch
                checked={true}
                onChange={() => {}}
                label="Quiz Sessions"
                description="Reminders to take quiz sessions for better retention"
                size="sm"
              />
              
              <Switch
                checked={false}
                onChange={() => {}}
                label="Weekly Progress"
                description="Weekly summary of your learning progress"
                size="sm"
              />
            </div>
          </motion.div>
        )}

        {/* Browser Instructions */}
        {notifications.permission === 'denied' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700"
          >
            <div className="text-sm">
              <div className="font-medium text-gray-900 dark:text-white mb-2">
                To enable notifications:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-400">
                <li>Click the lock icon in your browser's address bar</li>
                <li>Change notifications from "Block" to "Allow"</li>
                <li>Refresh this page</li>
              </ol>
            </div>
          </motion.div>
        )}
      </div>
    </Card>
  );
};