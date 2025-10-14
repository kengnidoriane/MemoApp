/**
 * Spaced repetition algorithm constants (SM-2 Algorithm)
 */

export enum ReviewResult {
  FORGOT = 0,
  HARD = 1,
  GOOD = 2,
  EASY = 3
}

/**
 * SM-2 Algorithm constants
 */
export const SM2_CONSTANTS = {
  // Initial ease factor
  INITIAL_EASE_FACTOR: 2.5,
  
  // Minimum ease factor
  MIN_EASE_FACTOR: 1.3,
  
  // Maximum ease factor
  MAX_EASE_FACTOR: 2.5,
  
  // Initial interval (days)
  INITIAL_INTERVAL: 1,
  
  // Second interval (days)
  SECOND_INTERVAL: 6,
  
  // Ease factor adjustment for different responses
  EASE_ADJUSTMENTS: {
    [ReviewResult.FORGOT]: -0.8,
    [ReviewResult.HARD]: -0.15,
    [ReviewResult.GOOD]: 0,
    [ReviewResult.EASY]: 0.15
  },
  
  // Interval multipliers for different responses
  INTERVAL_MULTIPLIERS: {
    [ReviewResult.FORGOT]: 0, // Reset to beginning
    [ReviewResult.HARD]: 1.2,
    [ReviewResult.GOOD]: 1.0, // Use ease factor
    [ReviewResult.EASY]: 1.3
  }
};/**
 *
 Difficulty level mappings
 */
export const DIFFICULTY_LEVELS = {
  VERY_EASY: 1,
  EASY: 2,
  MEDIUM: 3,
  HARD: 4,
  VERY_HARD: 5
} as const;

/**
 * Difficulty level labels
 */
export const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Very Easy',
  2: 'Easy',
  3: 'Medium',
  4: 'Hard',
  5: 'Very Hard'
};

/**
 * Review performance thresholds
 */
export const REVIEW_THRESHOLDS = {
  MASTERED: 0.9,    // 90%+ success rate
  LEARNING: 0.7,    // 70%+ success rate
  DIFFICULT: 0.5,   // 50%+ success rate
  STRUGGLING: 0     // Below 50%
};

/**
 * Default spaced repetition settings
 */
export const DEFAULT_SR_SETTINGS = {
  initialInterval: SM2_CONSTANTS.INITIAL_INTERVAL,
  easeFactor: SM2_CONSTANTS.INITIAL_EASE_FACTOR,
  difficultyLevel: DIFFICULTY_LEVELS.MEDIUM,
  repetitions: 0,
  maxInterval: 365, // Maximum interval in days (1 year)
  minInterval: 1    // Minimum interval in days
};

/**
 * Learning phase constants
 */
export const LEARNING_PHASES = {
  NEW: 'new',
  LEARNING: 'learning',
  REVIEW: 'review',
  MASTERED: 'mastered'
} as const;

export type LearningPhase = typeof LEARNING_PHASES[keyof typeof LEARNING_PHASES];