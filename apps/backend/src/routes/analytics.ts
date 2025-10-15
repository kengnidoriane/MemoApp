import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AnalyticsService } from '../services/analyticsService';
import { ErrorCode } from '@memo-app/shared';

const router = Router();

/**
 * GET /analytics/dashboard
 * Get comprehensive analytics dashboard for the authenticated user
 */
router.get('/dashboard', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    
    const dashboard = await AnalyticsService.getDashboard(userId);
    
    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Error fetching analytics dashboard:', error);
    next({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Failed to fetch analytics dashboard',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
    });
  }
});

/**
 * GET /analytics/user-stats
 * Get basic user statistics
 */
router.get('/user-stats', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    
    const userAnalytics = await AnalyticsService.getUserAnalytics(userId);
    
    res.json({
      success: true,
      data: userAnalytics,
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    next({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Failed to fetch user analytics',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
    });
  }
});

/**
 * GET /analytics/activity-trends
 * Get activity trends over time
 */
router.get('/activity-trends', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 30;
    
    // Validate days parameter
    if (days < 1 || days > 365) {
      return next({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Days parameter must be between 1 and 365',
      });
    }
    
    const activityTrends = await AnalyticsService.getActivityTrends(userId, days);
    
    res.json({
      success: true,
      data: activityTrends,
    });
  } catch (error) {
    console.error('Error fetching activity trends:', error);
    next({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Failed to fetch activity trends',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
    });
  }
});

/**
 * GET /analytics/learning-metrics
 * Get learning progress and retention metrics
 */
router.get('/learning-metrics', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    
    const learningMetrics = await AnalyticsService.getLearningMetrics(userId);
    
    res.json({
      success: true,
      data: learningMetrics,
    });
  } catch (error) {
    console.error('Error fetching learning metrics:', error);
    next({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Failed to fetch learning metrics',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
    });
  }
});

export default router;