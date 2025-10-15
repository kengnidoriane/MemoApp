import { prisma } from '../lib/database';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../lib/password';
import { generateTokenPair, verifyRefreshToken, TokenPair } from '../lib/jwt';
import { createApiError } from '../middleware/errorHandler';
import { ErrorCode } from '@memo-app/shared';
import { EmailService } from './emailService';
import { TokenService } from './tokenService';
import { SessionService } from './sessionService';
import { verifyAccessToken } from '../lib/jwt';

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface LogoutRequest {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name?: string;
    emailVerified: boolean;
  };
  tokens: TokenPair;
}

export class AuthService {
  /**
   * Register a new user
   */
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    const { email, password, name } = data;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw createApiError('Password does not meet requirements', 400, ErrorCode.VALIDATION_ERROR, {
        errors: passwordValidation.errors,
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw createApiError('An account with this email already exists', 409, ErrorCode.EMAIL_ALREADY_EXISTS);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        emailVerified: false, // Will be verified via email
      },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
      },
    });

    // Send email verification
    try {
      const verificationToken = await TokenService.createEmailVerificationToken(user.id, user.email);
      await EmailService.sendEmailVerificationEmail(user.email, verificationToken);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't fail registration if email sending fails
    }

    // Generate tokens
    const tokens = generateTokenPair(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        emailVerified: user.emailVerified,
      },
      tokens,
    };
  }

  /**
   * Login user
   */
  static async login(data: LoginRequest): Promise<AuthResponse> {
    const { email, password } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        emailVerified: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw createApiError('Invalid email or password', 401, ErrorCode.INVALID_CREDENTIALS);
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw createApiError('Invalid email or password', 401, ErrorCode.INVALID_CREDENTIALS);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = generateTokenPair(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        emailVerified: user.emailVerified,
      },
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<TokenPair> {
    const payload = verifyRefreshToken(refreshToken);

    // Check if refresh token is blacklisted
    const isBlacklisted = await SessionService.isTokenBlacklisted(payload.jti);
    if (isBlacklisted) {
      throw createApiError('Refresh token has been revoked', 401, ErrorCode.TOKEN_INVALID);
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
      },
    });

    if (!user) {
      throw createApiError('User not found', 401, ErrorCode.USER_NOT_FOUND);
    }

    if (!user.emailVerified) {
      throw createApiError('Please verify your email address before continuing', 401, ErrorCode.EMAIL_NOT_VERIFIED);
    }

    // Blacklist the old refresh token (refresh token rotation)
    const refreshTokenExp = new Date(payload.exp! * 1000);
    await SessionService.blacklistToken(payload.jti, payload.userId, refreshTokenExp);

    // Generate new token pair
    return generateTokenPair(user.id, user.email);
  }

  /**
   * Get user profile
   */
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        preferences: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw createApiError('User not found', 404, ErrorCode.USER_NOT_FOUND);
    }

    return user;
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, data: { name?: string; preferences?: any }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        preferences: data.preferences,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        preferences: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Initiate password recovery
   */
  static async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    const { email } = data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return;
    }

    // Revoke any existing password reset tokens
    await TokenService.revokeAllPasswordResetTokens(user.id);

    // Create new password reset token
    const resetToken = await TokenService.createPasswordResetToken(user.id, user.email);

    // Send password reset email
    try {
      await EmailService.sendPasswordResetEmail(user.email, resetToken);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw createApiError(
        'Failed to send password reset email',
        500,
        ErrorCode.EXTERNAL_SERVICE_ERROR
      );
    }
  }

  /**
   * Reset password using token
   */
  static async resetPassword(data: ResetPasswordRequest): Promise<void> {
    const { token, newPassword } = data;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw createApiError('Password does not meet requirements', 400, ErrorCode.VALIDATION_ERROR, {
        errors: passwordValidation.errors,
      });
    }

    // Verify token
    const { userId } = await TokenService.verifyPasswordResetToken(token);

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        updatedAt: new Date(),
      },
    });

    // Mark token as used
    await TokenService.markPasswordResetTokenAsUsed(token);

    // Revoke all other password reset tokens for this user
    await TokenService.revokeAllPasswordResetTokens(userId);
  }

  /**
   * Verify email address
   */
  static async verifyEmail(token: string): Promise<void> {
    // Verify token
    const { userId } = await TokenService.verifyEmailVerificationToken(token);

    // Update user email verification status
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        updatedAt: new Date(),
      },
    });

    // Mark token as used
    await TokenService.markEmailVerificationTokenAsUsed(token);

    // Revoke all other email verification tokens for this user
    await TokenService.revokeAllEmailVerificationTokens(userId);
  }

  /**
   * Resend email verification
   */
  static async resendEmailVerification(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
      },
    });

    if (!user) {
      throw createApiError('User not found', 404, ErrorCode.USER_NOT_FOUND);
    }

    if (user.emailVerified) {
      throw createApiError('Email is already verified', 400, ErrorCode.VALIDATION_ERROR);
    }

    // Revoke existing verification tokens
    await TokenService.revokeAllEmailVerificationTokens(user.id);

    // Create new verification token
    const verificationToken = await TokenService.createEmailVerificationToken(user.id, user.email);

    // Send verification email
    try {
      await EmailService.sendEmailVerificationEmail(user.email, verificationToken);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw createApiError(
        'Failed to send verification email',
        500,
        ErrorCode.EXTERNAL_SERVICE_ERROR
      );
    }
  }

  /**
   * Logout user (blacklist current tokens)
   */
  static async logout(data: LogoutRequest): Promise<void> {
    const { accessToken, refreshToken } = data;

    try {
      // Verify and blacklist access token
      const accessPayload = verifyAccessToken(accessToken);
      const accessTokenExp = new Date(accessPayload.exp! * 1000);
      await SessionService.blacklistToken(accessPayload.jti, accessPayload.userId, accessTokenExp);

      // If refresh token is provided, blacklist it too
      if (refreshToken) {
        try {
          const refreshPayload = verifyRefreshToken(refreshToken);
          const refreshTokenExp = new Date(refreshPayload.exp! * 1000);
          await SessionService.blacklistToken(refreshPayload.jti, refreshPayload.userId, refreshTokenExp);
        } catch (error) {
          // If refresh token is invalid, continue with access token logout
          console.log('Invalid refresh token during logout, continuing...');
        }
      }
    } catch (error) {
      // Even if token verification fails, we should still try to blacklist
      console.error('Error during logout:', error);
      throw createApiError('Logout failed', 500, ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Logout from all devices (blacklist all user tokens)
   */
  static async logoutFromAllDevices(userId: string): Promise<void> {
    try {
      await SessionService.blacklistAllUserTokens(userId);
    } catch (error) {
      console.error('Error during logout from all devices:', error);
      throw createApiError('Failed to logout from all devices', 500, ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get user session information
   */
  static async getSessionInfo(userId: string, jti: string): Promise<{
    isValid: boolean;
    activeSessions: number;
  }> {
    const sessionInfo = await SessionService.getSessionInfo(userId, jti);
    return {
      isValid: sessionInfo.isValid,
      activeSessions: sessionInfo.activeSessions,
    };
  }

  /**
   * Revoke other sessions (keep current session active)
   */
  static async revokeOtherSessions(userId: string, currentJti: string): Promise<void> {
    try {
      await SessionService.revokeOtherSessions(userId, currentJti);
    } catch (error) {
      console.error('Error revoking other sessions:', error);
      throw createApiError('Failed to revoke other sessions', 500, ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }
}