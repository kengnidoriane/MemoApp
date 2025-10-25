import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Settings, History, TestTube } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ReminderConfiguration } from './ReminderConfiguration';
import { NotificationPermissionFlow } from './NotificationPermissionFlow';
import { ReminderHistory } from './ReminderHistory';
import { useSendTestNotification } from '../../hooks/useNotifications';
import { useAppStore } from '../../stores/appStore';
import { useToast } from '../../providers/ToastProvider';

type TabType = 'settings' | 'history' | 'permissions';

export const RemindersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const { notifications } = useAppStore();
  const { showSuccess, showError } = useToast();
  const sendTestNotificationMutation = useSendTestNotification();

  const handleSendTestNotification = async () => {
    try {
      await sendTestNotificationMutation.mutateAsync();
      showSuccess('Test Notification Sent', 'Check if you received the test notification.');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      showError('Test Failed', 'Failed to send test notification. Please check your settings.');
    }
  };

  const tabs = [
    {
      id: 'settings' as const,
      label: 'Settings',
      icon: Settings,
      description: 'Configure your reminder preferences'
    },
    {
      id: 'history' as const,
      label: 'Upcoming',
      icon: History,
      description: 'View and manage upcoming reminders'
    },
    {
      id: 'permissions' as const,
      label: 'Permissions',
      icon: Bell,
      description: 'Manage notification permissions'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Bell className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Reminders & Notifications
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your learning reminders and notification preferences to optimize your study schedule.
        </p>
      </div>

      {/* Status Overview */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Notification Status:
              </span>
            </div>
            <Badge
              variant={notifications.permission === 'granted' ? 'default' : 'secondary'}
              className={
                notifications.permission === 'granted'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : notifications.permission === 'denied'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
              }
            >
              {notifications.permission === 'granted' ? 'Enabled' : 
               notifications.permission === 'denied' ? 'Blocked' : 'Not Set'}
            </Badge>
          </div>

          {notifications.permission === 'granted' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendTestNotification}
              isLoading={sendTestNotificationMutation.isPending}
              className="flex items-center space-x-2"
            >
              <TestTube className="h-4 w-4" />
              <span>Send Test</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <ReminderConfiguration />
            
            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <TestTube className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      Test Notifications
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Send a test notification to verify your settings are working correctly.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendTestNotification}
                    isLoading={sendTestNotificationMutation.isPending}
                    disabled={notifications.permission !== 'granted'}
                  >
                    Send Test Notification
                  </Button>
                </div>

                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <History className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      Review Schedule
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    View your upcoming review schedule and manage pending reminders.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('history')}
                  >
                    View Schedule
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'history' && (
          <ReminderHistory />
        )}

        {activeTab === 'permissions' && (
          <div className="space-y-6">
            <NotificationPermissionFlow />
            
            {/* Browser Instructions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Troubleshooting
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Not receiving notifications?
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                    <li>Check that notifications are enabled in your browser settings</li>
                    <li>Ensure your device's "Do Not Disturb" mode is off</li>
                    <li>Verify that the website has permission to send notifications</li>
                    <li>Try sending a test notification to verify the setup</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Browser-specific instructions:
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <div>
                      <strong>Chrome:</strong> Click the lock icon → Notifications → Allow
                    </div>
                    <div>
                      <strong>Firefox:</strong> Click the shield icon → Permissions → Notifications → Allow
                    </div>
                    <div>
                      <strong>Safari:</strong> Safari → Preferences → Websites → Notifications → Allow
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};