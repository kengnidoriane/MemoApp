import { Router } from 'express';
import { QuizService } from '../services/quizService';
import { authenticateToken } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validation';
import { 
  quizOptionsSchema, 
  quizAnswerSchema, 
  quizSessionIdSchema 
} from '@memo-app/shared';
import { createApiError } from '../middleware/errorHandler';
import { ErrorCode } from '@memo-app/shared';
import { z } from 'zod';

const router = Router();

// Apply authentication to all quiz routes
router.use(authenticateToken);

/**
 * POST /quiz/start
 * Start a new quiz session
 */
router.post('/start', validateBody(quizOptionsSchema), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const options = req.body;

    const session = await QuizService.startQuizSession(userId, options);
    
    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /quiz/:sessionId
 * Get quiz session details
 */
router.get('/:sessionId', validateParams(z.object({ sessionId: quizSessionIdSchema })), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { sessionId } = req.params;

    const session = await QuizService.getQuizSession(userId, sessionId);
    
    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /quiz/:sessionId/answer
 * Submit an answer to a quiz question
 */
router.post('/:sessionId/answer', 
  validateParams(z.object({ sessionId: quizSessionIdSchema })),
  validateBody(quizAnswerSchema), 
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const { sessionId } = req.params;
      const answer = req.body;

      await QuizService.submitQuizAnswer(userId, sessionId, answer);
      
      res.json({
        success: true,
        message: 'Answer submitted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /quiz/:sessionId/complete
 * Complete a quiz session and get results
 */
router.post('/:sessionId/complete', 
  validateParams(z.object({ sessionId: quizSessionIdSchema })), 
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const { sessionId } = req.params;

      const results = await QuizService.completeQuizSession(userId, sessionId);
      
      // Update spaced repetition based on quiz performance
      await QuizService.updateSpacedRepetitionFromQuiz(userId, sessionId);
      
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /quiz/:sessionId/results
 * Get quiz session results (for completed sessions)
 */
router.get('/:sessionId/results', 
  validateParams(z.object({ sessionId: quizSessionIdSchema })), 
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const { sessionId } = req.params;

      // Get the completed session
      const session = await QuizService.getQuizSession(userId, sessionId);
      
      if (session.status !== 'completed') {
        throw createApiError(
          'Quiz session is not completed yet',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      // Generate results from completed session
      const results = await QuizService.completeQuizSession(userId, sessionId);
      
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;