import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader } from '../lib/jwt';
import { prisma } from '../lib/database';
import { createApiError } from './errorHandler';
import { ErrorCode } from '@memo-app/shared';
import { SessionService } from '../services/sessionService';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name?: string;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using JWT tokens
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    const payload = verifyAccessToken(token);

    // Check if token is blacklisted
    const isBlacklisted = await SessionService.isTokenBlacklisted(payload.jti);
    if (isBlacklisted) {
      throw createApiError('Token has been revoked', 401, ErrorCode.TOKEN_INVALID);
    }

    // Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
      },
    });

    if (!user) {
      throw createApiError('User not found', 401, ErrorCode.USER_NOT_FOUND);
    }

    if (!user.emailVerified) {
      throw createApiError('Please verify your email address before continuing', 401, ErrorCode.EMAIL_NOT_VERIFIED);
    }

    // Attach user and token info to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
    };

    // Store JTI for potential logout operations
    (req as any).tokenJti = payload.jti;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next();
    }

    const token = extractTokenFromHeader(authHeader);
    const payload = verifyAccessToken(token);

    // Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
      },
    });

    if (user && user.emailVerified) {
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
      };
    }

    next();
  } catch (error) {
    // For optional auth, we don't fail on token errors
    next();
  }
};

/**
 * Middleware to check if user owns a resource
 */
export const requireResourceOwnership = (resourceUserIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw createApiError('Authentication required', 401, ErrorCode.AUTHENTICATION_ERROR);
    }

    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (resourceUserId && resourceUserId !== req.user.id) {
      throw createApiError('Access denied', 403, ErrorCode.RESOURCE_ACCESS_DENIED);
    }

    next();
  };
};