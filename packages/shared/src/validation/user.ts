import { z } from 'zod';

// Email validation with proper regex
const emailSchema = z.string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required')
  .max(255, 'Email must be less than 255 characters');

// Password validation with security requirements
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be less than 128 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
    'Password must contain at least one lowercase letter, one uppercase letter, and one number');

// User preferences validation
const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark']).default('light'),
  language: z.enum(['en', 'fr']).default('en'),
  reminderFrequency: z.enum(['10min', '30min', '1h', '4h', '1day', '3days', '1week']).default('1day'),
  notificationsEnabled: z.boolean().default(true),
  fontSize: z.enum(['small', 'medium', 'large']).default('medium')
});

// User registration validation
export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
});

// User login validation
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

// User profile update validation
export const updateUserSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),
  preferences: userPreferencesSchema.partial().optional()
});

// Password reset validation
export const resetPasswordSchema = z.object({
  email: emailSchema
});

// Change password validation
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema
}).refine((data: any) => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword']
});

// User preferences validation (standalone)
export const userPreferencesValidationSchema = userPreferencesSchema;

// JWT token validation
export const tokenSchema = z.string().min(1, 'Token is required');

// Validation helper types
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;