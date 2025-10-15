import { PrismaClient } from '@prisma/client';
import { 
  SM2_CONSTANTS, 
  ReviewResult, 
  DEFAULT_SR_SETTINGS,
  LEARNING_PHASES,
  type LearningPhase 
} from '@memo-app/shared';

export interface ReviewPerformance {
  remembered: boolean;
  responseTime?: number;
  confidence?: 1 | 2 | 3 | 4 | 5;
}

export interface SM2Calculation {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: Date;
  difficultyLevel: number;
}

export interface ReviewHistoryEntry {
  memoId: string;
  reviewedAt: Date;
  performance: ReviewPerformance;
  previousInterval: number;
  newInterval: number;
  easeFactor: number;
}

export class SpacedRepetitionService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Calculate next review parameters using SM-2 algorithm
   */
  calculateNextReview(
    currentEaseFactor: number,
    currentInterval: number,
    currentRepetitions: number,
    performance: ReviewPerformance
  ): SM2Calculation {
    const reviewResult = this.mapPerformanceToResult(performance);
    
    // Calculate new ease factor
    let newEaseFactor = currentEaseFactor;
    const easeAdjustment = SM2_CONSTANTS.EASE_ADJUSTMENTS[reviewResult];
    newEaseFactor = Math.max(
      SM2_CONSTANTS.MIN_EASE_FACTOR,
      Math.min(SM2_CONSTANTS.MAX_EASE_FACTOR, currentEaseFactor + easeAdjustment)
    );

    // Calculate new interval and repetitions
    let newInterval: number;
    let newRepetitions: number;

    if (reviewResult === ReviewResult.FORGOT) {
      // Reset to beginning
      newInterval = SM2_CONSTANTS.INITIAL_INTERVAL;
      newRepetitions = 0;
    } else {
      newRepetitions = currentRepetitions + 1;
      
      if (newRepetitions === 1) {
        newInterval = SM2_CONSTANTS.INITIAL_INTERVAL;
      } else if (newRepetitions === 2) {
        newInterval = SM2_CONSTANTS.SECOND_INTERVAL;
      } else {
        // Apply SM-2 formula: I(n) = I(n-1) * EF
        const multiplier = SM2_CONSTANTS.INTERVAL_MULTIPLIERS[reviewResult];
        if (reviewResult === ReviewResult.GOOD) {
          newInterval = Math.round(currentInterval * newEaseFactor);
        } else {
          newInterval = Math.round(currentInterval * newEaseFactor * multiplier);
        }
      }
    }

    // Ensure interval is within bounds
    newInterval = Math.max(DEFAULT_SR_SETTINGS.minInterval, 
                          Math.min(DEFAULT_SR_SETTINGS.maxInterval, newInterval));

    // Calculate difficulty level based on ease factor
    const difficultyLevel = this.calculateDifficultyLevel(newEaseFactor, newRepetitions);

    // Calculate next review date
    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

    return {
      easeFactor: newEaseFactor,
      intervalDays: newInterval,
      repetitions: newRepetitions,
      nextReviewAt,
      difficultyLevel
    };
  }

  /**
   * Record a review and update memo spaced repetition data
   */
  async recordReview(
    memoId: string,
    performance: ReviewPerformance,
    userId: string
  ): Promise<void> {
    const memo = await this.prisma.memo.findFirst({
      where: { id: memoId, userId }
    });

    if (!memo) {
      throw new Error('Memo not found');
    }

    // Calculate new SM-2 parameters
    const calculation = this.calculateNextReview(
      memo.easeFactor,
      memo.intervalDays,
      memo.repetitions,
      performance
    );

    // Update memo with new spaced repetition data
    await this.prisma.memo.update({
      where: { id: memoId },
      data: {
        lastReviewedAt: new Date(),
        reviewCount: memo.reviewCount + 1,
        easeFactor: calculation.easeFactor,
        intervalDays: calculation.intervalDays,
        repetitions: calculation.repetitions,
        nextReviewAt: calculation.nextReviewAt,
        difficultyLevel: calculation.difficultyLevel
      }
    });

    // Record review history (we'll store this in quiz_answers for now)
    // In a full implementation, you might want a separate review_history table
  }

  /**
   * Get memos that are due for review
   */
  async getMemosForReview(userId: string, limit: number = 20): Promise<any[]> {
    const now = new Date();
    
    return this.prisma.memo.findMany({
      where: {
        userId,
        OR: [
          { nextReviewAt: { lte: now } },
          { nextReviewAt: null } // New memos that haven't been reviewed
        ]
      },
      orderBy: [
        { nextReviewAt: 'asc' },
        { createdAt: 'asc' }
      ],
      take: limit,
      include: {
        category: true
      }
    });
  }

  /**
   * Get review statistics for a user
   */
  async getReviewStats(userId: string): Promise<{
    totalMemos: number;
    dueForReview: number;
    reviewedToday: number;
    averageEaseFactor: number;
    difficultyDistribution: Record<number, number>;
    learningPhaseDistribution: Record<LearningPhase, number>;
  }> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalMemos,
      dueForReview,
      reviewedToday,
      memoStats
    ] = await Promise.all([
      this.prisma.memo.count({ where: { userId } }),
      this.prisma.memo.count({
        where: {
          userId,
          OR: [
            { nextReviewAt: { lte: now } },
            { nextReviewAt: null }
          ]
        }
      }),
      this.prisma.memo.count({
        where: {
          userId,
          lastReviewedAt: { gte: todayStart }
        }
      }),
      this.prisma.memo.findMany({
        where: { userId },
        select: {
          easeFactor: true,
          difficultyLevel: true,
          repetitions: true,
          reviewCount: true
        }
      })
    ]);

    // Calculate average ease factor
    const averageEaseFactor = memoStats.length > 0
      ? memoStats.reduce((sum, memo) => sum + memo.easeFactor, 0) / memoStats.length
      : DEFAULT_SR_SETTINGS.easeFactor;

    // Calculate difficulty distribution
    const difficultyDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    memoStats.forEach(memo => {
      difficultyDistribution[memo.difficultyLevel] = 
        (difficultyDistribution[memo.difficultyLevel] || 0) + 1;
    });

    // Calculate learning phase distribution
    const learningPhaseDistribution: Record<LearningPhase, number> = {
      [LEARNING_PHASES.NEW]: 0,
      [LEARNING_PHASES.LEARNING]: 0,
      [LEARNING_PHASES.REVIEW]: 0,
      [LEARNING_PHASES.MASTERED]: 0
    };

    memoStats.forEach(memo => {
      const phase = this.getLearningPhase(memo.repetitions, memo.reviewCount);
      learningPhaseDistribution[phase]++;
    });

    return {
      totalMemos,
      dueForReview,
      reviewedToday,
      averageEaseFactor,
      difficultyDistribution,
      learningPhaseDistribution
    };
  }

  /**
   * Update difficulty level for a memo based on performance
   */
  async updateDifficultyLevel(memoId: string, performance: ReviewPerformance): Promise<void> {
    const memo = await this.prisma.memo.findUnique({
      where: { id: memoId }
    });

    if (!memo) {
      throw new Error('Memo not found');
    }

    const newDifficultyLevel = this.calculateDifficultyLevel(memo.easeFactor, memo.repetitions);
    
    await this.prisma.memo.update({
      where: { id: memoId },
      data: { difficultyLevel: newDifficultyLevel }
    });
  }

  /**
   * Reset spaced repetition data for a memo
   */
  async resetMemoProgress(memoId: string): Promise<void> {
    await this.prisma.memo.update({
      where: { id: memoId },
      data: {
        easeFactor: DEFAULT_SR_SETTINGS.easeFactor,
        intervalDays: DEFAULT_SR_SETTINGS.initialInterval,
        repetitions: 0,
        reviewCount: 0,
        difficultyLevel: DEFAULT_SR_SETTINGS.difficultyLevel,
        lastReviewedAt: null,
        nextReviewAt: null
      }
    });
  }

  /**
   * Map performance to SM-2 review result
   */
  private mapPerformanceToResult(performance: ReviewPerformance): ReviewResult {
    if (!performance.remembered) {
      return ReviewResult.FORGOT;
    }

    // Use confidence level if provided
    if (performance.confidence) {
      switch (performance.confidence) {
        case 1:
        case 2:
          return ReviewResult.HARD;
        case 3:
          return ReviewResult.GOOD;
        case 4:
        case 5:
          return ReviewResult.EASY;
        default:
          return ReviewResult.GOOD;
      }
    }

    // Use response time if provided (assuming faster = easier)
    if (performance.responseTime) {
      if (performance.responseTime < 3000) { // Less than 3 seconds
        return ReviewResult.EASY;
      } else if (performance.responseTime < 10000) { // Less than 10 seconds
        return ReviewResult.GOOD;
      } else {
        return ReviewResult.HARD;
      }
    }

    // Default to GOOD if remembered but no additional data
    return ReviewResult.GOOD;
  }

  /**
   * Calculate difficulty level based on ease factor and repetitions
   */
  private calculateDifficultyLevel(easeFactor: number, repetitions: number): number {
    // Lower ease factor = higher difficulty
    if (easeFactor <= 1.5) return 5; // Very Hard
    if (easeFactor <= 1.8) return 4; // Hard
    if (easeFactor <= 2.2) return 3; // Medium
    if (easeFactor <= 2.5) return 2; // Easy
    return 1; // Very Easy
  }

  /**
   * Determine learning phase based on repetitions and review count
   */
  private getLearningPhase(repetitions: number, reviewCount: number): LearningPhase {
    if (repetitions === 0) return LEARNING_PHASES.NEW;
    if (repetitions < 3) return LEARNING_PHASES.LEARNING;
    if (reviewCount >= 5 && repetitions >= 5) return LEARNING_PHASES.MASTERED;
    return LEARNING_PHASES.REVIEW;
  }
}