import { z } from 'zod';
import { validateData, formatValidationErrors } from './utils';

/**
 * Form validation hooks and utilities for React Hook Form integration
 */

// Form field error type
export interface FormFieldError {
  type: string;
  message: string;
}

// Form validation result
export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, FormFieldError>;
}

/**
 * Creates a validation resolver for React Hook Form
 */
export function createZodResolver<T>(schema: z.ZodSchema<T>) {
  return async (data: any) => {
    const result = validateData(schema, data);
    
    if (result.success) {
      return {
        values: result.data,
        errors: {}
      };
    }
    
    const formattedErrors = formatValidationErrors(result.errors || []);
    const errors: Record<string, FormFieldError> = {};
    
    Object.entries(formattedErrors).forEach(([field, message]) => {
      errors[field] = {
        type: 'validation',
        message
      };
    });
    
    return {
      values: {},
      errors
    };
  };
}

/**
 * Validates a single form field
 */
export function validateField<T>(
  schema: z.ZodSchema<T>,
  value: unknown,
  fieldName: string
): FormFieldError | null {
  try {
    schema.parse(value);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = error.errors.find(err => 
        err.path.length === 0 || err.path[0] === fieldName
      );
      
      if (fieldError) {
        return {
          type: fieldError.code,
          message: fieldError.message
        };
      }
    }
    
    return {
      type: 'validation',
      message: 'Invalid value'
    };
  }
}

/**
 * Creates a debounced field validator
 */
export function createDebouncedValidator<T>(
  schema: z.ZodSchema<T>,
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout;
  
  return (value: unknown, callback: (error: FormFieldError | null) => void) => {
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      const error = validateField(schema, value, '');
      callback(error);
    }, delay);
  };
}

/**
 * Common form validation patterns
 */
export const formValidationPatterns = {
  // Email validation with custom message
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  
  // Password validation with detailed requirements
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      'Password must contain uppercase, lowercase, and number'),
  
  // Required text field
  requiredText: (fieldName: string, maxLength: number = 255) => 
    z.string()
      .min(1, `${fieldName} is required`)
      .max(maxLength, `${fieldName} must be less than ${maxLength} characters`),
  
  // Optional text field
  optionalText: (maxLength: number = 255) =>
    z.string()
      .max(maxLength, `Text must be less than ${maxLength} characters`)
      .optional(),
  
  // UUID field
  uuid: z.string().uuid('Invalid ID format'),
  
  // Positive integer
  positiveInt: z.number().int().positive('Must be a positive number'),
  
  // Date field
  date: z.coerce.date(),
  
  // Boolean field
  boolean: z.boolean(),
  
  // Array of strings
  stringArray: z.array(z.string()),
  
  // Hex color
  hexColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format')
};

/**
 * Form state management helpers
 */
export interface FormState<T> {
  data: Partial<T>;
  errors: Record<string, FormFieldError>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

/**
 * Creates initial form state
 */
export function createInitialFormState<T>(initialData?: Partial<T>): FormState<T> {
  return {
    data: initialData || {},
    errors: {},
    isValid: false,
    isDirty: false,
    isSubmitting: false
  };
}

/**
 * Form submission handler with validation
 */
export async function handleFormSubmission<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  onSubmit: (validData: T) => Promise<void> | void
): Promise<FormValidationResult> {
  const validationResult = validateData(schema, data);
  
  if (!validationResult.success) {
    const formattedErrors = formatValidationErrors(validationResult.errors || []);
    const errors: Record<string, FormFieldError> = {};
    
    Object.entries(formattedErrors).forEach(([field, message]) => {
      errors[field] = {
        type: 'validation',
        message
      };
    });
    
    return {
      isValid: false,
      errors
    };
  }
  
  try {
    await onSubmit(validationResult.data!);
    return {
      isValid: true,
      errors: {}
    };
  } catch (error) {
    return {
      isValid: false,
      errors: {
        submit: {
          type: 'submission',
          message: error instanceof Error ? error.message : 'Submission failed'
        }
      }
    };
  }
}