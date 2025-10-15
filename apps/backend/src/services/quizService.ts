import { 
  QuizSession, 
  QuizQuestion, 
  QuizOptions, 
  QuizAnswer, 
  QuizResults,
  ReviewPerformance,
  ErrorCode,
  QUIZ_CONFIG
} from '@memo-app/shared';
import { createApiError } from '../middleware/errorHandler';
import { prisma } from '../lib/database';
import { SpacedRepetitionService } from './spacedRepetitionService';

export class QuizService {
  /**
   * Start a new quiz session
   */
  static async startQuizSession(userId: string, options: QuizOptions): Promise<QuizSession> {
    try {
      // Check if user has enough memos for a quiz
      const memoCount = await prisma.memo.count({
        where: { userId }
      });

      if (memoCount < QUIZ_CONFIG.MIN_MEMOS_FOR_QUIZ) {
        throw createApiError(
          `You need at least ${QUIZ_CONFIG.MIN_MEMOS_FOR_QUIZ} memos to start a quiz`,
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      // Check daily quiz limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayQuizCount = await prisma.quizSession.count({
        where: {
          userId,
          startedAt: {
            gte: today,
            lt: tomorrow
          }
        }
      });

      if (todayQuizCount >= QUIZ_CONFIG.MAX_QUIZ_SESSIONS_PER_DAY) {
        throw createApiError(
          `You've reached the daily limit of ${QUIZ_CONFIG.MAX_QUIZ_SESSIONS_PER_DAY} quiz sessions`,
          429,
          ErrorCode.RATE_LIMIT_EXCEEDED
        );
      }

      // Generate quiz questions
      const questions = await this.generateQuizQuestions(userId, options);

      if (questions.length === 0) {
        throw createApiError(
          'No memos found matching your quiz criteria',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      // Create quiz session
      const session = await prisma.quizSession.create({
        data: {
          userId,
          totalQuestions: questions.length,
          status: 'active'
        }
      });

      return {
        id: session.id,
        userId: session.userId,
        startedAt: session.startedAt,
        completedAt: session.completedAt || undefined,
        totalQuestions: session.totalQuestions,
        correctAnswers: session.correctAnswers,
        status: session.status as 'active' | 'completed',
        questions,
        currentQuestionIndex: 0
      };
    } catch (error) {
      throw error;
    }
  }  /**
   
* Generate quiz questions from user memos
   */
  private static async generateQuizQuestions(
    userId: string, 
    options: QuizOptions
  ): Promise<QuizQuestion[]> {
    const {
      maxQuestions = QUIZ_CONFIG.DEFAULT_QUESTIONS_PER_SESSION,
      includeCategories,
      excludeCategories,
      includeTags,
      excludeTags,
      questionTypes = ['recall', 'recognition'],
      difficultyRange
    } = options;

    // Build where clause for memo selection
    const where: any = {
      userId
    };

    // Category filters
    if (includeCategories && includeCategories.length > 0) {
      where.categoryId = { in: includeCategories };
    }
    if (excludeCategories && excludeCategories.length > 0) {
      where.categoryId = { notIn: excludeCategories };
    }

    // Tag filters
    if (includeTags && includeTags.length > 0) {
      where.tags = { hasEvery: includeTags };
    }
    if (excludeTags && excludeTags.length > 0) {
      where.NOT = { tags: { hasSome: excludeTags } };
    }

    // Difficulty range filter
    if (difficultyRange) {
      where.difficultyLevel = {
        gte: difficultyRange.min,
        lte: difficultyRange.max
      };
    }

    // Get eligible memos
    const memos = await prisma.memo.findMany({
      where,
      orderBy: { lastReviewedAt: 'asc' }, // Prioritize least recently reviewed
      take: maxQuestions * 2 // Get more than needed for randomization
    });

    if (memos.length === 0) {
      return [];
    }

    // Shuffle and select memos
    const shuffledMemos = this.shuffleArray(memos).slice(0, maxQuestions);

    // Generate questions
    const questions: QuizQuestion[] = shuffledMemos.map((memo, index) => {
      const questionType = this.selectRandomQuestionType(questionTypes);
      
      return {
        id: `q_${memo.id}_${Date.now()}_${index}`,
        memoId: memo.id,
        type: questionType,
        question: this.generateQuestionText(memo, questionType),
        correctAnswer: questionType === 'recall' ? memo.content : undefined,
        options: questionType === 'recognition' ? this.generateMultipleChoiceOptions(memo, memos) : undefined
      };
    });

    return questions;
  }

  /**
   * Generate question text based on memo and question type
   */
  private static generateQuestionText(memo: any, questionType: 'recall' | 'recognition'): string {
    if (questionType === 'recall') {
      return `What do you remember about: "${memo.title}"?`;
    } else {
      return `Which of the following best describes "${memo.title}"?`;
    }
  }

  /**
   * Generate multiple choice options for recognition questions
   */
  private static generateMultipleChoiceOptions(targetMemo: any, allMemos: any[]): string[] {
    const options = [targetMemo.content];
    
    // Get other memos for distractors
    const otherMemos = allMemos.filter(m => m.id !== targetMemo.id);
    const shuffledOthers = this.shuffleArray(otherMemos);
    
    // Add 3 distractors
    for (let i = 0; i < Math.min(3, shuffledOthers.length); i++) {
      options.push(shuffledOthers[i].content);
    }
    
    // If we don't have enough distractors, add generic ones
    while (options.length < 4) {
      options.push(`Alternative answer ${options.length}`);
    }
    
    return this.shuffleArray(options);
  }

  /**
   * Select random question type from allowed types
   */
  private static selectRandomQuestionType(allowedTypes: ('recall' | 'recognition')[]): 'recall' | 'recognition' {
    return allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }  /**

   * Get quiz session by ID
   */
  static async getQuizSession(userId: string, sessionId: string): Promise<QuizSession> {
    const session = await prisma.quizSession.findFirst({
      where: {
        id: sessionId,
        userId
      },
      include: {
        quizAnswers: {
          include: {
            memo: true
          }
        }
      }
    });

    if (!session) {
      throw createApiError(
        'Quiz session not found',
        404,
        ErrorCode.NOT_FOUND
      );
    }

    // Reconstruct questions from answers and remaining memos
    const questions = await this.reconstructQuestions(session);

    return {
      id: session.id,
      userId: session.userId,
      startedAt: session.startedAt,
      completedAt: session.completedAt || undefined,
      totalQuestions: session.totalQuestions,
      correctAnswers: session.correctAnswers,
      status: session.status as 'active' | 'completed',
      questions,
      currentQuestionIndex: session.quizAnswers.length
    };
  }

  /**
   * Reconstruct questions for an existing session
   */
  private static async reconstructQuestions(session: any): Promise<QuizQuestion[]> {
    // For simplicity, we'll generate new questions based on the session's memos
    // In a production app, you might want to store questions in the database
    const answeredMemoIds = session.quizAnswers.map((answer: any) => answer.memoId);
    
    // Get all memos that could be part of this quiz
    const memos = await prisma.memo.findMany({
      where: {
        userId: session.userId
      },
      take: session.totalQuestions
    });

    const questions: QuizQuestion[] = memos.slice(0, session.totalQuestions).map((memo, index) => {
      const isAnswered = answeredMemoIds.includes(memo.id);
      const answer = session.quizAnswers.find((a: any) => a.memoId === memo.id);
      
      return {
        id: `q_${memo.id}_${session.id}_${index}`,
        memoId: memo.id,
        type: 'recall', // Default to recall for reconstructed questions
        question: `What do you remember about: "${memo.title}"?`,
        correctAnswer: memo.content,
        answered: isAnswered,
        userAnswer: answer?.remembered ? 'remembered' : 'forgot',
        isCorrect: answer?.remembered
      };
    });

    return questions;
  }  /**

   * Submit answer to a quiz question
   */
  static async submitQuizAnswer(
    userId: string, 
    sessionId: string, 
    answer: QuizAnswer
  ): Promise<void> {
    // Verify session exists and belongs to user
    const session = await prisma.quizSession.findFirst({
      where: {
        id: sessionId,
        userId,
        status: 'active'
      }
    });

    if (!session) {
      throw createApiError(
        'Active quiz session not found',
        404,
        ErrorCode.NOT_FOUND
      );
    }

    // Check if question was already answered
    const existingAnswer = await prisma.quizAnswer.findFirst({
      where: {
        sessionId,
        memoId: answer.questionId // Using questionId as memoId for now
      }
    });

    if (existingAnswer) {
      throw createApiError(
        'Question already answered',
        400,
        ErrorCode.VALIDATION_ERROR
      );
    }

    // Get the memo to determine if answer is correct
    const memo = await prisma.memo.findFirst({
      where: {
        id: answer.questionId,
        userId
      }
    });

    if (!memo) {
      throw createApiError(
        'Memo not found',
        404,
        ErrorCode.NOT_FOUND
      );
    }

    // For recall questions, we'll use a simple "remembered" boolean
    // For recognition questions, we'd compare the answer with correct option
    const remembered = answer.answer.toLowerCase().includes('remember') || 
                      answer.answer.toLowerCase().includes('yes') ||
                      answer.confidence >= 4;

    // Record the answer
    await prisma.quizAnswer.create({
      data: {
        sessionId,
        memoId: memo.id,
        remembered,
        responseTimeMs: answer.responseTimeMs,
        confidence: answer.confidence
      }
    });

    // Update session statistics
    if (remembered) {
      await prisma.quizSession.update({
        where: { id: sessionId },
        data: {
          correctAnswers: {
            increment: 1
          }
        }
      });
    }
  }  /**
   * 
Complete a quiz session and get results
   */
  static async completeQuizSession(userId: string, sessionId: string): Promise<QuizResults> {
    const session = await prisma.quizSession.findFirst({
      where: {
        id: sessionId,
        userId
      },
      include: {
        quizAnswers: {
          include: {
            memo: true
          }
        }
      }
    });

    if (!session) {
      throw createApiError(
        'Quiz session not found',
        404,
        ErrorCode.NOT_FOUND
      );
    }

    if (session.status === 'completed') {
      throw createApiError(
        'Quiz session already completed',
        400,
        ErrorCode.VALIDATION_ERROR
      );
    }

    // Mark session as completed
    const completedSession = await prisma.quizSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        completedAt: new Date()
      },
      include: {
        quizAnswers: {
          include: {
            memo: true
          }
        }
      }
    });

