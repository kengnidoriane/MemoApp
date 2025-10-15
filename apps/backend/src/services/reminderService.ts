import { PrismaClient } from '@prisma/client';
import Bull, { Queue, Job } from 'bull';
import { SpacedRepetitionService } from './spacedRepetitionService';
import { NotificationService } from './notificationService';

export interface ReminderJobData {
  userId: string;
  memoId: string;
  type: 'spaced_repetition' | 'custom';
  scheduledFor: Date;
}

export interface ReminderFrequencyConfig {
  enabled: boolean;
  intervals: number[]; // in minutes: [10, 30, 60, 240, 1440, 4320, 10080] for 10min, 30min, 1h, 4h, 1day, 3days, 1week
  customReminders: boolean;
}

export interface ReminderHistory {
  id: string;
  memoId: string;
  scheduledFor: Date;
  sentAt: Date | null;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  type: 'spaced_repetition' | 'custom';
}

export class ReminderService {
  private reminderQueue: Queue<ReminderJobData>;
  
  constructor(
    private prisma: PrismaClient,
    private spacedRepetitionService: SpacedRepetitionService,
    private notificationService: NotificationService,
    redisUrl?: string
  ) {
    // Initialize Bull queue with Redis connection
    this.reminderQueue = new Bull('reminder processing', {
      redis: redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
      defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50,      // Keep last 50 failed jobs
        attempts: 3,           // Retry failed jobs 3 times
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    });

    // Set up job processing
    this.setupJobProcessing();
  }

  /**
   * Schedule a reminder for a memo based on spaced repetition
   */
  async scheduleSpacedRepetitionReminder(
    userId: string,
    memoId: string,
    nextReviewAt: Date
  ): Promise<void> {
    // Cancel any existing reminders for this memo
    await this.cancelReminder(memoId);

    // Create notification schedule record
    const schedule = await this.prisma.notificationSchedule.create({
      data: {
        userId,
        memoId,
        scheduledFor: nextReviewAt,
        status: 'pending',
        type: 'spaced_repetition'
      }
    });

    // Schedule the job
    const jobData: ReminderJobData = {
      userId,
      memoId,
      type: 'spaced_repetition',
      scheduledFor: nextReviewAt
    };

    await this.reminderQueue.add(
      'send-reminder',
      jobData,
      {
        delay: nextReviewAt.getTime() - Date.now(),
        jobId: `reminder-${memoId}` // Use memo ID as job ID for easy cancellation
      }
    );
  }

  /**
   * Schedule a custom reminder
   */
  async scheduleCustomReminder(
    userId: string,
    memoId: string,
    scheduledFor: Date
  ): Promise<void> {
    // Create notification schedule record
    const schedule = await this.prisma.notificationSchedule.create({
      data: {
        userId,
        memoId,
        scheduledFor,
        status: 'pending',
        type: 'custom'
      }
    });

    // Schedule the job
    const jobData: ReminderJobData = {
      userId,
      memoId,
      type: 'custom',
      scheduledFor
    };

    const jobId = `custom-reminder-${schedule.id}`;
    await this.reminderQueue.add(
      'send-reminder',
      jobData,
      {
        delay: scheduledFor.getTime() - Date.now(),
        jobId
      }
    );
  }

  /**
   * Cancel a reminder for a specific memo
   */
  async cancelReminder(memoId: string): Promise<void> {
    // Cancel the Bull job
    const job = await this.reminderQueue.getJob(`reminder-${memoId}`);
    if (job) {
      await job.remove();
    }

    // Update database records
    await this.prisma.notificationSchedule.updateMany({
      where: {
        memoId,
        status: 'pending'
      },
      data: {
        status: 'cancelled'
      }
    });
  }

  /**
   * Cancel all reminders for a user
   */
  async cancelAllReminders(userId: string): Promise<void> {
    // Get all pending reminders for the user
    const pendingReminders = await this.prisma.notificationSchedule.findMany({
      where: {
        userId,
        status: 'pending'
      }
    });

    // Cancel Bull jobs
    for (const reminder of pendingReminders) {
      const job = await this.reminderQueue.getJob(`reminder-${reminder.memoId}`);
      if (job) {
        await job.remove();
      }
    }

    // Update database records
    await this.prisma.notificationSchedule.updateMany({
      where: {
        userId,
        status: 'pending'
      },
      data: {
        status: 'cancelled'
      }
    });
  }

