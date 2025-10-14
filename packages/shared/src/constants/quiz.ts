/**
 * Quiz-related constants and enums
 */

export enum QuizType {
  RECALL = 'recall',
  RECOGNITION = 'recognition',
  MIXED = 'mixed'
}

export enum QuizDifficulty {
  EASY = 1,
  MEDIUM = 2,
  HARD = 3,
  VERY_HARD = 4,
  EXPERT = 5
}

export enum QuizSessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled'
}

export enum QuestionType {
  RECALL = 'recall',
  RECOGNITION = 'recognition'
}

/**
 * Quiz configuration constants
 */
export const QUIZ_CONFIG = {
  MIN_MEMOS_FOR_QUIZ: 5,
  MAX_QUESTIONS_PER_SESSION: 50,
  DEFAULT_QUESTIONS_PER_SESSION: 10,
  MIN_QUESTIONS_PER_SESSION: 1,
  MAX_RESPONSE_TIME_MS: 300000, // 5 minutes
  DEFAULT_RESPONSE_TIME_MS: 30000, // 30 seconds
  CONFIDENCE_LEVELS: [1, 2, 3, 4, 5] as const,
  MAX_QUIZ_SESSIONS_PER_DAY: 20
};

/**
 * Quiz difficulty labels
 */
export const QUIZ_DIFFICULTY_LABELS: Record<QuizDifficulty, string> = {
  [QuizDifficulty.EASY]: 'Easy',
  [QuizDifficulty.MEDIUM]: 'Medium',
  [QuizDifficulty.HARD]: 'Hard',
  [QuizDifficulty.VERY_HARD]: 'Very Hard',
  [QuizDifficulty.EXPERT]: 'Expert'
};

/**
 * Quiz type labels
 */
export const QUIZ_TYPE_LABELS: Record<QuizType, string> = {
  [QuizType.RECALL]: 'Recall',
  [QuizType.RECOGNITION]: 'Recognition',
  [QuizType.MIXED]: 'Mixed'
};

/**
 * Quiz type descriptions
 */
export const QUIZ_TYPE_DESCRIPTIONS: Record<QuizType, string> = {
  [QuizType.RECALL]: 'Test your ability to remember information without hints',
  [QuizType.RECOGNITION]: 'Choose the correct answer from multiple options',
  [QuizType.MIXED]: 'A combination of recall and recognition questions'
};

/**
 * Confidence level labels
 */
export const CONFIDENCE_LABELS: Record<number, string> = {
  1: 'Not confident at all',
  2: 'Slightly confident',
  3: 'Moderately confident',
  4: 'Very confident',
  5: 'Extremely confident'
};

/**
 * Quiz performance thresholds
 */
export const QUIZ_PERFORMANCE_THRESHOLDS = {
  EXCELLENT: 0.9,  // 90%+
  GOOD: 0.75,      // 75%+
  AVERAGE: 0.6,    // 60%+
  POOR: 0.4,       // 40%+
  VERY_POOR: 0     // Below 40%
};

/**
 * Quiz performance labels
 */
export const QUIZ_PERFORMANCE_LABELS = {
  EXCELLENT: 'Excellent',
  GOOD: 'Good',
  AVERAGE: 'Average',
  POOR: 'Needs Improvement',
  VERY_POOR: 'Needs More Practice'
};

/**
 * Quiz achievement thresholds
 */
export const QUIZ_ACHIEVEMENTS = {
  FIRST_QUIZ: {
    id: 'first_quiz',
    name: 'First Steps',
    description: 'Complete your first quiz',
    threshold: 1
  },
  QUIZ_STREAK_5: {
    id: 'quiz_streak_5',
    name: 'On a Roll',
    description: 'Complete 5 quizzes in a row',
    threshold: 5
  },
  QUIZ_STREAK_10: {
    id: 'quiz_streak_10',
    name: 'Quiz Master',
    description: 'Complete 10 quizzes in a row',
    threshold: 10
  },
  PERFECT_SCORE: {
    id: 'perfect_score',
    name: 'Perfect Score',
    description: 'Get 100% on a quiz',
    threshold: 1.0
  },
  SPEED_DEMON: {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete a quiz in under 2 minutes',
    threshold: 120000 // 2 minutes in milliseconds
  }
};

/**
 * Default quiz options
 */
export const DEFAULT_QUIZ_OPTIONS = {
  maxQuestions: QUIZ_CONFIG.DEFAULT_QUESTIONS_PER_SESSION,
  questionTypes: [QuestionType.RECALL, QuestionType.RECOGNITION],
  difficultyRange: {
    min: QuizDifficulty.EASY,
    max: QuizDifficulty.EXPERT
  },
  includeCategories: [],
  excludeCategories: [],
  includeTags: [],
  excludeTags: []
};