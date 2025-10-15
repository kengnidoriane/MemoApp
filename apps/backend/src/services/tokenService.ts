import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../lib/database';
import { createApiError } from '../middleware/errorHandler';
import { ErrorCode } from '@memo-app/shared';

export interface TokenPayload {
  userId: string;
  email: string;
  type: 'password_reset' | 'email_verification';
}

export class TokenService {
  /**
   * Generate a secure random token
   */
  static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create password reset token
   */
  static async createPasswordResetToken(userId: string, email: string): Promise<string> {
    const token = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in database
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Create email verification token
   */
  static async createEmailVerificationToken(userId: string, email: string): Promise<string> {
    const token = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token in database
    await prisma.emailVerificationToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Verify password reset token
   */
  static async verifyPasswordResetToken(token: string): Promise<{ userId: string; email: string }> {
    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!tokenRecord) {
      throw createApiError('Invalid or expired reset token', 400, ErrorCode.TOKEN_INVALID);
    }

    if (tokenRecord.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.passwordResetToken.delete({
        where: { token },
      });
      throw createApiError('Reset token has expired', 400, ErrorCode.TOKEN_EXPIRED);
    }

    if (tokenRecord.usedAt) {
      throw createApiError('Reset token has already been used', 400, ErrorCode.TOKEN_INVALID);
    }

    return {
      userId: tokenRecord.user.id,
      email: tokenRecord.user.email,
    };
  }

  /**
   * Verify email verification token
   */
  static async verifyEmailVerificationToken(token: string): Promise<{ userId: string; email: string }> {
    const tokenRecord = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!tokenRecord) {
      throw createApiError('Invalid or expired verification token', 400, ErrorCode.TOKEN_INVALID);
    }

    if (tokenRecord.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.emailVerificationToken.delete({
        where: { token },
      });
      throw createApiError('Verification token has expired', 400, ErrorCode.TOKEN_EXPIRED);
    }

    if (tokenRecord.usedAt) {
      throw createApiError('Verification token has already been used', 400, ErrorCode.TOKEN_INVALID);
    }

    return {
      userId: tokenRecord.user.id,
      email: tokenRecord.user.email,
    };
  }

  /**
   * Mark password reset token as used
   */
  static async markPasswordResetTokenAsUsed(token: string): Promise<void> {
    await prisma.passwordResetToken.update({
      where: { token },
      data: { usedAt: new Date() },
    });
  }

  /**
   * Mark email verification token as used
   */
  static async markEmailVerificationTokenAsUsed(token: string): Promise<void> {
    await prisma.emailVerificationToken.update({
      where: { token },
      data: { usedAt: new Date() },
    });
  }

  /**
   * Clean up expired tokens
   */
  static async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();

    await Promise.all([
      prisma.passwordResetToken.deleteMany({
        where: {
          expiresAt: { lt: now },
        },
      }),
      prisma.emailVerificationToken.deleteMany({
        where: {
          expiresAt: { lt: now },
        },
      }),
    ]);
  }

  /**
   * Revoke all password reset tokens for a user
   */
  static async revokeAllPasswordResetTokens(userId: string): Promise<void> {
    await prisma.passwordResetToken.deleteMany({
      where: { userId },
    });
  }

  /**
   * Revoke all email verification tokens for a user
   */
  static async revokeAllEmailVerificationTokens(userId: string): Promise<void> {
    await prisma.emailVerificationToken.deleteMany({
      where: { userId },
    });
  }
}