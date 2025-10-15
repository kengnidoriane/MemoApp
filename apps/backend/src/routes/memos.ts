import { Router, Request, Response, NextFunction } from 'express';
import { MemoService } from '../services/memoService';
import { authenticateToken } from '../middleware/auth';
import { createApiError } from '../middleware/errorHandler';
import { validateBody, validateQuery } from '../middleware/validation';
import { 
  createMemoSchema,
  updateMemoSchema,
  memoFiltersSchema,
  searchQuerySchema,
  memoIdSchema,
  ErrorCode
} from '@memo-app/shared';

const router = Router();

/**
 * POST /memos
 * Create a new memo
 */
router.post('/',
  authenticateToken,
  validateBody(createMemoSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createApiError('User not authenticated', 401, ErrorCode.AUTHENTICATION_ERROR);
      }

      const memo = await MemoService.createMemo(req.user.id, req.body);

      res.status(201).json({
        success: true,
        data: memo,
        message: 'Memo created successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /memos
 * Get memos with filtering and pagination
 */
router.get('/',
  authenticateToken,
  validateQuery(memoFiltersSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createApiError('User not authenticated', 401, ErrorCode.AUTHENTICATION_ERROR);
      }

      const filters = req.query as any;
      const result = await MemoService.getMemos(req.user.id, filters);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /memos/search
 * Search memos with full-text search
 */
router.get('/search',
  authenticateToken,
  validateQuery(searchQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createApiError('User not authenticated', 401, ErrorCode.AUTHENTICATION_ERROR);
      }

      const { query, limit } = req.query as any;
      const memos = await MemoService.searchMemos(req.user.id, query, limit);

      res.json({
        success: true,
        data: memos
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /memos/advanced-search
 * Advanced search with multiple filters and pagination
 */
router.get('/advanced-search',
  authenticateToken,
  validateQuery(memoFiltersSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createApiError('User not authenticated', 401, ErrorCode.AUTHENTICATION_ERROR);
      }

      const filters = req.query as any;
      const result = await MemoService.advancedSearch(req.user.id, filters);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /memos/tags
 * Get all unique tags for the user
 */
router.get('/tags',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createApiError('User not authenticated', 401, ErrorCode.AUTHENTICATION_ERROR);
      }

      const tags = await MemoService.getUserTags(req.user.id);

      res.json({
        success: true,
        data: tags
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /memos/by-tags
 * Get memos filtered by specific tags
 */
router.get('/by-tags',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createApiError('User not authenticated', 401, ErrorCode.AUTHENTICATION_ERROR);
      }

      const tags = req.query.tags as string | string[];
      const matchAll = req.query.matchAll === 'true';
      const sortBy = req.query.sortBy as 'createdAt' | 'updatedAt' | 'title' || 'updatedAt';
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' || 'desc';
      const limit = parseInt(req.query.limit as string) || 50;

      if (!tags) {
        throw createApiError('Tags parameter is required', 400, ErrorCode.VALIDATION_ERROR);
      }

      const tagArray = Array.isArray(tags) ? tags : [tags];
      
      if (tagArray.length === 0) {
        throw createApiError('At least one tag is required', 400, ErrorCode.VALIDATION_ERROR);
      }

      const memos = await MemoService.getMemosByTags(req.user.id, tagArray, {
        matchAll,
        sortBy,
        sortOrder,
        limit
      });

      res.json({
        success: true,
        data: memos
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /memos/stats
 * Get memo statistics for the user
 */
router.get('/stats',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createApiError('User not authenticated', 401, ErrorCode.AUTHENTICATION_ERROR);
      }

      const stats = await MemoService.getMemoStats(req.user.id);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /memos/:id
 * Get a single memo by ID
 */
router.get('/:id',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createApiError('User not authenticated', 401, ErrorCode.AUTHENTICATION_ERROR);
      }

      // Validate memo ID format
      const parseResult = memoIdSchema.safeParse(req.params.id);
      if (!parseResult.success) {
        throw createApiError('Invalid memo ID format', 400, ErrorCode.VALIDATION_ERROR);
      }

      const memo = await MemoService.getMemoById(req.user.id, req.params.id);

      res.json({
        success: true,
        data: memo
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /memos/:id
 * Update a memo
 */
router.put('/:id',
  authenticateToken,
  validateBody(updateMemoSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createApiError('User not authenticated', 401, ErrorCode.AUTHENTICATION_ERROR);
      }

      // Validate memo ID format
      const parseResult = memoIdSchema.safeParse(req.params.id);
      if (!parseResult.success) {
        throw createApiError('Invalid memo ID format', 400, ErrorCode.VALIDATION_ERROR);
      }

      const memo = await MemoService.updateMemo(req.user.id, req.params.id, req.body);

      res.json({
        success: true,
        data: memo,
        message: 'Memo updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /memos/:id
 * Delete a memo
 */
router.delete('/:id',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createApiError('User not authenticated', 401, ErrorCode.AUTHENTICATION_ERROR);
      }

      // Validate memo ID format
      const parseResult = memoIdSchema.safeParse(req.params.id);
      if (!parseResult.success) {
        throw createApiError('Invalid memo ID format', 400, ErrorCode.VALIDATION_ERROR);
      }

      await MemoService.deleteMemo(req.user.id, req.params.id);

      res.json({
        success: true,
        message: 'Memo deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;