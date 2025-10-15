import { PrismaClient } from '@prisma/client';
import { 
  Memo, 
  CreateMemoRequest, 
  UpdateMemoRequest, 
  MemoFilters, 
  PaginatedMemos,
  ErrorCode 
} from '@memo-app/shared';
import { createApiError } from '../middleware/errorHandler';
import { prisma } from '../lib/database';

export class MemoService {
  /**
   * Create a new memo
   */
  static async createMemo(userId: string, data: CreateMemoRequest): Promise<Memo> {
    try {
      // Validate category ownership if categoryId is provided
      if (data.categoryId) {
        const category = await prisma.category.findFirst({
          where: {
            id: data.categoryId,
            userId: userId
          }
        });

        if (!category) {
          throw createApiError(
            'Category not found or access denied',
            404,
            ErrorCode.NOT_FOUND
          );
        }
      }

      const memo = await prisma.memo.create({
        data: {
          title: data.title,
          content: data.content,
          tags: data.tags || [],
          categoryId: data.categoryId,
          userId: userId,
          // Initialize spaced repetition defaults
          difficultyLevel: 3,
          easeFactor: 2.5,
          intervalDays: 1,
          repetitions: 0
        },
        include: {
          category: true
        }
      });

      return this.formatMemoResponse(memo);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw createApiError(
          'A memo with this title already exists',
          409,
          ErrorCode.CONFLICT
        );
      }
      throw error;
    }
  }

  /**
   * Get memos with filtering and pagination
   */
  static async getMemos(userId: string, filters: MemoFilters): Promise<PaginatedMemos> {
    const {
      categoryId,
      tags,
      search,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId: userId
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasEvery: tags
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } }
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = dateFrom;
      }
      if (dateTo) {
        where.createdAt.lte = dateTo;
      }
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    try {
      const [memos, total] = await Promise.all([
        prisma.memo.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            category: true
          }
        }),
        prisma.memo.count({ where })
      ]);

      const formattedMemos = memos.map(memo => this.formatMemoResponse(memo));

      return {
        memos: formattedMemos,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw createApiError(
        'Failed to retrieve memos',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get a single memo by ID
   */
  static async getMemoById(userId: string, memoId: string): Promise<Memo> {
    const memo = await prisma.memo.findFirst({
      where: {
        id: memoId,
        userId: userId
      },
      include: {
        category: true
      }
    });

    if (!memo) {
      throw createApiError(
        'Memo not found',
        404,
        ErrorCode.NOT_FOUND
      );
    }

    return this.formatMemoResponse(memo);
  }

  /**
   * Update a memo
   */
  static async updateMemo(
    userId: string, 
    memoId: string, 
    data: UpdateMemoRequest
  ): Promise<Memo> {
    // Check if memo exists and belongs to user
    const existingMemo = await prisma.memo.findFirst({
      where: {
        id: memoId,
        userId: userId
      }
    });

    if (!existingMemo) {
      throw createApiError(
        'Memo not found',
        404,
        ErrorCode.NOT_FOUND
      );
    }

    // Validate category ownership if categoryId is being updated
    if (data.categoryId !== undefined) {
      if (data.categoryId) {
        const category = await prisma.category.findFirst({
          where: {
            id: data.categoryId,
            userId: userId
          }
        });

        if (!category) {
          throw createApiError(
            'Category not found or access denied',
            404,
            ErrorCode.NOT_FOUND
          );
        }
      }
    }

    try {
      const updatedMemo = await prisma.memo.update({
        where: {
          id: memoId
        },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.content !== undefined && { content: data.content }),
          ...(data.tags !== undefined && { tags: data.tags }),
          ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
          updatedAt: new Date()
        },
        include: {
          category: true
        }
      });

      return this.formatMemoResponse(updatedMemo);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw createApiError(
          'A memo with this title already exists',
          409,
          ErrorCode.CONFLICT
        );
      }
      throw error;
    }
  }

  /**
   * Delete a memo
   */
  static async deleteMemo(userId: string, memoId: string): Promise<void> {
    const memo = await prisma.memo.findFirst({
      where: {
        id: memoId,
        userId: userId
      }
    });

    if (!memo) {
      throw createApiError(
        'Memo not found',
        404,
        ErrorCode.NOT_FOUND
      );
    }

    try {
      await prisma.memo.delete({
        where: {
          id: memoId
        }
      });
    } catch (error) {
      throw createApiError(
        'Failed to delete memo',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all unique tags for a user
   */
  static async getUserTags(userId: string): Promise<string[]> {
    const memos = await prisma.memo.findMany({
      where: {
        userId: userId
      },
      select: {
        tags: true
      }
    });

    // Flatten and deduplicate tags
    const allTags = memos.flatMap(memo => memo.tags);
    const uniqueTags = [...new Set(allTags)].sort();

    return uniqueTags;
  }

  /**
   * Get memos by specific tags
   */
  static async getMemosByTags(
    userId: string, 
    tags: string[], 
    options?: {
      matchAll?: boolean; // true = AND, false = OR
      sortBy?: 'createdAt' | 'updatedAt' | 'title';
      sortOrder?: 'asc' | 'desc';
      limit?: number;
    }
  ): Promise<Memo[]> {
    const {
      matchAll = false,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      limit = 50
    } = options || {};

    const where: any = {
      userId: userId
    };

    if (matchAll) {
      // All tags must be present (AND)
      where.tags = {
        hasEvery: tags
      };
    } else {
      // Any tag can be present (OR)
      where.tags = {
        hasSome: tags
      };
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const memos = await prisma.memo.findMany({
      where,
      orderBy,
      take: limit,
      include: {
        category: true
      }
    });

    return memos.map(memo => this.formatMemoResponse(memo));
  }

  /**
   * Get memo statistics for a user
   */
  static async getMemoStats(userId: string): Promise<{
    totalMemos: number;
    totalCategories: number;
    totalTags: number;
    memosThisWeek: number;
    memosThisMonth: number;
    averageMemosPerDay: number;
  }> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalMemos,
      totalCategories,
      memosThisWeek,
      memosThisMonth,
      allMemos
    ] = await Promise.all([
      prisma.memo.count({ where: { userId } }),
      prisma.category.count({ where: { userId } }),
      prisma.memo.count({ 
        where: { 
          userId, 
          createdAt: { gte: weekAgo } 
        } 
      }),
      prisma.memo.count({ 
        where: { 
          userId, 
          createdAt: { gte: monthAgo } 
        } 
      }),
      prisma.memo.findMany({
        where: { userId },
        select: { tags: true, createdAt: true }
      })
    ]);

    // Calculate unique tags
    const allTags = allMemos.flatMap(memo => memo.tags);
    const totalTags = new Set(allTags).size;

    // Calculate average memos per day (based on account age)
    const oldestMemo = allMemos.reduce((oldest, memo) => 
      memo.createdAt < oldest ? memo.createdAt : oldest, now
    );
    const daysSinceFirstMemo = Math.max(1, Math.ceil((now.getTime() - oldestMemo.getTime()) / (24 * 60 * 60 * 1000)));
    const averageMemosPerDay = totalMemos / daysSinceFirstMemo;

    return {
      totalMemos,
      totalCategories,
      totalTags,
      memosThisWeek,
      memosThisMonth,
      averageMemosPerDay: Math.round(averageMemosPerDay * 100) / 100
    };
  }

  /**
   * Search memos with full-text search
   */
  static async searchMemos(
    userId: string, 
    query: string, 
    limit: number = 10
  ): Promise<Memo[]> {
    const memos = await prisma.memo.findMany({
      where: {
        userId: userId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { tags: { hasSome: [query] } }
        ]
      },
      take: limit,
      orderBy: [
        { updatedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        category: true
      }
    });

    return memos.map(memo => this.formatMemoResponse(memo));
  }

  /**
   * Advanced search with multiple filters
   */
  static async advancedSearch(
    userId: string,
    filters: {
      query?: string;
      categoryId?: string;
      tags?: string[];
      dateFrom?: Date;
      dateTo?: Date;
      sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'nextReviewAt';
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedMemos> {
    const {
      query,
      categoryId,
      tags,
      dateFrom,
      dateTo,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId: userId
    };

    // Add search query
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
        { tags: { hasSome: [query] } }
      ];
    }

    // Add category filter
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Add tags filter
    if (tags && tags.length > 0) {
      where.tags = {
        hasEvery: tags
      };
    }

    // Add date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = dateFrom;
      }
      if (dateTo) {
        where.createdAt.lte = dateTo;
      }
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    try {
      const [memos, total] = await Promise.all([
        prisma.memo.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            category: true
          }
        }),
        prisma.memo.count({ where })
      ]);

      const formattedMemos = memos.map(memo => this.formatMemoResponse(memo));

      return {
        memos: formattedMemos,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw createApiError(
        'Failed to search memos',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Format memo response to match interface
   */
  private static formatMemoResponse(memo: any): Memo {
    return {
      id: memo.id,
      title: memo.title,
      content: memo.content,
      tags: memo.tags,
      categoryId: memo.categoryId,
      userId: memo.userId,
      createdAt: memo.createdAt,
      updatedAt: memo.updatedAt,
      lastReviewedAt: memo.lastReviewedAt,
      reviewCount: memo.reviewCount,
      difficultyLevel: memo.difficultyLevel,
      easeFactor: memo.easeFactor,
      intervalDays: memo.intervalDays,
      repetitions: memo.repetitions,
      nextReviewAt: memo.nextReviewAt
    };
  }
}