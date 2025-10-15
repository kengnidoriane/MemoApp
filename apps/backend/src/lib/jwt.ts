import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { createApiError } from '../middleware/errorHandler';
import { ErrorCode } from '@memo-app/shared';

export interface JwtPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
  jti: string; // JWT ID for token tracking
  exp?: number; // Expiration time (Unix timestamp)
  iat?: number; // Issued at time (Unix timestamp)
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets must be defined in environment variables');
}

/**
 * Generate access and refresh token pair
 */
export const generateTokenPair = (userId: string, email: string): TokenPair => {
  const accessJti = uuidv4();
  const refreshJti = uuidv4();

  const accessPayload: JwtPayload = {
    userId,
    email,
    type: 'access',
    jti: accessJti,
  };

  const refreshPayload: JwtPayload = {
    userId,
    email,
    type: 'refresh',
    jti: refreshJti,
  };

  const accessToken = jwt.sign(accessPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'memo-app',
    audience: 'memo-app-users',
    jwtid: accessJti,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(refreshPayload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'memo-app',
    audience: 'memo-app-users',
    jwtid: refreshJti,
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: 'memo-app',
      audience: 'memo-app-users',
    }) as JwtPayload;

    if (payload.type !== 'access') {
      throw createApiError('Invalid token type', 401, ErrorCode.TOKEN_INVALID);
    }

    return payload;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw createApiError('Invalid token', 401, ErrorCode.TOKEN_INVALID);
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw createApiError('Token expired', 401, ErrorCode.TOKEN_EXPIRED);
    }
    throw error;
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'memo-app',
      audience: 'memo-app-users',
    }) as JwtPayload;

    if (payload.type !== 'refresh') {
      throw createApiError('Invalid token type', 401, ErrorCode.TOKEN_INVALID);
    }

    return payload;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw createApiError('Invalid refresh token', 401, ErrorCode.TOKEN_INVALID);
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw createApiError('Refresh token expired', 401, ErrorCode.TOKEN_EXPIRED);
    }
    throw error;
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader?: string): string => {
  if (!authHeader) {
    throw createApiError('Authorization header missing', 401, ErrorCode.AUTHENTICATION_ERROR);
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw createApiError('Invalid authorization header format', 401, ErrorCode.AUTHENTICATION_ERROR);
  }

  return parts[1];
};