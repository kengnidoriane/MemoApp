import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { requestLogger } from './middleware/requestLogger';
import { checkDatabaseConnection, getDatabaseInfo } from './lib/database';
import { EmailService } from './services/emailService';
import { SessionService } from './services/sessionService';
import { TokenService } from './services/tokenService';
import authRoutes from './routes/auth';
import memoRoutes from './routes/memos';
import categoryRoutes from './routes/categories';
import reminderRoutes from './routes/reminders';
import quizRoutes from './routes/quiz';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(requestLogger);

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbInfo = await getDatabaseInfo();
  
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: dbInfo,
  });
});

// API routes
app.get('/api', (req, res) => {
  res.json({
    message: 'MemoApp API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Memo routes
app.use('/api/memos', memoRoutes);

// Category routes
app.use('/api/categories', categoryRoutes);

// Reminder routes
app.use('/api/reminders', reminderRoutes);

// Quiz routes
app.use('/api/quiz', quizRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  
  // Initialize email service
  EmailService.initialize();
  console.log('📧 Email service initialized');
  
  // Check database connection
  const isDbConnected = await checkDatabaseConnection();
  if (isDbConnected) {
    console.log('✅ Database connected successfully');
    
    // Start cleanup jobs
    startCleanupJobs();
  } else {
    console.log('❌ Database connection failed - check your DATABASE_URL');
  }
});

/**
 * Start background cleanup jobs
 */
function startCleanupJobs() {
  // Clean up expired tokens every hour
  setInterval(async () => {
    try {
      await Promise.all([
        SessionService.cleanupExpiredBlacklistedTokens(),
        TokenService.cleanupExpiredTokens(),
      ]);
      console.log('🧹 Cleanup job completed');
    } catch (error) {
      console.error('❌ Cleanup job failed:', error);
    }
  }, 60 * 60 * 1000); // 1 hour

  console.log('🔄 Background cleanup jobs started');
}

export default app;