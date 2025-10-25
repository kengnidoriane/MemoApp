import { api } from '../lib/api';
import type { 
  QuizSession, 
  QuizQuestion, 
  QuizAnswer, 
  QuizResults,
  QuizOptions 
} from '@memo-app/shared/types';

export const quizService = {
  // Quiz session management
  startQuizSession: async (options?: QuizOptions): Promise<QuizSession> => {
    const response = await api.post<{ data: QuizSession }>('/quiz/start', options);
    return response.data?.data || { id: '', userId: '', startedAt: new Date(), questions: [], currentQuestionIndex: 0, status: 'active', totalQuestions: 0, correctAnswers: 0 };
  },

  getQuizSession: async (sessionId: string): Promise<QuizSession> => {
    const response = await api.get<{ data: QuizSession }>(`/quiz/sessions/${sessionId}`);
    return response.data?.data || { id: '', userId: '', startedAt: new Date(), questions: [], currentQuestionIndex: 0, status: 'active', totalQuestions: 0, correctAnswers: 0 };
  },

  getNextQuestion: async (sessionId: string): Promise<QuizQuestion | null> => {
    const response = await api.get<{ data: QuizQuestion | null }>(`/quiz/sessions/${sessionId}/next`);
    return response.data?.data || null;
  },

  submitAnswer: async (sessionId: string, questionId: string, answer: QuizAnswer): Promise<void> => {
    await api.post(`/quiz/sessions/${sessionId}/answer`, {
      ...answer,
      questionId,
    });
  },

  endQuizSession: async (sessionId: string): Promise<QuizResults> => {
    const response = await api.post<{ data: QuizResults }>(`/quiz/sessions/${sessionId}/end`);
    return response.data?.data || { 
      sessionId: '', 
      totalQuestions: 0, 
      correctAnswers: 0, 
      incorrectAnswers: 0, 
      accuracy: 0, 
      averageResponseTime: 0, 
      completedAt: new Date(), 
      memosToReview: [], 
      performanceByDifficulty: {} 
    };
  },

  // Quiz history and statistics
  getQuizHistory: async (limit?: number): Promise<QuizResults[]> => {
    const response = await api.get<{ data: QuizResults[] }>('/quiz/history', { limit });
    return response.data?.data || [];
  },

  getQuizStats: async (): Promise<{
    totalSessions: number;
    averageScore: number;
    totalQuestions: number;
    correctAnswers: number;
  }> => {
    const response = await api.get<{ data: {
      totalSessions: number;
      averageScore: number;
      totalQuestions: number;
      correctAnswers: number;
    } }>('/quiz/stats');
    return response.data?.data || {
      totalSessions: 0,
      averageScore: 0,
      totalQuestions: 0,
      correctAnswers: 0
    };
  },
};