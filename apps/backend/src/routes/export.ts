import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { ExportService } from '../services/exportService';
import { ErrorCode, ExportFormat } from '@memo-app/shared';
import { validateBody } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

// Validation schemas
const exportRequestSchema = z.object({
  format: z.enum(['pdf', 'txt', 'json']),
  includeCategories: z.boolean().optional().default(false),
  includeTags: z.boolean().optional().default(false),
  includeMetadata: z.boolean().optional().default(false),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }).optional(),
});

/**
 * POST /export/memos
 * Export user memos in specified format
 */
router.post('/memos', 
  authenticateToken, 
  validateBody(exportRequestSchema),
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const exportFormat: ExportFormat = req.body;

      // Validate date range if provided
      if (exportFormat.dateRange) {
        const startDate = new Date(exportFormat.dateRange.start);
        const endDate = new Date(exportFormat.dateRange.end);
        
        if (startDate >= endDate) {
          return next({
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Start date must be before end date',
          });
        }
      }

      const exportResult = await ExportService.exportUserMemos(userId, exportFormat);

      res.json({
        success: true,
        data: exportResult,
      });
    } catch (error) {
      console.error('Error exporting memos:', error);
      
      if (error && typeof error === 'object' && 'code' in error) {
        return next(error);
      }
      
      next({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Failed to export memos',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }
  }
);

/**
 * GET /export/download/:filename
 * Download exported file
 */
router.get('/download/:filename', async (req, res, next) => {
  try {
    const { filename } = req.params;
    
    // Basic filename validation
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return next({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid filename',
      });
    }

    const { filePath, mimeType } = await ExportService.getExportFile(filename);

    // Set appropriate headers
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Stream the file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error downloading export file:', error);
    
    if (error && typeof error === 'object' && 'code' in error) {
      return next(error);
    }
    
    next({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Failed to download export file',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
    });
  }
});

/**
 * DELETE /export/account
 * Delete user account and all data (GDPR compliance)
 */
router.delete('/account', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;

    await ExportService.deleteUserAccount(userId);

    res.json({
      success: true,
      message: 'Account and all associated data have been permanently deleted',
    });
  } catch (error) {
    console.error('Error deleting user account:', error);
    
    if (error && typeof error === 'object' && 'code' in error) {
      return next(error);
    }
    
    next({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Failed to delete user account',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
    });
  }
});

export default router;