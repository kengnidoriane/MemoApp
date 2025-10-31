import { SpacedRepetitionService, ReviewPerformance } from '../../src/services/spacedRepetitionService';
import { PrismaClient } from '@prisma/client';
import { SM2_CONSTANTS, DEFAULT_SR_SETTINGS, LEARNING_PHASES } from '@memo-app/shared';

// Mock Prisma
const mockPrisma = {
  memo: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
} as unknown as PrismaClient;

describe('SpacedRepetitionService', () => {
  let service: SpacedRepetitionService;

  beforeEach(() => {
    service = new SpacedRepetitionService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('calculateNextReview', () => {
    it('should reset interval and repetitions when memo is forgotten', () => {
      const performance: ReviewPerformance = { remembered: false };
      const result = service.calculateNextReview(2.5, 7, 3, performance);

      expect(result.intervalDays).toBe(SM2_CONSTANTS.INITIAL_INTERVAL);
      expect(result.repetitions).toBe(0);
      expect(result.easeFactor).toBeLessThan(2.5); // Should decrease
    });

    it('should increase interval for remembered memos', () => {
      const performance: ReviewPerformance = { remembered: true, confidence: 3 };
      const result = service.calculateNextReview(2.5, 7, 3, performance);

      expect(result.intervalDays).toBeGreaterThan(7);
      expect(result.repetitions).toBe(4);
    });

    it('should handle first repetition correctly', () => {
      const performance: ReviewPerformance = { remembered: true };
      const result = service.calculateNextReview(2.5, 1, 0, performance);

      expect(result.intervalDays).toBe(SM2_CONSTANTS.INITIAL_INTERVAL);
      expect(result.repetitions).toBe(1);
    });

    it('should handle second repetition correctly', () => {
      const performance: ReviewPerformance = { remembered: true };
      const result = service.calculateNextReview(2.5, 1, 1, performance);

      expect(result.intervalDays).toBe(SM2_CONSTANTS.SECOND_INTERVAL);
      expect(result.repetitions).toBe(2);
    });

    it('should apply SM-2 formula for subsequent repetitions', () => {
      const performance: ReviewPerformance = { remembered: true, confidence: 3 };
      const currentInterval = 7;
      const easeFactor = 2.5;
      const result = service.calculateNextReview(easeFactor, currentInterval, 2, performance);

      expect(result.intervalDays).toBe(Math.round(currentInterval * easeFactor));
      expect(result.repetitions).toBe(3);
    });

    it('should adjust ease factor based on confidence', () => {
      const easyPerformance: ReviewPerformance = { remembered: true, confidence: 5 };
      const hardPerformance: ReviewPerformance = { remembered: true, confidence: 1 };

      const easyResult = service.calculateNextReview(2.5, 7, 3, easyPerformance);
      const hardResult = service.calculateNextReview(2.5, 7, 3, hardPerformance);

      expect(easyResult.easeFactor).toBeGreaterThan(hardResult.easeFactor);
    });

    it('should respect minimum and maximum ease factor bounds', () => {
      const veryHardPerformance: ReviewPerformance = { remembered: false };
      const result = service.calculateNextReview(SM2_CONSTANTS.MIN_EASE_FACTOR, 1, 1, veryHardPerformance);

      expect(result.easeFactor).toBeGreaterThanOrEqual(SM2_CONSTANTS.MIN_EASE_FACTOR);
    });

    it('should respect interval bounds', () => {
      const performance: ReviewPerformance = { remembered: true, confidence: 5 };
      const result = service.calculateNextReview(4.0, 300, 10, performance);

      expect(result.intervalDays).toBeLessThanOrEqual(DEFAULT_SR_SETTINGS.maxInterval);
    });

    it('should calculate difficulty level correctly', () => {
      const performance: ReviewPerformance = { remembered: false };
      const result = service.calculateNextReview(1.3, 1, 1, performance);

      expect(result.difficultyLevel).toBeGreaterThanOrEqual(1);
      expect(result.difficultyLevel).toBeLessThanOrEqual(5);
    });

    it('should set next review date correctly', () => {
      const performance: ReviewPerformance = { remembered: true };
      const result = service.calculateNextReview(2.5, 7, 3, performance);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + result.intervalDays);

      expect(result.nextReviewAt.getDate()).toBe(expectedDate.getDate());
    });
  });

  describe('recordReview', () => {
    const mockMemo = {
      id: 'memo-1',
      userId: 'user-1',
      easeFactor: 2.5,
      intervalDays: 7,
      repetitions: 2,
      reviewCount: 5,
    };

    beforeEach(() => {
      (mockPrisma.memo.findFirst as jest.Mock).mockResolvedValue(mockMemo);
      (mockPrisma.memo.update as jest.Mock).mockResolvedValue({});
    });

    it('should update memo with new spaced repetition data', async () => {
      const performance: ReviewPerformance = { remembered: true, confidence: 3 };

      await service.recordReview('memo-1', performance, 'user-1');

      expect(mockPrisma.memo.update).toHaveBeenCalledWith({
        where: { id: 'memo-1' },
        data: expect.objectContaining({
          lastReviewedAt: expect.any(Date),
          reviewCount: 6,
          easeFactor: expect.any(Number),
          intervalDays: expect.any(Number),
          repetitions: expect.any(Number),
          nextReviewAt: expect.any(Date),
          difficultyLevel: expect.any(Number),
        }),
      });
    });

    it('should throw error if memo not found', async () => {
      (mockPrisma.memo.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.recordReview('nonexistent', { remembered: true }, 'user-1')
      ).rejects.toThrow('Memo not found');
    });

    it('should find memo with correct user filter', async () => {
      const performance: ReviewPerformance = { remembered: true };

      await service.recordReview('memo-1', performance, 'user-1');

      expect(mockPrisma.memo.findFirst).toHaveBeenCalledWith({
        where: { id: 'memo-1', userId: 'user-1' }
      });
    });
  });

  describe('getMemosForReview', () => {
    it('should return memos due for review', async () => {
      const mockMemos = [
        { id: 'memo-1', nextReviewAt: new Date(Date.now() - 86400000) }, // Yesterday
        { id: 'memo-2', nextReviewAt: null }, // New memo
      ];
      (mockPrisma.memo.findMany as jest.Mock).mockResolvedValue(mockMemos);

      const result = await service.getMemosForReview('user-1');

      expect(mockPrisma.memo.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          OR: [
            { nextReviewAt: { lte: expect.any(Date) } },
            { nextReviewAt: null }
          ]
        },
        orderBy: [
          { nextReviewAt: 'asc' },
          { createdAt: 'asc' }
        ],
        take: 20,
        include: {
          category: true
        }
      });

      expect(result).toEqual(mockMemos);
    });

    it('should respect limit parameter', async () => {
      (mockPrisma.memo.findMany as jest.Mock).mockResolvedValue([]);

      await service.getMemosForReview('user-1', 10);

      expect(mockPrisma.memo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
      );
    });
  });

  describe('getReviewStats', () => {
    beforeEach(() => {
      const mockMemoStats = [
        { easeFactor: 2.5, difficultyLevel: 3, repetitions: 2, reviewCount: 3 },
        { easeFactor: 2.0, difficultyLevel: 4, repetitions: 1, reviewCount: 1 },
        { easeFactor: 3.0, difficultyLevel: 1, repetitions: 5, reviewCount: 8 },
      ];

      (mockPrisma.memo.count as jest.Mock)
        .mockResolvedValueOnce(100) // totalMemos
        .mockResolvedValueOnce(15)  // dueForReview
        .mockResolvedValueOnce(5);  // reviewedToday

      (mockPrisma.memo.findMany as jest.Mock).mockResolvedValue(mockMemoStats);
    });

    it('should return comprehensive review statistics', async () => {
      const stats = await service.getReviewStats('user-1');

      expect(stats).toEqual({
        totalMemos: 100,
        dueForReview: 15,
        reviewedToday: 5,
        averageEaseFactor: 2.5, // (2.5 + 2.0 + 3.0) / 3
        difficultyDistribution: {
          1: 1,
          2: 0,
          3: 1,
          4: 1,
          5: 0
        },
        learningPhaseDistribution: {
          [LEARNING_PHASES.NEW]: 0,
          [LEARNING_PHASES.LEARNING]: 2,
          [LEARNING_PHASES.REVIEW]: 0,
          [LEARNING_PHASES.MASTERED]: 1
        }
      });
    });

    it('should handle empty memo collection', async () => {
      (mockPrisma.memo.count as jest.Mock)
        .mockResolvedValueOnce(0)  // totalMemos
        .mockResolvedValueOnce(0)  // dueForReview
        .mockResolvedValueOnce(0); // reviewedToday
      (mockPrisma.memo.findMany as jest.Mock).mockResolvedValue([]);

      const stats = await service.getReviewStats('user-1');

      expect(stats.averageEaseFactor).toBe(DEFAULT_SR_SETTINGS.easeFactor);
      expect(stats.totalMemos).toBe(0);
      expect(stats.dueForReview).toBe(0);
      expect(stats.reviewedToday).toBe(0);
    });
  });

  describe('updateDifficultyLevel', () => {
    const mockMemo = {
      id: 'memo-1',
      easeFactor: 2.0,
      repetitions: 3,
    };

    beforeEach(() => {
      (mockPrisma.memo.findUnique as jest.Mock).mockResolvedValue(mockMemo);
      (mockPrisma.memo.update as jest.Mock).mockResolvedValue({});
    });

    it('should update difficulty level based on ease factor', async () => {
      const performance: ReviewPerformance = { remembered: true };

      await service.updateDifficultyLevel('memo-1', performance);

      expect(mockPrisma.memo.update).toHaveBeenCalledWith({
        where: { id: 'memo-1' },
        data: { difficultyLevel: expect.any(Number) }
      });
    });

    it('should throw error if memo not found', async () => {
      (mockPrisma.memo.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateDifficultyLevel('nonexistent', { remembered: true })
      ).rejects.toThrow('Memo not found');
    });
  });

  describe('resetMemoProgress', () => {
    it('should reset all spaced repetition data to defaults', async () => {
      (mockPrisma.memo.update as jest.Mock).mockResolvedValue({});

      await service.resetMemoProgress('memo-1');

      expect(mockPrisma.memo.update).toHaveBeenCalledWith({
        where: { id: 'memo-1' },
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
    });
  });

  describe('private methods via public interface', () => {
    it('should map performance to correct review results', () => {
      // Test through calculateNextReview which uses mapPerformanceToResult
      const forgotResult = service.calculateNextReview(2.5, 7, 3, { remembered: false });
      const easyResult = service.calculateNextReview(2.5, 7, 3, { remembered: true, confidence: 5 });
      const hardResult = service.calculateNextReview(2.5, 7, 3, { remembered: true, confidence: 1 });

      expect(forgotResult.easeFactor).toBeLessThan(2.5);
      expect(easyResult.easeFactor).toBeGreaterThan(hardResult.easeFactor);
    });

    it('should calculate difficulty levels correctly', () => {
      // Test different ease factors
      const veryHardResult = service.calculateNextReview(1.3, 1, 1, { remembered: true });
      const easyResult = service.calculateNextReview(2.8, 1, 1, { remembered: true });

      expect(veryHardResult.difficultyLevel).toBeGreaterThan(easyResult.difficultyLevel);
    });
  });
});