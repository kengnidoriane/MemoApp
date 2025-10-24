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
    const response = await api.post<QuizSession>('/quiz/start', options);
    return response.data;
  },

  getQuizSession: async (sessionId: string): Promise<QuizSession> => {
    const response = await api.get<QuizSession>(`/quiz/sessions/${sessionId}`);
    return response.data;
  },

  getNextQuestion: async (sessionId: string): Promise<QuizQuestion | null> => {
    const response = await api.get<QuizQuestion | null>(`/quiz/sessions/${sessionId}/next`);
    return response.data;
  },

  submitAnswer: async (sessionId: string, questionId: string, answer: QuizAnswer): Promise<void> => {
    await api.post(`/quiz/sessions/${sessionId}/answer`, {
      questionId,
      ...answer,
    });
  },

  endQuizSession: async (sessionId: string): Promise<QuizResults> => {
    const response = await api.post<QuizResults>(`/quiz/sessions/${sessionId}/end`);
    return response.data;
  },

  // Quiz history and statistics
  getQuizHistory: async (limit?: number): Promise<QuizResults[]> => {
    const response = await api.get<QuizResults[]>('/quiz/history', { limit });
    return response.data;
  },

  getQuizStats: async (): Promise<{
    totalSessions: number;
    averageScore: number;
    totalQuestions: number;
    correctAnswers: number;
  }> => {
    const response = await api.get<{
      totalSessions: number;
      averageScore: number;
      totalQuestions: number;
      correctAnswers: number;
    }>('/quiz/stats');
    return response.data;
  },
};