import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { ReminderService } from '../services/reminderService';
import { SpacedRepetitionService } from '../services/spacedRepetitionService';
import { NotificationService } from '../services/notificationService';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Initialize services
const notificationService = new NotificationService(prisma);
const spacedRepetitionService = new SpacedRepetitionService(prisma);
const reminderService = new ReminderService(
  prisma,
  spacedRepetitionService,
  notificationService
);

// Validation schemas
const reminderFrequencyConfigSchema = z.object({
  enabled: z.boolean(),
  intervals: z.array(z.number().positive()),
  customReminders: z.boolean()
});

const customReminderSchema = z.object({
  memoId: z.string().uuid(),
  scheduledFor: z.string().datetime()
});

const notificationPreferencesSchema = z.object({
  pushEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  reminderTypes: z.object({
    spacedRepetition: z.boolean(),
    custom: z.boolean(),
    quiz: z.boolean()
  }),
  quietHours: z.object({
    enabled: z.boolean(),
    start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
  })
});

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string()
  })
});

/**
 * GET /api/reminders/config
 * Get reminder frequency configuration for the authenticated user
 */
router.get('/config', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const config = await reminderService.getReminderFrequencyConfig(userId);
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error getting reminder config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reminder configuration'
    });
  }
});

/**
 * PUT /api/reminders/config
 * Update reminder frequency configuration for the authenticated user
 */
router.put('/config', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const validation = reminderFrequencyConfigSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid reminder configuration',
        details: validation.error.errors
      });
    }

    await reminderService.updateReminderFrequencyConfig(userId, validation.data);
    
    return res.json({
      success: true,
      message: 'Reminder configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating reminder config:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update reminder configuration'
    });
  }
});

/**
 * POST /api/reminders/custom
 * Schedule a custom reminder for a memo
 */
router.post('/custom', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const validation = customReminderSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid reminder data',
        details: validation.error.errors
      });
    }

    const { memoId, scheduledFor } = validation.data;
    const scheduledDate = new Date(scheduledFor);

    // Verify the memo belongs to the user
    const memo = await prisma.memo.findFirst({
      where: { id: memoId, userId }
    });

    if (!memo) {
      return res.status(404).json({
        success: false,
        error: 'Memo not found'
      });
    }

    // Check if the scheduled time is in the future
    if (scheduledDate <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Reminder must be scheduled for a future time'
      });
    }

    await reminderService.scheduleCustomReminder(userId, memoId, scheduledDate);
    
    return res.json({
      success: true,
      message: 'Custom reminder scheduled successfully'
    });
  } catch (error) {
    console.error('Error scheduling custom reminder:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to schedule custom reminder'
    });
  }
});

/**
 * DELETE /api/reminders/:memoId
 * Cancel reminder for a specific memo
 */
router.delete('/:memoId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { memoId } = req.params;

    // Verify the memo belongs to the user
    const memo = await prisma.memo.findFirst({
      where: { id: memoId, userId }
    });

    if (!memo) {
      return res.status(404).json({
        success: false,
        error: 'Memo not found'
      });
    }

    await reminderService.cancelReminder(memoId);
    
    return res.json({
      success: true,
      message: 'Reminder cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling reminder:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cancel reminder'
    });
  }
});

/**
 * DELETE /api/reminders
 * Cancel all reminders for the authenticated user
 */
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    await reminderService.cancelAllReminders(userId);
    
    res.json({
      success: true,
      message: 'All reminders cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling all reminders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel all reminders'
    });
  }
});

/**
 * GET /api/reminders/history
 * Get reminder history for the authenticated user
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const history = await reminderService.getReminderHistory(userId, limit, offset);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error getting reminder history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reminder history'
    });
  }
});

/**
 * GET /api/reminders/pending
 * Get pending reminders for the authenticated user
 */
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const pending = await reminderService.getPendingReminders(userId);
    
    res.json({
      success: true,
      data: pending
    });
  } catch (error) {
    console.error('Error getting pending reminders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending reminders'
    });
  }
});

/**
 * GET /api/reminders/notifications/preferences
 * Get notification preferences for the authenticated user
 */
router.get('/notifications/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const preferences = await notificationService.getNotificationPreferences(userId);
    
    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification preferences'
    });
  }
});

/**
 * PUT /api/reminders/notifications/preferences
 * Update notification preferences for the authenticated user
 */
router.put('/notifications/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const validation = notificationPreferencesSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid notification preferences',
        details: validation.error.errors
      });
    }

    await notificationService.updateNotificationPreferences(userId, validation.data);
    
    return res.json({
      success: true,
      message: 'Notification preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences'
    });
  }
});

/**
 * POST /api/reminders/notifications/subscribe
 * Subscribe to push notifications
 */
router.post('/notifications/subscribe', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const validation = pushSubscriptionSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid push subscription data',
        details: validation.error.errors
      });
    }

    await notificationService.subscribeToPushNotifications(userId, validation.data);
    
    return res.json({
      success: true,
      message: 'Successfully subscribed to push notifications'
    });
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to subscribe to push notifications'
    });
  }
});

/**
 * DELETE /api/reminders/notifications/subscribe
 * Unsubscribe from push notifications
 */
router.delete('/notifications/subscribe', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    await notificationService.unsubscribeFromPushNotifications(userId);
    
    res.json({
      success: true,
      message: 'Successfully unsubscribed from push notifications'
    });
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unsubscribe from push notifications'
    });
  }
});

/**
 * GET /api/reminders/notifications/stats
 * Get notification delivery statistics
 */
router.get('/notifications/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const stats = await notificationService.getNotificationStats(userId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting notification stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification statistics'
    });
  }
});

/**
 * GET /api/reminders/vapid-public-key
 * Get VAPID public key for push notification subscription
 */
router.get('/vapid-public-key', (req, res) => {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  
  if (!vapidPublicKey) {
    return res.status(500).json({
      success: false,
      error: 'VAPID public key not configured'
    });
  }

  return res.json({
    success: true,
    data: {
      publicKey: vapidPublicKey
    }
  });
});

/**
 * POST /api/reminders/notifications/test
 * Send a test push notification
 */
router.post('/notifications/test', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    await notificationService.sendTestNotification(userId);
    
    res.json({
      success: true,
      message: 'Test notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification'
    });
  }
});

/**
 * GET /api/reminders/queue/stats
 * Get queue statistics (admin endpoint)
 */
router.get('/queue/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await reminderService.getQueueStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get queue statistics'
    });
  }
});

export default router;