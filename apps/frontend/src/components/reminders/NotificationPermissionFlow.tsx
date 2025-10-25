import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Shield, Smartphone, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

import { useRequestNotificationPermission, useSubscribeToPush } from '../../hooks/useNotifications';
import { useAppStore } from '../../stores/appStore';

interface NotificationPermissionFlowProps {
  onComplete?: (granted: boolean) => void;
  className?: string;
}

export const NotificationPermissionFlow: React.FC<NotificationPermissionFlowProps> = ({
  onComplete,
  className
}) => {
  const { notifications, setNotificationPermission } = useAppStore();
  const requestPermissionMutation = useRequestNotificationPermission();
  const subscribeToPushMutation = useSubscribeToPush();
  
  const [currentStep, setCurrentStep] = useState<'intro' | 'requesting' | 'subscribing' | 'complete' | 'error'>('intro');
  const [error, setError] = useState<string | null>(null);

  // Check current permission status on mount
  useEffect(() => {
    if ('Notification' in window) {
      const permission = Notification.permission;
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        setCurrentStep('complete');
        onComplete?.(true);
      } else if (permission === 'denied') {
        setCurrentStep('error');
        onComplete?.(false);
      }
    }
  }, [setNotificationPermission, onComplete]);

  const handleRequestPermission = async () => {
    setCurrentStep('requesting');
    setError(null);

    try {
      const permission = await requestPermissionMutation.mutateAsync();
      
      if (permission === 'granted') {
        setCurrentStep('subscribing');
        
        // Subscribe to push notifications
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: process.env.VITE_VAPID_PUBLIC_KEY
            });
            
            await subscribeToPushMutation.mutateAsync(subscription as any);
            setCurrentStep('complete');
            onComplete?.(true);
          } catch (pushError) {
            console.error('Failed to subscribe to push notifications:', pushError);
            // Still consider it successful if we got permission
            setCurrentStep('complete');
            onComplete?.(true);
          }
        } else {
          setCurrentStep('complete');
          onComplete?.(true);
        }
      } else {
        setCurrentStep('error');
        setError('Notification permission was denied. You can enable it later in your browser settings.');
        onComplete?.(false);
      }
    } catch (err) {
      console.error('Failed to request notification permission:', err);
      setCurrentStep('error');
      setError('Failed to request notification permission. Please try again.');
      onComplete?.(false);
    }
  };

  const handleSkip = () => {
    setCurrentStep('complete');
    onComplete?.(false);
  };

  const getPermissionStatusInfo = () => {
    switch (notifications.permission) {
      case 'granted':
        return {
          icon: CheckCircle,
          title: 'Notifications Enabled',
          description: 'You will receive reminders and updates',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800'
        };
      case 'denied':
        return {
          icon: XCircle,
          title: 'Notifications Blocked',
          description: 'Enable notifications in your browser settings to receive reminders',
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800'
        };
      default:
        return {
          icon: AlertTriangle,
          title: 'Notifications Not Set',
          description: 'Enable notifications to get reminders for your memos',
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800'
        };
    }
  };

  const statusInfo = getPermissionStatusInfo();
  const StatusIcon = statusInfo.icon;

  if (!('Notification' in window)) {
    return (
      <Card className={className}>
        <div className="p-6 text-center">
          <BellOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Notifications Not Supported
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your browser doesn't support push notifications. You can still use MemoApp, but won't receive reminder notifications.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="p-6">
        <AnimatePresence mode="wait">
          {currentStep === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <Bell className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Enable Notifications
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Get reminded to review your memos at the optimal time for better retention. 
                We'll send you smart notifications based on spaced repetition principles.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Privacy First</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Only learning reminders, no spam
                  </div>
                </div>
                <div className="text-center">
                  <Smartphone className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Cross-Device</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Works on desktop and mobile
                  </div>
                </div>
                <div className="text-center">
                  <Bell className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Smart Timing</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Based on your learning patterns
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={handleRequestPermission}
                  size="lg"
                  className="min-w-[140px]"
                >
                  Enable Notifications
                </Button>
                <Button
                  onClick={handleSkip}
                  variant="outline"
                  size="lg"
                  className="min-w-[140px]"
                >
                  Skip for Now
                </Button>
              </div>
            </motion.div>
          )}

          {currentStep === 'requesting' && (
            <motion.div
              key="requesting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="animate-pulse">
                <Bell className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Requesting Permission
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Please allow notifications in the browser dialog that appeared.
              </p>
            </motion.div>
          )}

          {currentStep === 'subscribing' && (
            <motion.div
              key="subscribing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="animate-spin">
                <Bell className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Setting Up Notifications
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Configuring your notification preferences...
              </p>
            </motion.div>
          )}

          {currentStep === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className={`p-4 rounded-lg border ${statusInfo.bgColor} ${statusInfo.borderColor} mb-4`}>
                <StatusIcon className={`h-8 w-8 mx-auto mb-2 ${statusInfo.color}`} />
                <div className={`font-medium ${statusInfo.color}`}>
                  {statusInfo.title}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {statusInfo.description}
                </div>
              </div>

              {notifications.permission === 'granted' && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  You can customize your notification preferences in the settings.
                </div>
              )}

              {notifications.permission === 'denied' && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-left">
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    To enable notifications later:
                  </div>
                  <ol className="text-sm text-gray-600 dark:text-gray-400 list-decimal list-inside space-y-1">
                    <li>Click the lock icon in your browser's address bar</li>
                    <li>Change notifications from "Block" to "Allow"</li>
                    <li>Refresh the page</li>
                  </ol>
                </div>
              )}
            </motion.div>
          )}

          {currentStep === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <XCircle className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Permission Denied
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error || 'Notification permission was denied.'}
              </p>
              <Button
                onClick={handleSkip}
                variant="outline"
                size="lg"
              >
                Continue Without Notifications
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
};