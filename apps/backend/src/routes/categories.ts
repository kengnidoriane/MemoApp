import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CategoryService } from '../services/categoryService';
import { authenticateToken } from '../middleware/auth';
import { createApiError } from '../middleware/errorHandler';
import { validateBody, validateQuery } from '../middleware/validation';
import { 
  createCategorySchema,
  updateCategorySchema,
  categoryFiltersSchema,
  categoryIdSchema,
  categoryReassignmentSchema,
  ErrorCode
} from '@memo-app/shared';

const router = Router();

/**
 * POST /categories
 * Create a new category
 */
router.post('/',
  authenticateToken,
  validateBody(createCategorySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createApiError('User not authenticated', 401, ErrorCode.AUTHENTICATION_ERROR);
      }

      const category = await CategoryService.createCategory(req.user.id, req.body);

      res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /categories
 * Get all categories for the user
 */
router.get('/',
  authenticateToken,
  validateQuery(categoryFiltersSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createApiError('User not authenticated', 401, ErrorCode.AUTHENTICATION_ERROR);
      }

      const filters = req.query as any;
      const categories = await CategoryService.getCategories(req.user.id, filters);

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /categories/:id
 * Get a single category with its memos
 */
router.get('/:id',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createApiError('User not authenticated', 401, ErrorCode.AUTHENTICATION_ERROR);
      }

      // Validate category ID format
      const parseResult = categoryIdSchema.safeParse(req.params.id);
      if (!parseResult.success) {
        throw createApiError('Invalid category ID format', 400, ErrorCode.VALIDATION_ERROR);
      }

      const category = await CategoryService.getCategoryById(req.user.id, req.params.id);

      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /categories/:id
 * Update a category
 */
router.put('/:id',
  authenticateToken,
  validateBody(updateCategorySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createApiError('User not authenticated', 401, ErrorCode.AUTHENTICATION_ERROR);
      }

      // Validate category ID format
      const parseResult = categoryIdSchema.safeParse(req.params.id);
      if (!parseResult.success) {
        throw createApiError('Invalid category ID format', 400, ErrorCode.VALIDATION_ERROR);
      }

      const category = await CategoryService.updateCategory(req.user.id, req.params.id, req.body);

      res.json({
        success: true,
        data: category,
        message: 'Category updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /categories/:id
 * Delete a category
 */
router.delete('/:id',
  authenticateToken,
  validateBody(categoryReassignmentSchema.optional()),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createApiError('User not authenticated', 401, ErrorCode.AUTHENTICATION_ERROR);
      }

      // Validate category ID format
      const parseResult = categoryIdSchema.safeParse(req.params.id);
      if (!parseResult.success) {
        throw createApiError('Invalid category ID format', 400, ErrorCode.VALIDATION_ERROR);
      }

      const reassignment = req.body || undefined;
      await CategoryService.deleteCategory(req.user.id, req.params.id, reassignment);

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /categories/tags/suggestions
 * Get tag suggestions based on existing tags
 */
router.get('/tags/suggestions',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createApiError('User not authenticated', 401, ErrorCode.AUTHENTICATION_ERROR);
      }

      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 10;

      // Validate limit
      if (limit < 1 || limit > 50) {
        throw createApiError('Limit must be between 1 and 50', 400, ErrorCode.VALIDATION_ERROR);
      }

      const suggestions = await CategoryService.getTagSuggestions(req.user.id, query, limit);

      res.json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;