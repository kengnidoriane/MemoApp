export interface QuizSession {
  id: string;
  userId: string;
  startedAt: Date;
  completedAt?: Date;
  totalQuestions: number;
  correctAnswers: number;
  status: 'active' | 'completed';
  questions: QuizQuestion[];
  currentQuestionIndex: number;
}

export interface QuizQuestion {
  id: string;
  memoId: string;
  type: 'recall' | 'recognition';
  question: string;
  correctAnswer?: string;
  options?: string[];
  answered?: boolean;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface QuizAnswer {
  questionId: string;
  answer: string;
  responseTimeMs: number;
  confidence: 1 | 2 | 3 | 4 | 5;
}

export interface QuizOptions {
  maxQuestions?: number;
  includeCategories?: string[];
  excludeCategories?: string[];
  includeTags?: string[];
  excludeTags?: string[];
  questionTypes?: ('recall' | 'recognition')[];
  difficultyRange?: {
    min: number;
    max: number;
  };
}

export interface QuizResults {
  sessionId: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  averageResponseTime: number;
  completedAt: Date;
  memosToReview: string[];
  performanceByDifficulty: Record<number, {
    total: number;
    correct: number;
    accuracy: number;
  }>;
}

export interface ReviewPerformance {
  remembered: boolean;
  responseTime: number;
  confidence: 1 | 2 | 3 | 4 | 5;
}