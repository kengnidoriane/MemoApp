import { z } from 'zod';

// Category name validation
const categoryNameSchema = z.string()
  .min(1, 'Category name is required')
  .max(100, 'Category name must be less than 100 characters')
  .trim()
  .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Category name can only contain letters, numbers, spaces, hyphens, and underscores');

// Color validation (hex color format)
const colorSchema = z.string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color (e.g., #3B82F6)')
  .default('#3B82F6');

// UUID validation for IDs
const uuidSchema = z.string().uuid('Invalid ID format');

// Create category validation
export const createCategorySchema = z.object({
  name: categoryNameSchema,
  color: colorSchema.optional()
});

// Update category validation
export const updateCategorySchema = z.object({
  name: categoryNameSchema.optional(),
  color: colorSchema.optional()
}).refine((data) => {
  // At least one field must be provided for update
  return Object.values(data).some(value => value !== undefined);
}, {
  message: 'At least one field must be provided for update'
});

// Category ID validation
export const categoryIdSchema = uuidSchema;

// Category filters validation
export const categoryFiltersSchema = z.object({
  search: z.string().max(100, 'Search query must be less than 100 characters').optional(),
  sortBy: z.enum(['name', 'createdAt', 'memoCount']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  includeEmpty: z.boolean().default(true) // Include categories with no memos
});

// Bulk category operations validation
export const bulkCategoryOperationSchema = z.object({
  categoryIds: z.array(uuidSchema).min(1, 'At least one category ID is required'),
  operation: z.enum(['delete', 'merge']),
  targetCategoryId: uuidSchema.optional() // Required for merge operation
}).refine((data) => {
  // If operation is merge, targetCategoryId is required
  if (data.operation === 'merge') {
    return data.targetCategoryId !== undefined;
  }
  return true;
}, {
  message: 'Target category ID is required for merge operation',
  path: ['targetCategoryId']
});

// Category reassignment validation (when deleting a category)
export const categoryReassignmentSchema = z.object({
  newCategoryId: uuidSchema.optional().nullable(),
  action: z.enum(['reassign', 'uncategorize'])
}).refine((data) => {
  // If action is reassign, newCategoryId is required
  if (data.action === 'reassign') {
    return data.newCategoryId !== undefined && data.newCategoryId !== null;
  }
  return true;
}, {
  message: 'New category ID is required when reassigning memos',
  path: ['newCategoryId']
});

// Validation helper types
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryFiltersInput = z.infer<typeof categoryFiltersSchema>;
export type BulkCategoryOperationInput = z.infer<typeof bulkCategoryOperationSchema>;
export type CategoryReassignmentInput = z.infer<typeof categoryReassignmentSchema>;