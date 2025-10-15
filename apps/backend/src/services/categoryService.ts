import { PrismaClient } from '@prisma/client';
import { 
  Category, 
  CreateCategoryRequest, 
  UpdateCategoryRequest,
  CategoryWithMemos,
  ErrorCode 
} from '@memo-app/shared';
import { createApiError } from '../middleware/errorHandler';
import { prisma } from '../lib/database';

export class CategoryService {
  /**
   * Create a new category
   */
  static async createCategory(userId: string, data: CreateCategoryRequest): Promise<Category> {
    try {
      // Check if category name already exists for this user
      const existingCategory = await prisma.category.findFirst({
        where: {
          name: data.name,
          userId: userId
        }
      });

      if (existingCategory) {
        throw createApiError(
          'A category with this name already exists',
          409,
          ErrorCode.CONFLICT
        );
      }

      const category = await prisma.category.create({
        data: {
          name: data.name,
          color: data.color || '#3B82F6',
          userId: userId
        }
      });

      return this.formatCategoryResponse(category, 0);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw createApiError(
          'A category with this name already exists',
          409,
          ErrorCode.CONFLICT
        );
      }
      throw error;
    }
  }

  /**
   * Get all categories for a user
   */
  static async getCategories(userId: string, filters?: {
    search?: string;
    sortBy?: 'name' | 'createdAt' | 'memoCount';
    sortOrder?: 'asc' | 'desc';
    includeEmpty?: boolean;
  }): Promise<Category[]> {
    const {
      search,
      sortBy = 'name',
      sortOrder = 'asc',
      includeEmpty = true
    } = filters || {};

    // Build where clause
    const where: any = {
      userId: userId
    };

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      };
    }

    try {
      const categories = await prisma.category.findMany({
        where,
        include: {
          _count: {
            select: {
              memos: true
            }
          }
        }
      });

      // Filter out empty categories if requested
      let filteredCategories = categories;
      if (!includeEmpty) {
        filteredCategories = categories.filter(cat => cat._count.memos > 0);
      }

      // Sort categories
      filteredCategories.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'createdAt':
            aValue = a.createdAt;
            bValue = b.createdAt;
            break;
          case 'memoCount':
            aValue = a._count.memos;
            bValue = b._count.memos;
            break;
          default:
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
        }

        if (sortOrder === 'desc') {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });

      return filteredCategories.map(category => 
        this.formatCategoryResponse(category, category._count.memos)
      );
    } catch (error) {
      throw createApiError(
        'Failed to retrieve categories',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get a single category by ID
   */
  static async getCategoryById(userId: string, categoryId: string): Promise<CategoryWithMemos> {
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: userId
      },
      include: {
        memos: {
          select: {
            id: true,
            title: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            memos: true
          }
        }
      }
    });

    if (!category) {
      throw createApiError(
        'Category not found',
        404,
        ErrorCode.NOT_FOUND
      );
    }

    return {
      id: category.id,
      name: category.name,
      color: category.color,
      userId: category.userId,
      memoCount: category._count.memos,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      syncVersion: category.syncVersion,
      isDeleted: category.isDeleted,
      memos: category.memos
    };
  }

  /**
   * Update a category
   */
  static async updateCategory(
    userId: string, 
    categoryId: string, 
    data: UpdateCategoryRequest
  ): Promise<Category> {
    // Check if category exists and belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: userId
      }
    });

    if (!existingCategory) {
      throw createApiError(
        'Category not found',
        404,
        ErrorCode.NOT_FOUND
      );
    }

    // Check if new name conflicts with existing category
    if (data.name && data.name !== existingCategory.name) {
      const nameConflict = await prisma.category.findFirst({
        where: {
          name: data.name,
          userId: userId,
          id: { not: categoryId }
        }
      });

      if (nameConflict) {
        throw createApiError(
          'A category with this name already exists',
          409,
          ErrorCode.CONFLICT
        );
      }
    }

    try {
      const updatedCategory = await prisma.category.update({
        where: {
          id: categoryId
        },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.color !== undefined && { color: data.color }),
          updatedAt: new Date()
        },
        include: {
          _count: {
            select: {
              memos: true
            }
          }
        }
      });

      return this.formatCategoryResponse(updatedCategory, updatedCategory._count.memos);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw createApiError(
          'A category with this name already exists',
          409,
          ErrorCode.CONFLICT
        );
      }
      throw error;
    }
  }

  /**
   * Delete a category
   */
  static async deleteCategory(
    userId: string, 
    categoryId: string,
    reassignment?: {
      action: 'reassign' | 'uncategorize';
      newCategoryId?: string;
    }
  ): Promise<void> {
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: userId
      },
      include: {
        _count: {
          select: {
            memos: true
          }
        }
      }
    });

    if (!category) {
      throw createApiError(
        'Category not found',
        404,
        ErrorCode.NOT_FOUND
      );
    }

    // Handle memo reassignment if category has memos
    if (category._count.memos > 0) {
      if (!reassignment) {
        throw createApiError(
          'Category has memos. Please specify how to handle them.',
          400,
          ErrorCode.VALIDATION_ERROR,
          { 
            memoCount: category._count.memos,
            requiresReassignment: true 
          }
        );
      }

      if (reassignment.action === 'reassign') {
        if (!reassignment.newCategoryId) {
          throw createApiError(
            'New category ID is required for reassignment',
            400,
            ErrorCode.VALIDATION_ERROR
          );
        }

        // Verify the target category exists and belongs to user
        const targetCategory = await prisma.category.findFirst({
          where: {
            id: reassignment.newCategoryId,
            userId: userId
          }
        });

        if (!targetCategory) {
          throw createApiError(
            'Target category not found',
            404,
            ErrorCode.NOT_FOUND
          );
        }

        // Reassign memos to new category
        await prisma.memo.updateMany({
          where: {
            categoryId: categoryId
          },
          data: {
            categoryId: reassignment.newCategoryId
          }
        });
      } else if (reassignment.action === 'uncategorize') {
        // Remove category from memos
        await prisma.memo.updateMany({
          where: {
            categoryId: categoryId
          },
          data: {
            categoryId: null
          }
        });
      }
    }

    try {
      await prisma.category.delete({
        where: {
          id: categoryId
        }
      });
    } catch (error) {
      throw createApiError(
        'Failed to delete category',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get tag suggestions based on existing tags
   */
  static async getTagSuggestions(userId: string, query?: string, limit: number = 10): Promise<string[]> {
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
    let uniqueTags = [...new Set(allTags)];

    // Filter by query if provided
    if (query) {
      uniqueTags = uniqueTags.filter(tag => 
        tag.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Sort alphabetically and limit results
    return uniqueTags.sort().slice(0, limit);
  }

  /**
   * Format category response to match interface
   */
  private static formatCategoryResponse(category: any, memoCount: number): Category {
    return {
      id: category.id,
      name: category.name,
      color: category.color,
      userId: category.userId,
      memoCount: memoCount,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      syncVersion: category.syncVersion || 1,
      isDeleted: category.isDeleted || false
    };
  }
}