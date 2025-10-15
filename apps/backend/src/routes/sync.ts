import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { SyncService } from '../services/syncService';
import { 
  SyncRequest, 
  BatchUpdateRequest, 
  ConflictResolution 
} from '@memo-app/shared';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const syncRequestSchema = z.object({
  lastSyncTimestamp: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  offlineChanges: z.array(z.object({
    id: z.string(),
    type: z.enum(['create', 'update', 'delete']),
    entity: z.enum(['memo', 'category']),
    data: z.any(),
    timestamp: z.string().datetime().transform(val => new Date(val)),
    clientId: z.string().optional()
  })).optional()
});

const batchUpdateSchema = z.object({
  changes: z.array(z.object({
    id: z.string(),
    type: z.enum(['create', 'update', 'delete']),
    entity: z.enum(['memo', 'category']),
    data: z.any(),
    timestamp: z.string().datetime().transform(val => new Date(val)),
    clientId: z.string().optional()
  }))
});

const conflictResolutionSchema = z.object({
  resolutions: z.array(z.object({
    conflictId: z.string(),
    resolution: z.enum(['local', 'server', 'merge']),
    mergedData: z.any().optional()
  }))
});

/**
 * GET /sync - Get incremental sync data
 * Query params:
 * - lastSyncTimestamp: ISO datetime string (optional)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const lastSyncTimestamp = req.query.lastSyncTimestamp 
      ? new Date(req.query.lastSyncTimestamp as string)
      : undefined;

    const syncResult = await SyncService.getIncrementalSync(userId, lastSyncTimestamp);

    res.json({
      success: true,
      data: syncResult,
      message: 'Sync data retrieved successfully',
      timestamp: new Date(),
      requestId: req.id
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SYNC_ERROR',
        message: 'Failed to retrieve sync data',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date(),
        requestId: req.id
      }
    });
  }
});

/**
 * POST /sync - Full sync with offline changes
 * Body: SyncRequest with optional offline changes
 */
router.post('/', 
  authenticateToken, 
  validateRequest(syncRequestSchema),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { lastSyncTimestamp, offlineChanges } = req.body as SyncRequest;

      // Get incremental sync data
      const syncResult = await SyncService.getIncrementalSync(userId, lastSyncTimestamp);

      // Process offline changes if provided
      if (offlineChanges && offlineChanges.length > 0) {
        const batchResult = await SyncService.processBatchUpdates(userId, offlineChanges);
        
        // Add batch results to sync result
        syncResult.conflicts.push(...batchResult.conflicts);
        
        // If there were processing errors, include them in the response
        if (batchResult.errors.length > 0) {
          return res.status(207).json({ // 207 Multi-Status
            success: true,
            data: {
              ...syncResult,
              batchResult
            },
            message: `Sync completed with ${batchResult.errors.length} errors`,
            timestamp: new Date(),
            requestId: req.id
          });
        }
      }

      return res.json({
        success: true,
        data: syncResult,
        message: 'Sync completed successfully',
        timestamp: new Date(),
        requestId: req.id
      });
    } catch (error) {
      console.error('Sync error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SYNC_ERROR',
          message: 'Failed to complete sync',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          timestamp: new Date(),
          requestId: req.id
        }
      });
    }
  }
);

/**
 * POST /sync/batch - Process batch updates from offline changes
 * Body: BatchUpdateRequest with array of changes
 */
router.post('/batch',
  authenticateToken,
  validateRequest(batchUpdateSchema),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { changes } = req.body as BatchUpdateRequest;

      const result = await SyncService.processBatchUpdates(userId, changes);

      const statusCode = result.conflicts.length > 0 || result.errors.length > 0 ? 207 : 200;

      res.status(statusCode).json({
        success: true,
        data: result,
        message: `Processed ${result.processed} changes successfully`,
        timestamp: new Date(),
        requestId: req.id
      });
    } catch (error) {
      console.error('Batch update error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BATCH_UPDATE_ERROR',
          message: 'Failed to process batch updates',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          timestamp: new Date(),
          requestId: req.id
        }
      });
    }
  }
);

/**
 * POST /sync/resolve-conflicts - Resolve sync conflicts
 * Body: Array of conflict resolutions
 */
router.post('/resolve-conflicts',
  authenticateToken,
  validateRequest(conflictResolutionSchema),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { resolutions } = req.body;

      await SyncService.resolveConflicts(userId, resolutions);

      return res.json({
        success: true,
        data: { resolved: resolutions.length },
        message: 'Conflicts resolved successfully',
        timestamp: new Date(),
        requestId: req.id
      });
    } catch (error) {
      console.error('Conflict resolution error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'CONFLICT_RESOLUTION_ERROR',
          message: 'Failed to resolve conflicts',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          timestamp: new Date(),
          requestId: req.id
        }
      });
    }
  }
);

/**
 * POST /sync/auto-resolve - Automatically resolve non-conflicting changes
 */
router.post('/auto-resolve', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const result = await SyncService.autoResolveConflicts(userId);

    return res.json({
      success: true,
      data: result,
      message: 'Auto-resolution completed',
      timestamp: new Date(),
      requestId: req.id
    });
  } catch (error) {
    console.error('Auto-resolve error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTO_RESOLVE_ERROR',
        message: 'Failed to auto-resolve conflicts',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date(),
        requestId: req.id
      }
    });
  }
});

/**
 * GET /sync/stats - Get sync statistics for the user
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const stats = await SyncService.getSyncStats(userId);

    return res.json({
      success: true,
      data: stats,
      message: 'Sync statistics retrieved successfully',
      timestamp: new Date(),
      requestId: req.id
    });
  } catch (error) {
    console.error('Sync stats error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SYNC_STATS_ERROR',
        message: 'Failed to retrieve sync statistics',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date(),
        requestId: req.id
      }
    });
  }
});

/**
 * GET /sync/status - Get current sync status for user entities
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const status = await SyncService.getSyncStatus(userId);

    return res.json({
      success: true,
      data: status,
      message: 'Sync status retrieved successfully',
      timestamp: new Date(),
      requestId: req.id
    });
  } catch (error) {
    console.error('Sync status error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SYNC_STATUS_ERROR',
        message: 'Failed to retrieve sync status',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date(),
        requestId: req.id
      }
    });
  }
});

export default router;