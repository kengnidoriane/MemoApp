import { prisma } from '../lib/database';
import { createApiError } from '../middleware/errorHandler';
import { ErrorCode } from '@memo-app/shared';

export class SessionService {
  /**
   * Blacklist a token by its JTI
   */
  static async blacklistToken(jti: string, userId: string, expiresAt: Date): Promise<void> {
    try {
      await prisma.blacklistedToken.create({
        data: {
          jti,
          userId,
          expiresAt,
        },
      });
    } catch (error) {
      // If token is already blacklisted, ignore the error
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        return;
      }
      throw error;
    }
  }

  /**
   * Check if a token is blacklisted
   */
  static async isTokenBlacklisted(jti: string): Promise<boolean> {
    const blacklistedToken = await prisma.blacklistedToken.findUnique({
      where: { jti },
    });

    return !!blacklistedToken;
  }

  /**
   * Blacklist all tokens for a user (useful for logout from all devices)
   */
  static async blacklistAllUserTokens(userId: string): Promise<void> {
    // This would require tracking all active tokens for a user
    // For now, we'll implement a simpler approach by updating user's token version
    // or using a user-level blacklist timestamp
    
    // In a production system, you might want to:
    // 1. Keep track of all issued tokens per user
    // 2. Or use a user-level "tokens_valid_after" timestamp
    // 3. Or implement a more sophisticated session management system
    
    console.log(`Blacklisting all tokens for user ${userId} - implement as needed`);
  }

  /**
   * Clean up expired blacklisted tokens
   */
  static async cleanupExpiredBlacklistedTokens(): Promise<void> {
    const now = new Date();
    
    const result = await prisma.blacklistedToken.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    });

    console.log(`Cleaned up ${result.count} expired blacklisted tokens`);
  }

  /**
   * Get user's active sessions count (approximate)
   */
  static async getUserActiveSessionsCount(userId: string): Promise<number> {
    // This is a simplified implementation
    // In a real system, you'd track active sessions more precisely
    const blacklistedCount = await prisma.blacklistedToken.count({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
    });

    // This is just an estimate - in reality you'd need to track issued tokens
    return Math.max(0, 10 - blacklistedCount); // Assuming max 10 sessions per user
  }

  /**
   * Revoke all sessions for a user except the current one
   */
  static async revokeOtherSessions(userId: string, currentJti: string): Promise<void> {
    // In a production system, you'd need to track all active JTIs for a user
    // For now, this is a placeholder implementation
    console.log(`Revoking all sessions for user ${userId} except ${currentJti}`);
    
    // You could implement this by:
    // 1. Keeping a table of active sessions per user
    // 2. Blacklisting all JTIs except the current one
    // 3. Using a user-level "sessions_valid_after" timestamp
  }

  /**
   * Get session info for a user
   */
  static async getSessionInfo(userId: string, jti: string): Promise<{
    isValid: boolean;
    isBlacklisted: boolean;
    activeSessions: number;
  }> {
    const isBlacklisted = await this.isTokenBlacklisted(jti);
    const activeSessions = await this.getUserActiveSessionsCount(userId);

    return {
      isValid: !isBlacklisted,
      isBlacklisted,
      activeSessions,
    };
  }
}