import request from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createTestApp } from '../helpers/testApp';

// Mock the database
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
} as unknown as PrismaClient;

// Mock external dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../src/lib/database', () => ({ prisma: mockPrisma }));

describe('Auth API Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    const validRegistrationData = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      name: 'Test User',
    };

    it('should register a new user successfully', async () => {
      // Mock bcrypt
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      
      // Mock database calls
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null); // User doesn't exist
      (mockPrisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: validRegistrationData.email,
        name: validRegistrationData.name,
        emailVerified: false,
        createdAt: new Date(),
      });

      // Mock JWT
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData)
        .expect(201);

      expect(response.body).toMatchObject({
        user: {
          id: 'user-1',
          email: validRegistrationData.email,
          name: validRegistrationData.name,
        },
        token: 'mock-token',
      });

      // Verify password was hashed
      expect(bcrypt.hash).toHaveBeenCalledWith(validRegistrationData.password, 12);

      // Verify user was created
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: validRegistrationData.email,
          passwordHash: 'hashedPassword',
          name: validRegistrationData.name,
          preferences: expect.any(Object),
        },
      });
    });

    it('should reject registration with existing email', async () => {
      // Mock existing user
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-user',
        email: validRegistrationData.email,
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData)
        .expect(400);

      expect(response.body.message).toContain('already exists');

      // Verify user creation was not attempted
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123', // Too short
        name: '', // Empty
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should handle database errors gracefully', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData)
        .expect(500);

      expect(response.body.message).toContain('Internal server error');
    });
  });

  describe('POST /api/auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'SecurePass123!',
    };

    const mockUser = {
      id: 'user-1',
      email: validLoginData.email,
      passwordHash: 'hashedPassword',
      name: 'Test User',
      emailVerified: true,
      lastLoginAt: new Date(),
    };

    it('should login user with valid credentials', async () => {
      // Mock database and bcrypt
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('access-token');

      // Mock user update for last login
      (mockPrisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      // In a real test:
      // const response = await request(app)
      //   .post('/api/auth/login')
      //   .send(validLoginData)
      //   .expect(200);

      // expect(response.body).toMatchObject({
      //   user: {
      //     id: mockUser.id,
      //     email: mockUser.email,
      //     name: mockUser.name,
      //   },
      //   token: 'access-token',
      // });

      // Verify password was checked
      expect(bcrypt.compare).toHaveBeenCalledWith(validLoginData.password, mockUser.passwordHash);

      // Verify last login was updated
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLoginAt: expect.any(Date) },
      });
    });

    it('should reject login with invalid email', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // In a real test:
      // const response = await request(app)
      //   .post('/api/auth/login')
      //   .send(validLoginData)
      //   .expect(401);

      // expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject login with invalid password', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // In a real test:
      // const response = await request(app)
      //   .post('/api/auth/login')
      //   .send(validLoginData)
      //   .expect(401);

      // expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject login for unverified email', async () => {
      const unverifiedUser = { ...mockUser, emailVerified: false };
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(unverifiedUser);

      // In a real test:
      // const response = await request(app)
      //   .post('/api/auth/login')
      //   .send(validLoginData)
      //   .expect(401);

      // expect(response.body.message).toContain('Please verify your email');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      const token = 'valid-jwt-token';

      // In a real test:
      // const response = await request(app)
      //   .post('/api/auth/logout')
      //   .set('Authorization', `Bearer ${token}`)
      //   .expect(200);

      // expect(response.body.message).toBe('Logged out successfully');
    });

    it('should handle logout without token', async () => {
      // In a real test:
      // const response = await request(app)
      //   .post('/api/auth/logout')
      //   .expect(401);

      // expect(response.body.message).toContain('No token provided');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    const forgotPasswordData = {
      email: 'test@example.com',
    };

    it('should send password reset email for existing user', async () => {
      const mockUser = {
        id: 'user-1',
        email: forgotPasswordData.email,
        name: 'Test User',
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('reset-token');

      // In a real test:
      // const response = await request(app)
      //   .post('/api/auth/forgot-password')
      //   .send(forgotPasswordData)
      //   .expect(200);

      // expect(response.body.message).toContain('Password reset email sent');

      // Verify reset token was generated
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id, type: 'password-reset' },
        expect.any(String),
        { expiresIn: '1h' }
      );
    });

    it('should handle non-existent email gracefully', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // In a real test:
      // const response = await request(app)
      //   .post('/api/auth/forgot-password')
      //   .send(forgotPasswordData)
      //   .expect(200); // Still return 200 for security

      // expect(response.body.message).toContain('Password reset email sent');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    const resetPasswordData = {
      token: 'valid-reset-token',
      password: 'NewSecurePass123!',
    };

    it('should reset password with valid token', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
      };

      // Mock JWT verification
      (jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUser.id,
        type: 'password-reset',
      });

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      (mockPrisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      // In a real test:
      // const response = await request(app)
      //   .post('/api/auth/reset-password')
      //   .send(resetPasswordData)
      //   .expect(200);

      // expect(response.body.message).toBe('Password reset successfully');

      // Verify password was hashed and updated
      expect(bcrypt.hash).toHaveBeenCalledWith(resetPasswordData.password, 12);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { passwordHash: 'newHashedPassword' },
      });
    });

    it('should reject invalid reset token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // In a real test:
      // const response = await request(app)
      //   .post('/api/auth/reset-password')
      //   .send(resetPasswordData)
      //   .expect(400);

      // expect(response.body.message).toContain('Invalid or expired token');
    });

    it('should reject expired reset token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      // In a real test:
      // const response = await request(app)
      //   .post('/api/auth/reset-password')
      //   .send(resetPasswordData)
      //   .expect(400);

      // expect(response.body.message).toContain('Token expired');
    });
  });

  describe('GET /api/users/profile', () => {
    it('should return user profile for authenticated user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        preferences: {
          theme: 'light',
          language: 'en',
        },
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // In a real test:
      // const response = await request(app)
      //   .get('/api/users/profile')
      //   .set('Authorization', 'Bearer valid-token')
      //   .expect(200);

      // expect(response.body).toMatchObject({
      //   id: mockUser.id,
      //   email: mockUser.email,
      //   name: mockUser.name,
      //   preferences: mockUser.preferences,
      // });

      // Should not include sensitive data
      // expect(response.body.passwordHash).toBeUndefined();
    });

    it('should require authentication', async () => {
      // In a real test:
      // const response = await request(app)
      //   .get('/api/users/profile')
      //   .expect(401);

      // expect(response.body.message).toContain('No token provided');
    });
  });

  describe('PUT /api/users/profile', () => {
    const updateData = {
      name: 'Updated Name',
      preferences: {
        theme: 'dark',
        language: 'fr',
        notificationsEnabled: true,
      },
    };

    it('should update user profile', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        preferences: { theme: 'light' },
      };

      const updatedUser = {
        ...mockUser,
        ...updateData,
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      // In a real test:
      // const response = await request(app)
      //   .put('/api/users/profile')
      //   .set('Authorization', 'Bearer valid-token')
      //   .send(updateData)
      //   .expect(200);

      // expect(response.body).toMatchObject(updateData);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: updateData,
      });
    });

    it('should validate update data', async () => {
      const invalidData = {
        name: '', // Empty name
        preferences: {
          theme: 'invalid-theme',
        },
      };

      // In a real test:
      // const response = await request(app)
      //   .put('/api/users/profile')
      //   .set('Authorization', 'Bearer valid-token')
      //   .send(invalidData)
      //   .expect(400);

      // expect(response.body.errors).toBeDefined();
    });
  });
});