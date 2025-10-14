import { z } from 'zod';

// UUID validation for IDs
const uuidSchema = z.string().uuid('Invalid ID format');

// Quiz options validation
export const quizOptionsSchema = z.object({
  maxQuestions: z.number().int().min(1).max(50).default(10),
  includeCategories: z.array(uuidSchema).optional(),
  excludeCategories: z.array(uuidSchema).optional(),
  includeTags: z.array(z.string()).optional(),
  excludeTags: z.array(z.string()).optional(),
  questionTypes: z.array(z.enum(['recall', 'recognition'])).default(['recall', 'recognition']),
  difficultyRange: z.object({
    min: z.number().int().min(1).max(5),
    max: z.number().int().min(1).max(5)
  }).refine((data) => data.min <= data.max, {
    message: 'Minimum difficulty must be less than or equal to maximum difficulty'
  }).optional()
});

// Quiz answer validation
export const quizAnswerSchema = z.object({
  questionId: uuidSchema,
  answer: z.string().min(1, 'Answer is required').max(1000, 'Answer must be less than 1000 characters'),
  responseTimeMs: z.number().int().min(0),
  confidence: z.number().int().min(1).max(5)
});

// Quiz session ID validation
export const quizSessionIdSchema = uuidSchema;

// Quiz question ID validation
export const quizQuestionIdSchema = uuidSchema;

// Quiz performance feedback validation
export const quizPerformanceFeedbackSchema = z.object({
  sessionId: uuidSchema,
  questionId: uuidSchema,
  remembered: z.boolean(),
  difficulty: z.enum(['too_easy', 'appropriate', 'too_hard']).optional(),
  feedback: z.string().max(500, 'Feedback must be less than 500 characters').optional()
});

// Quiz session filters validation
export const quizSessionFiltersSchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  status: z.enum(['active', 'completed']).optional(),
  sortBy: z.enum(['startedAt', 'completedAt', 'accuracy']).default('startedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10)
}).refine((data) => {
  // Ensure dateFrom is before dateTo if both are provided
  if (data.dateFrom && data.dateTo) {
    return data.dateFrom <= data.dateTo;
  }
  return true;
}, {
  message: 'Start date must be before or equal to end date',
  path: ['dateFrom']
});

// Quiz statistics filters validation
export const quizStatsFiltersSchema = z.object({
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
  categoryId: uuidSchema.optional(),
  tags: z.array(z.string()).optional()
});

// Review session validation (for spaced repetition updates)
export const reviewSessionSchema = z.object({
  memoId: uuidSchema,
  performance: z.object({
    remembered: z.boolean(),
    responseTime: z.number().int().min(0),
    confidence: z.number().int().min(1).max(5)
  }),
  reviewedAt: z.coerce.date().default(() => new Date())
});

// Batch review validation
export const batchReviewSchema = z.object({
  reviews: z.array(reviewSessionSchema).min(1, 'At least one review is required').max(100, 'Maximum 100 reviews per batch')
});

// Validation helper types
export type QuizOptionsInput = z.infer<typeof quizOptionsSchema>;
export type QuizAnswerInput = z.infer<typeof quizAnswerSchema>;
export type QuizPerformanceFeedbackInput = z.infer<typeof quizPerformanceFeedbackSchema>;
export type QuizSessionFiltersInput = z.infer<typeof quizSessionFiltersSchema>;
export type QuizStatsFiltersInput = z.infer<typeof quizStatsFiltersSchema>;
export type ReviewSessionInput = z.infer<typeof reviewSessionSchema>;
export type BatchReviewInput = z.infer<typeof batchReviewSchema>;