  /**
   * Get reminder frequency configuration for a user
   */
  async getReminderFrequencyConfig(userId: string): Promise<ReminderFrequencyConfig> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const preferences = user.preferences as any;
    return preferences.reminderFrequency || {
      enabled: true,
      intervals: [10, 30, 60, 240, 1440, 4320, 10080], // Default intervals
      customReminders: true
    };
  }

  /**
   * Update reminder frequency configuration for a user
   */
  async updateReminderFrequencyConfig(
    userId: string,
    config: ReminderFrequencyConfig
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const preferences = user.preferences as any;
    preferences.reminderFrequency = config;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        preferences
      }
    });

    // If reminders are disabled, cancel all pending reminders
    if (!config.enabled) {
      await this.cancelAllReminders(userId);
    }
  }

  /**
   * Get reminder history for a user
   */
  async getReminderHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ReminderHistory[]> {
    const schedules = await this.prisma.notificationSchedule.findMany({
      where: { userId },
      orderBy: { scheduledFor: 'desc' },
      take: limit,
      skip: offset,
      include: {
        memo: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    return schedules.map(schedule => ({
      id: schedule.id,
      memoId: schedule.memoId,
      scheduledFor: schedule.scheduledFor,
      sentAt: schedule.sentAt,
      status: schedule.status as any,
      type: (schedule as any).type || 'spaced_repetition'
    }));
  }

  /**
   * Get pending reminders for a user
   */
  async getPendingReminders(userId: string): Promise<ReminderHistory[]> {
    const schedules = await this.prisma.notificationSchedule.findMany({
      where: {
        userId,
        status: 'pending'
      },
      orderBy: { scheduledFor: 'asc' },
      include: {
        memo: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    return schedules.map(schedule => ({
      id: schedule.id,
      memoId: schedule.memoId,
      scheduledFor: schedule.scheduledFor,
      sentAt: schedule.sentAt,
      status: schedule.status as any,
      type: (schedule as any).type || 'spaced_repetition'
    }));
  }

  /**
   * Process due reminders (can be called manually or via cron)
   */
  async processDueReminders(): Promise<void> {
    const now = new Date();
    
    const dueReminders = await this.prisma.notificationSchedule.findMany({
      where: {
        status: 'pending',
        scheduledFor: {
          lte: now
        }
      },
      include: {
        memo: true,
        user: true
      }
    });

    for (const reminder of dueReminders) {
      try {
        // Send the notification
        await this.notificationService.sendReminderNotification(
          reminder.user,
          reminder.memo
        );

        // Update the schedule as sent
        await this.prisma.notificationSchedule.update({
          where: { id: reminder.id },
          data: {
            status: 'sent',
            sentAt: new Date()
          }
        });
      } catch (error) {
        console.error(`Failed to send reminder ${reminder.id}:`, error);
        
        // Mark as failed
        await this.prisma.notificationSchedule.update({
          where: { id: reminder.id },
          data: {
            status: 'failed'
          }
        });
      }
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.reminderQueue.getWaiting(),
      this.reminderQueue.getActive(),
      this.reminderQueue.getCompleted(),
      this.reminderQueue.getFailed(),
      this.reminderQueue.getDelayed()
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length
    };
  }

  /**
   * Setup job processing handlers
   */
  private setupJobProcessing(): void {
    this.reminderQueue.process('send-reminder', async (job: Job<ReminderJobData>) => {
      const { userId, memoId, type, scheduledFor } = job.data;

      try {
        // Get the memo and user
        const memo = await this.prisma.memo.findFirst({
          where: { id: memoId, userId }
        });

        const user = await this.prisma.user.findUnique({
          where: { id: userId }
        });

        if (!memo || !user) {
          throw new Error('Memo or user not found');
        }

        // Check if user has notifications enabled
        const preferences = user.preferences as any;
        const reminderConfig = preferences.reminderFrequency;
        
        if (!reminderConfig?.enabled) {
          console.log(`Skipping reminder for user ${userId} - notifications disabled`);
          return;
        }

        // Send the notification
        await this.notificationService.sendReminderNotification(user, memo);

        // Update the notification schedule
        await this.prisma.notificationSchedule.updateMany({
          where: {
            memoId,
            scheduledFor,
            status: 'pending'
          },
          data: {
            status: 'sent',
            sentAt: new Date()
          }
        });

        console.log(`Reminder sent successfully for memo ${memoId}`);
      } catch (error) {
        console.error(`Failed to process reminder job:`, error);
        
        // Update the notification schedule as failed
        await this.prisma.notificationSchedule.updateMany({
          where: {
            memoId,
            scheduledFor,
            status: 'pending'
          },
          data: {
            status: 'failed'
          }
        });

        throw error; // Re-throw to trigger Bull's retry mechanism
      }
    });

    // Handle job events
    this.reminderQueue.on('completed', (job: Job<ReminderJobData>) => {
      console.log(`Reminder job ${job.id} completed successfully`);
    });

    this.reminderQueue.on('failed', (job: Job<ReminderJobData>, err: Error) => {
      console.error(`Reminder job ${job.id} failed:`, err.message);
    });

    this.reminderQueue.on('stalled', (job: Job<ReminderJobData>) => {
      console.warn(`Reminder job ${job.id} stalled`);
    });
  }

  /**
   * Gracefully close the queue connection
   */
  async close(): Promise<void> {
    await this.reminderQueue.close();
  }
}