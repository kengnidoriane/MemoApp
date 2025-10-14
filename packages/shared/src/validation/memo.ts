import { z } from 'zod';

// Memo content validation
const memoContentSchema = z.string()
  .min(1, 'Memo content is required')
  .max(10000, 'Memo content must be less than 10,000 characters');

// Memo title validation
const memoTitleSchema = z.string()
  .min(1, 'Memo title is required')
  .max(500, 'Memo title must be less than 500 characters')
  .trim();

// Tags validation
const tagsSchema = z.array(z.string()
  .min(1, 'Tag cannot be empty')
  .max(50, 'Tag must be less than 50 characters')
  .regex(/^[a-zA-Z0-9\s-_]+$/, 'Tags can only contain letters, numbers, spaces, hyphens, and underscores')
).max(20, 'Maximum 20 tags allowed');

// UUID validation for IDs
const uuidSchema = z.string().uuid('Invalid ID format');

// Create memo validation
export const createMemoSchema = z.object({
  title: memoTitleSchema,
  content: memoContentSchema,
  tags: tagsSchema.optional().default([]),
  categoryId: uuidSchema.optional()
});

// Update memo validation
export const updateMemoSchema = z.object({
  title: memoTitleSchema.optional(),
  content: memoContentSchema.optional(),
  tags: tagsSchema.optional(),
  categoryId: uuidSchema.optional().nullable()
}).refine((data) => {
  // At least one field must be provided for update
  return Object.values(data).some(value => value !== undefined);
}, {
  message: 'At least one field must be provided for update'
});

// Memo filters validation
export const memoFiltersSchema = z.object({
  categoryId: uuidSchema.optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().max(200, 'Search query must be less than 200 characters').optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'nextReviewAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
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

// Search query validation
export const searchQuerySchema = z.object({
  query: z.string()
    .min(1, 'Search query is required')
    .max(200, 'Search query must be less than 200 characters'),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});

// Memo ID validation
export const memoIdSchema = uuidSchema;

// Spaced repetition parameters validation
export const spacedRepetitionSchema = z.object({
  difficultyLevel: z.number().int().min(1).max(5),
  easeFactor: z.number().min(1.3).max(2.5),
  intervalDays: z.number().int().min(1),
  repetitions: z.number().int().min(0)
});

// Review performance validation
export const reviewPerformanceSchema = z.object({
  remembered: z.boolean(),
  responseTime: z.number().int().min(0),
  confidence: z.number().int().min(1).max(5)
});

// Validation helper types
export type CreateMemoInput = z.infer<typeof createMemoSchema>;
export type UpdateMemoInput = z.infer<typeof updateMemoSchema>;
export type MemoFiltersInput = z.infer<typeof memoFiltersSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type SpacedRepetitionInput = z.infer<typeof spacedRepetitionSchema>;
export type ReviewPerformanceInput = z.infer<typeof reviewPerformanceSchema>;