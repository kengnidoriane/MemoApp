import { create } from 'zustand';
import type { QuizSession, QuizQuestion, QuizResults } from '@memo-app/shared/types';

interface QuizState {
  currentSession: QuizSession | null;
  currentQuestion: QuizQuestion | null;
  currentQuestionIndex: number;
  isLoading: boolean;
  error: string | null;
  results: QuizResults | null;
  sessionHistory: QuizResults[];
}

interface QuizActions {
  setCurrentSession: (session: QuizSession | null) => void;
  setCurrentQuestion: (question: QuizQuestion | null) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setResults: (results: QuizResults | null) => void;
  addToHistory: (results: QuizResults) => void;
  clearSession: () => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
}

type QuizStore = QuizState & QuizActions;

const initialState: QuizState = {
  currentSession: null,
  currentQuestion: null,
  currentQuestionIndex: 0,
  isLoading: false,
  error: null,
  results: null,
  sessionHistory: [],
};

export const useQuizStore = create<QuizStore>((set, get) => ({
  ...initialState,
  
  setCurrentSession: (session) => {
    set({ 
      currentSession: session,
      currentQuestionIndex: 0,
      currentQuestion: null,
      results: null,
      error: null,
    });
  },
  
  setCurrentQuestion: (question) => {
    set({ currentQuestion: question });
  },
  
  setCurrentQuestionIndex: (index) => {
    set({ currentQuestionIndex: index });
  },
  
  setLoading: (loading) => {
    set({ isLoading: loading });
  },
  
  setError: (error) => {
    set({ error });
  },
  
  setResults: (results) => {
    set({ results });
  },
  
  addToHistory: (results) => {
    const { sessionHistory } = get();
    set({ 
      sessionHistory: [results, ...sessionHistory].slice(0, 50) // Keep last 50 sessions
    });
  },
  
  clearSession: () => {
    set({
      currentSession: null,
      currentQuestion: null,
      currentQuestionIndex: 0,
      results: null,
      error: null,
    });
  },
  
  nextQuestion: () => {
    const { currentSession, currentQuestionIndex } = get();
    if (currentSession && currentQuestionIndex < currentSession.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      set({ 
        currentQuestionIndex: nextIndex,
        currentQuestion: currentSession.questions[nextIndex],
      });
    }
  },
  
  previousQuestion: () => {
    const { currentSession, currentQuestionIndex } = get();
    if (currentSession && currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      set({ 
        currentQuestionIndex: prevIndex,
        currentQuestion: currentSession.questions[prevIndex],
      });
    }
  },
}));