    // Calculate results
    const totalQuestions = completedSession.totalQuestions;
    const correctAnswers = completedSession.correctAnswers;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const accuracy = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;

    // Calculate average response time
    const responseTimes = completedSession.quizAnswers
      .filter(answer => answer.responseTimeMs)
      .map(answer => answer.responseTimeMs!);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    // Get memos that need review (incorrect answers)
    const memosToReview = completedSession.quizAnswers
      .filter(answer => !answer.remembered)
      .map(answer => answer.memoId);

    // Calculate performance by difficulty
    const performanceByDifficulty: Record<number, { total: number; correct: number; accuracy: number }> = {};
    
    for (const answer of completedSession.quizAnswers) {
      const difficulty = answer.memo.difficultyLevel;
      if (!performanceByDifficulty[difficulty]) {
        performanceByDifficulty[difficulty] = { total: 0, correct: 0, accuracy: 0 };
      }
      performanceByDifficulty[difficulty].total++;
      if (answer.remembered) {
        performanceByDifficulty[difficulty].correct++;
      }
    }

    // Calculate accuracy for each difficulty level
    Object.keys(performanceByDifficulty).forEach(difficulty => {
      const stats = performanceByDifficulty[parseInt(difficulty)];
      stats.accuracy = stats.total > 0 ? stats.correct / stats.total : 0;
    });

    return {
      sessionId: completedSession.id,
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      accuracy,
      averageResponseTime,
      completedAt: completedSession.completedAt!,
      memosToReview,
      performanceByDifficulty
    };
  }

  /**
   * Update spaced repetition based on quiz performance
   */
  static async updateSpacedRepetitionFromQuiz(
    userId: string, 
    sessionId: string
  ): Promise<void> {
    const session = await prisma.quizSession.findFirst({
      where: {
        id: sessionId,
        userId,
        status: 'completed'
      },
      include: {
        quizAnswers: true
      }
    });

    if (!session) {
      throw createApiError(
        'Completed quiz session not found',
        404,
        ErrorCode.NOT_FOUND
      );
    }

    // Create spaced repetition service instance
    const srService = new SpacedRepetitionService(prisma);

    // Update spaced repetition for each answered memo
    for (const answer of session.quizAnswers) {
      const performance: ReviewPerformance = {
        remembered: answer.remembered,
        responseTime: answer.responseTimeMs || 30000,
        confidence: (answer.confidence || 3) as 1 | 2 | 3 | 4 | 5
      };

      await srService.recordReview(answer.memoId, performance, userId);
    }
  }
}