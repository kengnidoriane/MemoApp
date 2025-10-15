import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { ErrorCode } from '@memo-app/shared';
import { createApiError } from './errorHandler';

/**
 * Rate limiter for authentication endpoints
 * More restrictive to prevent brute force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    success: false,
    error: {
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    const error = createApiError(
      'Too many authentication attempts. Please try again later.',
      429,
      ErrorCode.RATE_LIMIT_EXCEEDED
    );
    res.status(429).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  },
});

/**
 * General API rate limiter
 * More lenient for general API usage
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs for general API
  message: {
    success: false,
    error: {
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message: 'Too many requests. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const error = createApiError(
      'Too many requests. Please try again later.',
      429,
      ErrorCode.RATE_LIMIT_EXCEEDED
    );
    res.status(429).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  },
});

/**
 * Strict rate limiter for password reset endpoints
 * Very restrictive to prevent abuse
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    error: {
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message: 'Too many password reset attempts. Please try again in 1 hour.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const error = createApiError(
      'Too many password reset attempts. Please try again later.',
      429,
      ErrorCode.RATE_LIMIT_EXCEEDED
    );
    res.status(429).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  },
});