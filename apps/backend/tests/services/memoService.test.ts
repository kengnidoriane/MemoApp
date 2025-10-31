import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { MemoService } from '../../src/services/memoService';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
const mockPrisma = {
  memo: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  category: {
    findUnique: jest.fn(),
  },
} as unknown as PrismaClient;

describe('MemoService', () => {
  let service: MemoService;

  beforeEach(() => {
    service = new MemoService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('createMemo', () => {
    it('should create a memo with default spaced repetition values', async () => {
      const memoData = {
        title: 'Test Memo',
        content: 'Test content',
        tags: ['test'],
        categoryId: 'cat-1',
        userId: 'user-1',
      };

      const expectedMemo = {
        id: 'memo-1',
        ...memoData,
        difficultyLevel: 3,
        easeFactor: 2.5,
        intervalDays: 1,
        repetitions: 0,
        reviewCount: 0,
        nextReviewAt: expect.any(Date),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      (mockPrisma.memo.create as jest.Mock).mockResolvedValue(expectedMemo);

      const result = await service.createMemo(memoData);

      expect(mockPrisma.memo.create).toHaveBeenCalledWith({
        data: {
          ...memoData,
          difficultyLevel: 3,
          easeFactor: 2.5,
          intervalDays: 1,
          repetitions: 0,
        },
        include: { category: true },
      });

      expect(result).toEqual(expectedMemo);
    });

    it('should validate category exists when categoryId is provided', async () => {
      const memoData = {
        title: 'Test Memo',
        content: 'Test content',
        tags: ['test'],
        categoryId: 'invalid-cat',
        userId: 'user-1',
      };

      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.createMemo(memoData)).rejects.toThrow('Category not found');

      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'invalid-cat', userId: 'user-1' },
      });
    });

    it('should handle memo creation without category', async () => {
      const memoData = {
        title: 'Test Memo',
        content: 'Test content',
        tags: ['test'],
        userId: 'user-1',
      };

      const expectedMemo = {
        id: 'memo-1',
        ...memoData,
        categoryId: null,
        difficultyLevel: 3,
        easeFactor: 2.5,
        intervalDays: 1,
        repetitions: 0,
        reviewCount: 0,
        nextReviewAt: expect.any(Date),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      (mockPrisma.memo.create as jest.Mock).mockResolvedValue(expectedMemo);

      const result = await service.createMemo(memoData);

      expect(mockPrisma.memo.create).toHaveBeenCalledWith({
        data: {
          ...memoData,
          difficultyLevel: 3,
          easeFactor: 2.5,
          intervalDays: 1,
          repetitions: 0,
        },
        include: { category: true },
      });

      expect(result).toEqual(expectedMemo);
    });
  });

  describe('searchMemos', () => {
    it('should search memos by title, content, and tags', async () => {
      const query = 'test search';
      const userId = 'user-1';
      const limit = 10;

      const expectedSearchResults = [
        {
          id: 'memo-1',
          title: 'Test Memo',
          content: 'This contains test search terms',
          tags: ['test'],
          userId,
        },
      ];

      (mockPrisma.memo.findMany as jest.Mock).mockResolvedValue(expectedSearchResults);

      const result = await service.searchMemos(userId, query, limit);

      expect(mockPrisma.memo.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          OR: [
            {
              title: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              content: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              tags: {
                hasSome: [query],
              },
            },
          ],
        },
        include: { category: true },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      });

      expect(result).toEqual(expectedSearchResults);
    });

    it('should handle empty search query', async () => {
      const query = '';
      const userId = 'user-1';
      const limit = 10;

      const result = await service.searchMemos(userId, query, limit);

      expect(result).toEqual([]);
      expect(mockPrisma.memo.findMany).not.toHaveBeenCalled();
    });

    it('should limit search results', async () => {
      const query = 'test';
      const userId = 'user-1';
      const limit = 5;

      (mockPrisma.memo.findMany as jest.Mock).mockResolvedValue([]);

      await service.searchMemos(userId, query, limit);

      expect(mockPrisma.memo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: limit,
        })
      );
    });
  });

  describe('getMemosWithFilters', () => {
    it('should apply category filter', async () => {
      const filters = {
        categoryId: 'cat-1',
        page: 1,
        limit: 20,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
      };
      const userId = 'user-1';

      (mockPrisma.memo.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.memo.count as jest.Mock).mockResolvedValue(0);

      await service.getMemosWithFilters(userId, filters);

      expect(mockPrisma.memo.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          categoryId: 'cat-1',
        },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should apply tags filter', async () => {
      const filters = {
        tags: ['important', 'work'],
        page: 1,
        limit: 20,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
      };
      const userId = 'user-1';

      (mockPrisma.memo.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.memo.count as jest.Mock).mockResolvedValue(0);

      await service.getMemosWithFilters(userId, filters);

      expect(mockPrisma.memo.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          tags: { hasEvery: ['important', 'work'] },
        },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should apply date range filter', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const filters = {
        startDate,
        endDate,
        page: 1,
        limit: 20,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
      };
      const userId = 'user-1';

      (mockPrisma.memo.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.memo.count as jest.Mock).mockResolvedValue(0);

      await service.getMemosWithFilters(userId, filters);

      expect(mockPrisma.memo.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should handle pagination correctly', async () => {
      const filters = {
        page: 3,
        limit: 10,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
      };
      const userId = 'user-1';

      (mockPrisma.memo.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.memo.count as jest.Mock).mockResolvedValue(0);

      await service.getMemosWithFilters(userId, filters);

      expect(mockPrisma.memo.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip: 20, // (page - 1) * limit = (3 - 1) * 10 = 20
        take: 10,
      });
    });

    it('should support different sorting options', async () => {
      const filters = {
        page: 1,
        limit: 20,
        sortBy: 'title' as const,
        sortOrder: 'asc' as const,
      };
      const userId = 'user-1';

      (mockPrisma.memo.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.memo.count as jest.Mock).mockResolvedValue(0);

      await service.getMemosWithFilters(userId, filters);

      expect(mockPrisma.memo.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: { category: true },
        orderBy: { title: 'asc' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('updateMemo', () => {
    it('should update memo and preserve spaced repetition data', async () => {
      const memoId = 'memo-1';
      const userId = 'user-1';
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        tags: ['updated'],
      };

      const existingMemo = {
        id: memoId,
        userId,
        title: 'Original Title',
        content: 'Original content',
        tags: ['original'],
        difficultyLevel: 4,
        easeFactor: 2.8,
        intervalDays: 7,
        repetitions: 3,
        reviewCount: 5,
      };

      const updatedMemo = {
        ...existingMemo,
        ...updateData,
        updatedAt: new Date(),
      };

      (mockPrisma.memo.findFirst as jest.Mock).mockResolvedValue(existingMemo);
      (mockPrisma.memo.update as jest.Mock).mockResolvedValue(updatedMemo);

      const result = await service.updateMemo(memoId, userId, updateData);

      expect(mockPrisma.memo.findFirst).toHaveBeenCalledWith({
        where: { id: memoId, userId },
      });

      expect(mockPrisma.memo.update).toHaveBeenCalledWith({
        where: { id: memoId },
        data: {
          ...updateData,
          updatedAt: expect.any(Date),
        },
        include: { category: true },
      });

      expect(result).toEqual(updatedMemo);
    });

    it('should throw error when memo not found', async () => {
      const memoId = 'nonexistent-memo';
      const userId = 'user-1';
      const updateData = { title: 'Updated Title' };

      (mockPrisma.memo.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.updateMemo(memoId, userId, updateData)).rejects.toThrow('Memo not found');

      expect(mockPrisma.memo.update).not.toHaveBeenCalled();
    });

    it('should validate category when updating categoryId', async () => {
      const memoId = 'memo-1';
      const userId = 'user-1';
      const updateData = {
        categoryId: 'invalid-cat',
      };

      const existingMemo = {
        id: memoId,
        userId,
        title: 'Test Memo',
        content: 'Test content',
      };

      (mockPrisma.memo.findFirst as jest.Mock).mockResolvedValue(existingMemo);
      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateMemo(memoId, userId, updateData)).rejects.toThrow('Category not found');

      expect(mockPrisma.memo.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteMemo', () => {
    it('should delete memo successfully', async () => {
      const memoId = 'memo-1';
      const userId = 'user-1';

      const existingMemo = {
        id: memoId,
        userId,
        title: 'Test Memo',
      };

      (mockPrisma.memo.findFirst as jest.Mock).mockResolvedValue(existingMemo);
      (mockPrisma.memo.delete as jest.Mock).mockResolvedValue(existingMemo);

      await service.deleteMemo(memoId, userId);

      expect(mockPrisma.memo.findFirst).toHaveBeenCalledWith({
        where: { id: memoId, userId },
      });

      expect(mockPrisma.memo.delete).toHaveBeenCalledWith({
        where: { id: memoId },
      });
    });

    it('should throw error when memo not found', async () => {
      const memoId = 'nonexistent-memo';
      const userId = 'user-1';

      (mockPrisma.memo.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteMemo(memoId, userId)).rejects.toThrow('Memo not found');

      expect(mockPrisma.memo.delete).not.toHaveBeenCalled();
    });
  });

  describe('getTagSuggestions', () => {
    it('should return unique tags from user memos', async () => {
      const userId = 'user-1';
      const mockMemos = [
        { tags: ['work', 'important'] },
        { tags: ['personal', 'work'] },
        { tags: ['study', 'important'] },
      ];

      (mockPrisma.memo.findMany as jest.Mock).mockResolvedValue(mockMemos);

      const result = await service.getTagSuggestions(userId);

      expect(mockPrisma.memo.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: { tags: true },
        distinct: ['tags'],
      });

      expect(result).toEqual(['work', 'important', 'personal', 'study']);
    });

    it('should handle empty tag collections', async () => {
      const userId = 'user-1';

      (mockPrisma.memo.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getTagSuggestions(userId);

      expect(result).toEqual([]);
    });

    it('should filter out empty tags', async () => {
      const userId = 'user-1';
      const mockMemos = [
        { tags: ['work', '', 'important'] },
        { tags: ['', 'personal'] },
        { tags: [] },
      ];

      (mockPrisma.memo.findMany as jest.Mock).mockResolvedValue(mockMemos);

      const result = await service.getTagSuggestions(userId);

      expect(result).toEqual(['work', 'important', 'personal']);
    });
  });
});