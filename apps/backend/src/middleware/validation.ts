import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ErrorCode } from '@memo-app/shared';
import { createApiError } from './errorHandler';

/**
 * Middleware factory for validating request data using Zod schemas
 */
export const validateRequest = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[source];
      const validatedData = schema.parse(data);
      
      // Replace the original data with validated data
      req[source] = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        const apiError = createApiError(
          'Validation failed',
          400,
          ErrorCode.VALIDATION_ERROR,
          { errors: validationErrors }
        );
        
        next(apiError);
      } else {
        next(error);
      }
    }
  };
};

/**
 * Middleware for validating request body
 */
export const validateBody = (schema: ZodSchema) => validateRequest(schema, 'body');

/**
 * Middleware for validating query parameters
 */
export const validateQuery = (schema: ZodSchema) => validateRequest(schema, 'query');

/**
 * Middleware for validating route parameters
 */
export const validateParams = (schema: ZodSchema) => validateRequest(schema, 'params');