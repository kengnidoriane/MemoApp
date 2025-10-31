import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { errorHandler } from '../../src/middleware/errorHandler';
import { requestLogger } from '../../src/middleware/requestLogger';
import { notFoundHandler } from '../../src/middleware/notFoundHandler';

// Import routes
import authRoutes from '../../src/routes/auth';
import memoRoutes from '../../src/routes/memos';
import categoryRoutes from '../../src/routes/categories';
import quizRoutes from '../../src/routes/quiz';
import syncRoutes from '../../src/routes/sync';
import analyticsRoutes from '../../src/routes/analytics';
import exportRoutes from '../../src/routes/export';
import reminderRoutes from '../../src/routes/reminders';

export function createTestApp() {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Logging middleware (only in test if needed)
  if (process.env.NODE_ENV !== 'test') {
    app.use(requestLogger);
  }

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/memos', memoRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/quiz', quizRoutes);
  app.use('/api/sync', syncRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/export', exportRoutes);
  app.use('/api/reminders', reminderRoutes);

  // Error handling middleware
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export function createAuthenticatedRequest(app: express.Application, userId: string) {
  const token = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );

  return request(app).set('Authorization', `Bearer ${token}`);
}

export const testUser = {
  id: 'test-user-1',
  email: 'test@example.com',
  name: 'Test User',
  passwordHash: '$2a$12$test.hash.here',
  emailVerified: true,
  preferences: {
    theme: 'light',
    language: 'en',
    reminderFrequency: 'daily',
    notificationsEnabled: true,
    fontSize: 'medium',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: new Date(),
};

export const testMemo = {
  id: 'test-memo-1',
  title: 'Test Memo',
  content: 'This is a test memo content',
  tags: ['test', 'example'],
  categoryId: 'test-category-1',
  userId: 'test-user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  lastReviewedAt: null,
  reviewCount: 0,
  difficultyLevel: 3,
  easeFactor: 2.5,
  intervalDays: 1,
  repetitions: 0,
  nextReviewAt: null,
};

export const testCategory = {
  id: 'test-category-1',
  name: 'Test Category',
  color: '#3B82F6',
  userId: 'test-user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function mockPrismaUser(overrides = {}) {
  return {
    ...testUser,
    ...overrides,
  };
}

export function mockPrismaMemo(overrides = {}) {
  return {
    ...testMemo,
    category: testCategory,
    ...overrides,
  };
}

export function mockPrismaCategory(overrides = {}) {
  return {
    ...testCategory,
    memoCount: 1,
    ...overrides,
  };
}