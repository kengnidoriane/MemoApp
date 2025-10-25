import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../providers/ToastProvider';
import { NotificationType } from '@memo-app/shared/constants';

interface NotificationData {
  type: NotificationType;
  memoId?: string;
  sessionId?: string;
  action?: string;
  url?: string;
}

export const NotificationHandler: React.FC = () => {
  const navigate = useNavigate();
  const { showInfo, showSuccess, showWarning } = useToast();

  useEffect(() => {
    // Handle notification clicks from service worker
    const handleNotificationClick = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        const notificationData: NotificationData = event.data.data;
        handleNotificationAction(notificationData);
      }
    };

    // Handle direct notification API clicks (when app is open)
    const handleDirectNotificationClick = (event: NotificationEvent) => {
      event.notification.close();
      
      const data: NotificationData = event.notification.data;
      handleNotificationAction(data);
    };

    // Listen for messages from service worker
    navigator.serviceWorker?.addEventListener('message', handleNotificationClick);

    // Listen for direct notification clicks (when supported)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('notificationclick', handleDirectNotificationClick as any);
      });
    }

    // Handle notification actions from URL parameters (when app is opened via notification)
    const urlParams = new URLSearchParams(window.location.search);
    const notificationAction = urlParams.get('notification_action');
    const notificationData = urlParams.get('notification_data');
    
    if (notificationAction && notificationData) {
      try {
        const data: NotificationData = JSON.parse(decodeURIComponent(notificationData));
        handleNotificationAction(data);
        
        // Clean up URL parameters
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('notification_action');
        newUrl.searchParams.delete('notification_data');
        window.history.replaceState({}, '', newUrl.toString());
      } catch (error) {
        console.error('Failed to parse notification data from URL:', error);
      }
    }

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleNotificationClick);
    };
  }, [navigate, showInfo, showSuccess, showWarning]);

  const handleNotificationAction = (data: NotificationData) => {
    switch (data.type) {
      case NotificationType.REMINDER:
        if (data.memoId) {
          // Navigate to specific memo for review
          navigate(`/memos/${data.memoId}`);
          showInfo('Review Time!', 'Here\'s your memo ready for review.');
        } else {
          // Navigate to memos list for general review
          navigate('/memos?filter=due-for-review');
          showInfo('Review Time!', 'You have memos ready for review.');
        }
        break;

      case NotificationType.QUIZ_AVAILABLE:
        // Navigate to quiz page
        navigate('/quiz');
        showInfo('Quiz Time!', 'Test your knowledge with a quick quiz session.');
        break;

      case NotificationType.ACHIEVEMENT:
        // Navigate to analytics/progress page
        navigate('/analytics');
        showSuccess('Achievement Unlocked!', 'Check out your progress and achievements.');
        break;

      case NotificationType.MILESTONE:
        // Navigate to analytics/progress page
        navigate('/analytics');
        showSuccess('Milestone Reached!', 'Congratulations on your learning progress!');
        break;

      case NotificationType.SYNC_CONFLICT:
        // Navigate to sync resolution page or show modal
        navigate('/sync-conflicts');
        showWarning('Sync Conflict', 'Some changes need your attention to resolve conflicts.');
        break;

      case NotificationType.SYNC_COMPLETE:
        // Show success notification
        showSuccess('Sync Complete', 'Your memos have been synchronized across all devices.');
        break;

      default:
        // Handle custom actions
        if (data.action) {
          handleCustomAction(data.action, data);
        } else if (data.url) {
          navigate(data.url);
        }
        break;
    }
  };

  const handleCustomAction = (action: string, data: NotificationData) => {
    switch (action) {
      case 'review':
        if (data.memoId) {
          navigate(`/memos/${data.memoId}`);
        } else {
          navigate('/memos?filter=due-for-review');
        }
        break;

      case 'quiz':
        navigate('/quiz');
        break;

      case 'view':
        if (data.memoId) {
          navigate(`/memos/${data.memoId}`);
        }
        break;

      case 'dismiss':
        // Just show a confirmation
        showInfo('Reminder Dismissed', 'The reminder has been dismissed.');
        break;

      default:
        console.warn('Unknown notification action:', action);
        break;
    }
  };

  // This component doesn't render anything
  return null;
};

// Service Worker message types for TypeScript
interface NotificationEvent extends Event {
  notification: {
    close(): void;
    data: any;
  };
  action?: string;
}