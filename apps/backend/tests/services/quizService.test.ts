import { QuizService } from '../../src/services/quizService';
import { PrismaClient } from '@prisma/client';
import { QuizOptions, QuizAnswer, QUIZ_CONFIG, ErrorCode } from '@memo-app/shared';
import { createApiError } from '../../src/middleware/errorHandler';

// Mock dependencies
jest.mock('../../src/lib/database', () => ({
  prisma: {
    memo: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    quizSession: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    quizAnswer: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('../../src/services/spacedRepetitionService');

const mockPrisma = require('../../src/lib/database').prisma;

describe('QuizService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('startQuizSession', () => {
    const userId = 'user-1';
    const mockMemos = [
      { id: 'memo-1', title: 'Test Memo 1', content: 'Content 1', difficultyLevel: 3 },
      { id: 'memo-2', title: 'Test Memo 2', content: 'Content 2', difficultyLevel: 2 },
      { id: 'memo-3', title: 'Test Memo 3', content: 'Content 3', difficultyLevel: 4 },
    ];

    beforeEach(() => {
      mockPrisma.memo.count.mockResolvedValue(10);
      mockPrisma.quizSession.count.mockResolvedValue(0);
      mockPrisma.memo.findMany.mockResolvedValue(mockMemos);
      mockPrisma.quizSession.create.mockResolvedValue({
        id: 'session-1',
        userId,
        startedAt: new Date(),
        completedAt: null,
        totalQuestions: 3,
        correctAnswers: 0,
        status: 'active',
      });
    });

    it('should create a quiz session with generated questions', async () => {
      const options: QuizOptions = { maxQuestions: 3 };
      
      const session = await QuizService.startQuizSession(userId, options);

      expect(session).toMatchObject({
        id: 'session-1',
        userId,
        totalQuestions: 3,
        correctAnswers: 0,
        status: 'active',
        currentQuestionIndex: 0,
      });
      expect(session.questions).toHaveLength(3);
      expect(session.questions[0]).toMatchObject({
        id: expect.any(String),
        memoId: expect.any(String),
        type: expect.any(String),
        question: expect.any(String),
      });
    });

    it('should throw error if user has insufficient memos', async () => {
      mockPrisma.memo.count.mockResolvedValue(2);

      await expect(
        QuizService.startQuizSession(userId, {})
      ).rejects.toMatchObject({
        statusCode: 400,
        code: ErrorCode.VALIDATION_ERROR,
      });
    });

    it('should throw error if daily quiz limit exceeded', async () => {
      mockPrisma.quizSession.count.mockResolvedValue(QUIZ_CONFIG.MAX_QUIZ_SESSIONS_PER_DAY);

      await expect(
        QuizService.startQuizSession(userId, {})
      ).rejects.toMatchObject({
        statusCode: 429,
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
      });
    });

    it('should filter memos by categories', async () => {
      const options: QuizOptions = {
        includeCategories: ['cat-1', 'cat-2'],
        maxQuestions: 3,
      };

      await QuizService.startQuizSession(userId, options);

      expect(mockPrisma.memo.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          categoryId: { in: ['cat-1', 'cat-2'] },
        }),
        orderBy: { lastReviewedAt: 'asc' },
        take: 6, // maxQuestions * 2
      });
    });

    it('should filter memos by difficulty range', async () => {
      const options: QuizOptions = {
        difficultyRange: { min: 2, max: 4 },
        maxQuestions: 3,
      };

      await QuizService.startQuizSession(userId, options);

      expect(mockPrisma.memo.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          difficultyLevel: { gte: 2, lte: 4 },
        }),
        orderBy: { lastReviewedAt: 'asc' },
        take: 6,
      });
    });

    it('should generate recall questions correctly', async () => {
      const options: QuizOptions = {
        questionTypes: ['recall'],
        maxQuestions: 1,
      };

      const session = await QuizService.startQuizSession(userId, options);

      expect(session.questions[0]).toMatchObject({
        type: 'recall',
        question: expect.stringContaining('What do you remember about:'),
        correctAnswer: expect.any(String),
        options: undefined,
      });
    });

    it('should generate recognition questions correctly', async () => {
      const options: QuizOptions = {
        questionTypes: ['recognition'],
        maxQuestions: 1,
      };

      const session = await QuizService.startQuizSession(userId, options);

      expect(session.questions[0]).toMatchObject({
        type: 'recognition',
        question: expect.stringContaining('Which of the following best describes'),
        correctAnswer: undefined,
        options: expect.arrayContaining([expect.any(String)]),
      });
    });

    it('should throw error if no memos match criteria', async () => {
      mockPrisma.memo.findMany.mockResolvedValue([]);

      await expect(
        QuizService.startQuizSession(userId, {})
      ).rejects.toMatchObject({
        statusCode: 400,
        code: ErrorCode.VALIDATION_ERROR,
        message: 'No memos found matching your quiz criteria',
      });
    });
  });

  describe('getQuizSession', () => {
    const userId = 'user-1';
    const sessionId = 'session-1';

    it('should return existing quiz session', async () => {
      const mockSession = {
        id: sessionId,
        userId,
        startedAt: new Date(),
        completedAt: null,
        totalQuestions: 3,
        correctAnswers: 1,
        status: 'active',
        quizAnswers: [
          { memoId: 'memo-1', remembered: true, memo: { id: 'memo-1', title: 'Test' } },
        ],
      };

      mockPrisma.quizSession.findFirst.mockResolvedValue(mockSession);
      mockPrisma.memo.findMany.mockResolvedValue([
        { id: 'memo-1', title: 'Test 1', content: 'Content 1' },
        { id: 'memo-2', title: 'Test 2', content: 'Content 2' },
        { id: 'memo-3', title: 'Test 3', content: 'Content 3' },
      ]);

      const session = await QuizService.getQuizSession(userId, sessionId);

      expect(session).toMatchObject({
        id: sessionId,
        userId,
        totalQuestions: 3,
        correctAnswers: 1,
        status: 'active',
        currentQuestionIndex: 1, // One answer recorded
      });
      expect(session.questions).toHaveLength(3);
    });

    it('should throw error if session not found', async () => {
      mockPrisma.quizSession.findFirst.mockResolvedValue(null);

      await expect(
        QuizService.getQuizSession(userId, sessionId)
      ).rejects.toMatchObject({
        statusCode: 404,
        code: ErrorCode.NOT_FOUND,
      });
    });
  });

  describe('submitQuizAnswer', () => {
    const userId = 'user-1';
    const sessionId = 'session-1';
    const answer: QuizAnswer = {
      questionId: 'memo-1',
      answer: 'I remember this',
      confidence: 4,
      responseTimeMs: 5000,
    };

    beforeEach(() => {
      mockPrisma.quizSession.findFirst.mockResolvedValue({
        id: sessionId,
        userId,
        status: 'active',
      });
      mockPrisma.quizAnswer.findFirst.mockResolvedValue(null);
      mockPrisma.memo.findFirst.mockResolvedValue({
        id: 'memo-1',
        userId,
        title: 'Test Memo',
        content: 'Test Content',
      });
      mockPrisma.quizAnswer.create.mockResolvedValue({});
      mockPrisma.quizSession.update.mockResolvedValue({});
    });

    it('should record quiz answer successfully', async () => {
      await QuizService.submitQuizAnswer(userId, sessionId, answer);

      expect(mockPrisma.quizAnswer.create).toHaveBeenCalledWith({
        data: {
          sessionId,
          memoId: 'memo-1',
          remembered: true, // Based on answer content and confidence
          responseTimeMs: 5000,
          confidence: 4,
        },
      });
    });

    it('should update session correct answers count for correct answers', async () => {
      await QuizService.submitQuizAnswer(userId, sessionId, answer);

      expect(mockPrisma.quizSession.update).toHaveBeenCalledWith({
        where: { id: sessionId },
        data: {
          correctAnswers: { increment: 1 },
        },
      });
    });

    it('should not increment correct answers for incorrect answers', async () => {
      const incorrectAnswer: QuizAnswer = {
        ...answer,
        answer: 'I forgot',
        confidence: 1,
      };

      await QuizService.submitQuizAnswer(userId, sessionId, incorrectAnswer);

      expect(mockPrisma.quizAnswer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          remembered: false,
        }),
      });
      expect(mockPrisma.quizSession.update).not.toHaveBeenCalled();
    });

    it('should throw error if session not found', async () => {
      mockPrisma.quizSession.findFirst.mockResolvedValue(null);

      await expect(
        QuizService.submitQuizAnswer(userId, sessionId, answer)
      ).rejects.toMatchObject({
        statusCode: 404,
        code: ErrorCode.NOT_FOUND,
      });
    });

    it('should throw error if question already answered', async () => {
      mockPrisma.quizAnswer.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        QuizService.submitQuizAnswer(userId, sessionId, answer)
      ).rejects.toMatchObject({
        statusCode: 400,
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Question already answered',
      });
    });

    it('should throw error if memo not found', async () => {
      mockPrisma.memo.findFirst.mockResolvedValue(null);

      await expect(
        QuizService.submitQuizAnswer(userId, sessionId, answer)
      ).rejects.toMatchObject({
        statusCode: 404,
        code: ErrorCode.NOT_FOUND,
      });
    });
  });

  describe('completeQuizSession', () => {
    const userId = 'user-1';
    const sessionId = 'session-1';

    beforeEach(() => {
      const mockSession = {
        id: sessionId,
        userId,
        status: 'active',
        totalQuestions: 3,
        correctAnswers: 2,
        quizAnswers: [
          { memoId: 'memo-1', remembered: true, responseTimeMs: 3000, memo: { difficultyLevel: 3 } },
          { memoId: 'memo-2', remembered: true, responseTimeMs: 5000, memo: { difficultyLevel: 2 } },
          { memoId: 'memo-3', remembered: false, responseTimeMs: 8000, memo: { difficultyLevel: 4 } },
        ],
      };

      mockPrisma.quizSession.findFirst.mockResolvedValue(mockSession);
      mockPrisma.quizSession.update.mockResolvedValue({
        ...mockSession,
        status: 'completed',
        completedAt: new Date(),
      });
    });

    it('should complete quiz session and return results', async () => {
      const results = await QuizService.completeQuizSession(userId, sessionId);

      expect(results).toMatchObject({
        sessionId,
        totalQuestions: 3,
        correctAnswers: 2,
        incorrectAnswers: 1,
        accuracy: 2/3,
        averageResponseTime: (3000 + 5000 + 8000) / 3,
        memosToReview: ['memo-3'],
        performanceByDifficulty: {
          2: { total: 1, correct: 1, accuracy: 1 },
          3: { total: 1, correct: 1, accuracy: 1 },
          4: { total: 1, correct: 0, accuracy: 0 },
        },
      });
    });

    it('should mark session as completed', async () => {
      await QuizService.completeQuizSession(userId, sessionId);

      expect(mockPrisma.quizSession.update).toHaveBeenCalledWith({
        where: { id: sessionId },
        data: {
          status: 'completed',
          completedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });

    it('should throw error if session not found', async () => {
      mockPrisma.quizSession.findFirst.mockResolvedValue(null);

      await expect(
        QuizService.completeQuizSession(userId, sessionId)
      ).rejects.toMatchObject({
        statusCode: 404,
        code: ErrorCode.NOT_FOUND,
      });
    });

    it('should throw error if session already completed', async () => {
      mockPrisma.quizSession.findFirst.mockResolvedValue({
        id: sessionId,
        userId,
        status: 'completed',
      });

      await expect(
        QuizService.completeQuizSession(userId, sessionId)
      ).rejects.toMatchObject({
        statusCode: 400,
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Quiz session already completed',
      });
    });

    it('should handle empty quiz answers', async () => {
      mockPrisma.quizSession.findFirst.mockResolvedValue({
        id: sessionId,
        userId,
        status: 'active',
        totalQuestions: 0,
        correctAnswers: 0,
        quizAnswers: [],
      });

      const results = await QuizService.completeQuizSession(userId, sessionId);

      expect(results.accuracy).toBe(0);
      expect(results.averageResponseTime).toBe(0);
      expect(results.memosToReview).toEqual([]);
    });
  });

  describe('updateSpacedRepetitionFromQuiz', () => {
    const userId = 'user-1';
    const sessionId = 'session-1';

    beforeEach(() => {
      const mockSession = {
        id: sessionId,
        userId,
        status: 'completed',
        quizAnswers: [
          { memoId: 'memo-1', remembered: true, responseTimeMs: 3000, confidence: 4 },
          { memoId: 'memo-2', remembered: false, responseTimeMs: 8000, confidence: 2 },
        ],
      };

      mockPrisma.quizSession.findFirst.mockResolvedValue(mockSession);
    });

    it('should update spaced repetition for all answered memos', async () => {
      const { SpacedRepetitionService } = require('../../src/services/spacedRepetitionService');
      const mockSRService = {
        recordReview: jest.fn(),
      };
      SpacedRepetitionService.mockImplementation(() => mockSRService);

      await QuizService.updateSpacedRepetitionFromQuiz(userId, sessionId);

      expect(mockSRService.recordReview).toHaveBeenCalledTimes(2);
      expect(mockSRService.recordReview).toHaveBeenCalledWith(
        'memo-1',
        { remembered: true, responseTime: 3000, confidence: 4 },
        userId
      );
      expect(mockSRService.recordReview).toHaveBeenCalledWith(
        'memo-2',
        { remembered: false, responseTime: 8000, confidence: 2 },
        userId
      );
    });

    it('should throw error if completed session not found', async () => {
      mockPrisma.quizSession.findFirst.mockResolvedValue(null);

      await expect(
        QuizService.updateSpacedRepetitionFromQuiz(userId, sessionId)
      ).rejects.toMatchObject({
        statusCode: 404,
        code: ErrorCode.NOT_FOUND,
      });
    });

    it('should handle missing response time and confidence', async () => {
      const mockSession = {
        id: sessionId,
        userId,
        status: 'completed',
        quizAnswers: [
          { memoId: 'memo-1', remembered: true, responseTimeMs: null, confidence: null },
        ],
      };

      mockPrisma.quizSession.findFirst.mockResolvedValue(mockSession);

      const { SpacedRepetitionService } = require('../../src/services/spacedRepetitionService');
      const mockSRService = {
        recordReview: jest.fn(),
      };
      SpacedRepetitionService.mockImplementation(() => mockSRService);

      await QuizService.updateSpacedRepetitionFromQuiz(userId, sessionId);

      expect(mockSRService.recordReview).toHaveBeenCalledWith(
        'memo-1',
        { remembered: true, responseTime: 30000, confidence: 3 }, // Default values
        userId
      );
    });
  });
});