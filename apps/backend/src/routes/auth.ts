import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/authService';
import { authenticateToken } from '../middleware/auth';
import { createApiError } from '../middleware/errorHandler';
import { authRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimiter';
import { validateBody } from '../middleware/validation';
import { extractTokenFromHeader } from '../lib/jwt';
import { 
  createUserSchema, 
  loginSchema, 
  updateUserSchema, 
  resetPasswordSchema,
  tokenSchema,
  ErrorCode
} from '@memo-app/shared';

// Create the schemas inline for now
const resetPasswordWithTokenSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      'Password must contain at least one lowercase letter, one uppercase letter, and one number')
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required')
});

const router = Router();

/**
 * POST /auth/register
 * Register a new user with email verification
 */
router.post('/register', 
  authRateLimiter,
  validateBody(createUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name } = req.body;
      const result = await AuthService.register({ email, password, name });

      res.status(201).json({
        success: true,
        data: result,
        message: 'User registered successfully. Please check your email for verification.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/login
 * Login user with JWT token response
 */
router.post('/login',
  authRateLimiter,
  validateBody(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login({ email, password });

      res.json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/refresh
 * Refresh access token
 */
router.post('/refresh', 
  validateBody(z.object({ refreshToken: tokenSchema })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      const tokens = await AuthService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: { tokens },
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/logout
 * Logout user with token invalidation
 */
router.post('/logout', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessToken = extractTokenFromHeader(req.headers.authorization);
    const { refreshToken } = req.body;

    await AuthService.logout({ accessToken, refreshToken });

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/me
 * Get current user profile
 */
router.get('/me', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createApiError('User not authenticated', 401, ErrorCode.AUTHENTICATION_ERROR);
    }

    const profile = await AuthService.getProfile(req.user.id);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /auth/profile
 * Update user profile
 */
router.put('/profile', 
  authenticateToken,
  validateBody(updateUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createApiError('User not authenticated', 401, ErrorCode.AUTHENTICATION_ERROR);
      }

      const { name, preferences } = req.body;
      const updatedProfile = await AuthService.updateProfile(req.user.id, { name, preferences });

      res.json({
        success: true,
        data: updatedProfile,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/forgot-password
 * Initiate password recovery
 */
router.post('/forgot-password',
  passwordResetRateLimiter,
  validateBody(resetPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      await AuthService.forgotPassword({ email });

      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/reset-password
 * Reset password using token
 */
router.post('/reset-password',
  validateBody(resetPasswordWithTokenSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, newPassword } = req.body;
      await AuthService.resetPassword({ token, newPassword });

      res.json({
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/verify-email
 * Verify email address using token
 */
router.post('/verify-email',
  validateBody(verifyEmailSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;
      await AuthService.verifyEmail(token);

      res.json({
        success: true,
        message: 'Email verified successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/resend-verification
 * Resend email verification
 */
router.post('/resend-verification',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createApiError('User not authenticated', 401, ErrorCode.AUTHENTICATION_ERROR);
      }

      await AuthService.resendEmailVerification(req.user.id);

      res.json({
        success: true,
        message: 'Verification email has been sent.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/logout-all
 * Logout from all devices
 */
router.post('/logout-all',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createApiError('User not authenticated', 401, ErrorCode.AUTHENTICATION_ERROR);
      }

      await AuthService.logoutFromAllDevices(req.user.id);

      res.json({
        success: true,
        message: 'Logged out from all devices successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /auth/sessions
 * Get session information
 */
router.get('/sessions',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createApiError('User not authenticated', 401, ErrorCode.AUTHENTICATION_ERROR);
      }

      const jti = (req as any).tokenJti;
      const sessionInfo = await AuthService.getSessionInfo(req.user.id, jti);

      res.json({
        success: true,
        data: sessionInfo,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/revoke-other-sessions
 * Revoke all other sessions except current
 */
router.post('/revoke-other-sessions',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createApiError('User not authenticated', 401, ErrorCode.AUTHENTICATION_ERROR);
      }

      const jti = (req as any).tokenJti;
      await AuthService.revokeOtherSessions(req.user.id, jti);

      res.json({
        success: true,
        message: 'Other sessions have been revoked successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;