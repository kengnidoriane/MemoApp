import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { quizService } from '../services/quizService';
import type { 
  QuizAnswer
} from '@memo-app/shared/types';

// Query keys
export const quizKeys = {
  all: ['quiz'] as const,
  sessions: () => [...quizKeys.all, 'sessions'] as const,
  session: (id: string) => [...quizKeys.sessions(), id] as const,
  question: (sessionId: string) => [...quizKeys.session(sessionId), 'question'] as const,
  history: () => [...quizKeys.all, 'history'] as const,
  stats: () => [...quizKeys.all, 'stats'] as const,
};

// Quiz session hooks
export const useStartQuizSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: quizService.startQuizSession,
    onSuccess: (session) => {
      // Cache the new session
      queryClient.setQueryData(quizKeys.session(session.id), session);
    },
  });
};

export const useQuizSession = (sessionId: string) => {
  return useQuery({
    queryKey: quizKeys.session(sessionId),
    queryFn: () => quizService.getQuizSession(sessionId),
    enabled: !!sessionId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useNextQuestion = (sessionId: string) => {
  return useQuery({
    queryKey: quizKeys.question(sessionId),
    queryFn: () => quizService.getNextQuestion(sessionId),
    enabled: !!sessionId,
    staleTime: 0, // Always fresh
    refetchOnMount: true,
  });
};

export const useSubmitAnswer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, questionId, answer }: {
      sessionId: string;
      questionId: string;
      answer: QuizAnswer;
    }) => quizService.submitAnswer(sessionId, questionId, answer),
    onSuccess: (_, { sessionId }) => {
      // Invalidate the current question to get the next one
      queryClient.invalidateQueries({ queryKey: quizKeys.question(sessionId) });
      
      // Invalidate the session to update progress
      queryClient.invalidateQueries({ queryKey: quizKeys.session(sessionId) });
    },
  });
};

export const useEndQuizSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: quizService.endQuizSession,
    onSuccess: (_, sessionId) => {
      // Remove session from cache
      queryClient.removeQueries({ queryKey: quizKeys.session(sessionId) });
      
      // Invalidate history and stats
      queryClient.invalidateQueries({ queryKey: quizKeys.history() });
      queryClient.invalidateQueries({ queryKey: quizKeys.stats() });
      
      // Invalidate memo review data as quiz affects spaced repetition
      queryClient.invalidateQueries({ queryKey: ['memos', 'review'] });
      queryClient.invalidateQueries({ queryKey: ['memos', 'list'] });
    },
  });
};

// Quiz history and statistics
export const useQuizHistory = (limit?: number) => {
  return useQuery({
    queryKey: [...quizKeys.history(), limit],
    queryFn: () => quizService.getQuizHistory(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useQuizStats = () => {
  return useQuery({
    queryKey: quizKeys.stats(),
    queryFn: quizService.getQuizStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};