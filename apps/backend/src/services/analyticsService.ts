import { PrismaClient } from '@prisma/client';
import { 
  UserAnalytics, 
  ActivityTrend, 
  LearningMetrics, 
  AnalyticsDashboard 
} from '@memo-app/shared';

const prisma = new PrismaClient();

export class AnalyticsService {
  /**
   * Get comprehensive analytics dashboard for a user
   */
  static async getDashboard(userId: string): Promise<AnalyticsDashboard> {
    const [userAnalytics, activityTrends, learningMetrics] = await Promise.all([
      this.getUserAnalytics(userId),
      this.getActivityTrends(userId, 30), // Last 30 days
      this.getLearningMetrics(userId),
    ]);

    return {
      userAnalytics,
      activityTrends,
      learningMetrics,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get basic user statistics
   */
  static async getUserAnalytics(userId: string): Promise<UserAnalytics> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get basic counts
    const [
      totalMemos,
      totalCategories,
      totalQuizSessions,
      memosCreatedThisWeek,
      memosCreatedThisMonth,
      quizzesThisWeek,
      quizzesThisMonth,
      reviewsThisWeek,
      reviewsThisMonth,
      quizScoreData,
      streakData,
    ] = await Promise.all([
      // Total memos (not deleted)
      prisma.memo.count({
        where: { userId, isDeleted: false },
      }),

      // Total categories (not deleted)
      prisma.category.count({
        where: { userId, isDeleted: false },
      }),

      // Total quiz sessions
      prisma.quizSession.count({
        where: { userId },
      }),

      // Memos created this week
      prisma.memo.count({
        where: {
          userId,
          isDeleted: false,
          createdAt: { gte: weekAgo },
        },
      }),

      // Memos created this month
      prisma.memo.count({
        where: {
          userId,
          isDeleted: false,
          createdAt: { gte: monthAgo },
        },
      }),

      // Quizzes completed this week
      prisma.quizSession.count({
        where: {
          userId,
          status: 'completed',
          completedAt: { gte: weekAgo },
        },
      }),

      // Quizzes completed this month
      prisma.quizSession.count({
        where: {
          userId,
          status: 'completed',
          completedAt: { gte: monthAgo },
        },
      }),

      // Reviews this week (memos with lastReviewedAt in the last week)
      prisma.memo.count({
        where: {
          userId,
          isDeleted: false,
          lastReviewedAt: { gte: weekAgo },
        },
      }),

      // Reviews this month
      prisma.memo.count({
        where: {
          userId,
          isDeleted: false,
          lastReviewedAt: { gte: monthAgo },
        },
      }),

      // Average quiz score
      prisma.quizSession.aggregate({
        where: {
          userId,
          status: 'completed',
          totalQuestions: { gt: 0 },
        },
        _avg: {
          correctAnswers: true,
        },
        _sum: {
          totalQuestions: true,
        },
      }),

      // Get user creation date for streak calculation
      prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true },
      }),
    ]);

    // Calculate average quiz score as percentage
    let averageQuizScore = 0;
    if (quizScoreData._sum.totalQuestions && quizScoreData._avg.correctAnswers) {
      averageQuizScore = (quizScoreData._avg.correctAnswers / quizScoreData._sum.totalQuestions) * 100;
    }

    // Calculate total reviews (sum of all memo review counts)
    const totalReviewsData = await prisma.memo.aggregate({
      where: { userId, isDeleted: false },
      _sum: { reviewCount: true },
    });
    const totalReviews = totalReviewsData._sum.reviewCount || 0;

    // Calculate streak days (simplified - days since account creation with activity)
    const streakDays = streakData 
      ? Math.floor((now.getTime() - streakData.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      totalMemos,
      totalCategories,
      totalQuizSessions,
      totalReviews,
      averageQuizScore: Math.round(averageQuizScore * 100) / 100, // Round to 2 decimal places
      streakDays,
      memosCreatedThisWeek,
      memosCreatedThisMonth,
      quizzesCompletedThisWeek: quizzesThisWeek,
      quizzesCompletedThisMonth: quizzesThisMonth,
      reviewsThisWeek,
      reviewsThisMonth,
    };
  }

  /**
   * Get activity trends over time
   */
  static async getActivityTrends(userId: string, days: number = 30): Promise<ActivityTrend[]> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Generate array of dates
    const dateArray: Date[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dateArray.push(new Date(d));
    }

    // Get daily memo creation counts
    const memoCreationData = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM memos 
      WHERE user_id = ${userId} 
        AND is_deleted = false
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    // Get daily quiz completion counts
    const quizCompletionData = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        DATE(completed_at) as date,
        COUNT(*) as count
      FROM quiz_sessions 
      WHERE user_id = ${userId} 
        AND status = 'completed'
        AND completed_at >= ${startDate}
        AND completed_at <= ${endDate}
      GROUP BY DATE(completed_at)
      ORDER BY date
    `;

    // Get daily review counts
    const reviewData = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        DATE(last_reviewed_at) as date,
        COUNT(*) as count
      FROM memos 
      WHERE user_id = ${userId} 
        AND is_deleted = false
        AND last_reviewed_at >= ${startDate}
        AND last_reviewed_at <= ${endDate}
      GROUP BY DATE(last_reviewed_at)
      ORDER BY date
    `;

    // Convert to maps for easy lookup
    const memoMap = new Map(memoCreationData.map(item => [item.date, Number(item.count)]));
    const quizMap = new Map(quizCompletionData.map(item => [item.date, Number(item.count)]));
    const reviewMap = new Map(reviewData.map(item => [item.date, Number(item.count)]));

    // Build activity trends array
    return dateArray.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      return {
        date: dateStr,
        memosCreated: memoMap.get(dateStr) || 0,
        quizzesCompleted: quizMap.get(dateStr) || 0,
        reviewsCompleted: reviewMap.get(dateStr) || 0,
      };
    });
  }

  /**
   * Get learning metrics and progress
   */
  static async getLearningMetrics(userId: string): Promise<LearningMetrics> {
    const now = new Date();

    // Get difficulty distribution
    const difficultyDistribution = await prisma.memo.groupBy({
      by: ['difficultyLevel'],
      where: { userId, isDeleted: false },
      _count: { difficultyLevel: true },
    });

    // Get memos needing review (nextReviewAt is in the past or null)
    const memosNeedingReview = await prisma.memo.count({
      where: {
        userId,
        isDeleted: false,
        OR: [
          { nextReviewAt: { lte: now } },
          { nextReviewAt: null },
        ],
      },
    });

    // Get total memos in review system (have been reviewed at least once)
    const totalMemosInReview = await prisma.memo.count({
      where: {
        userId,
        isDeleted: false,
        reviewCount: { gt: 0 },
      },
    });

    // Calculate retention rates by difficulty
    const retentionData = await prisma.$queryRaw<Array<{
      difficulty_level: number;
      total_answers: bigint;
      correct_answers: bigint;
    }>>`
      SELECT 
        m.difficulty_level,
        COUNT(qa.id) as total_answers,
        SUM(CASE WHEN qa.remembered = true THEN 1 ELSE 0 END) as correct_answers
      FROM memos m
      LEFT JOIN quiz_answers qa ON m.id = qa.memo_id
      WHERE m.user_id = ${userId} 
        AND m.is_deleted = false
        AND qa.id IS NOT NULL
      GROUP BY m.difficulty_level
    `;

    // Build difficulty distribution object
    const difficultyDist = {
      level1: 0,
      level2: 0,
      level3: 0,
      level4: 0,
      level5: 0,
    };

    difficultyDistribution.forEach(item => {
      const key = `level${item.difficultyLevel}` as keyof typeof difficultyDist;
      difficultyDist[key] = item._count.difficultyLevel;
    });

    // Build retention by difficulty object
    const retentionByDifficulty = {
      level1: 0,
      level2: 0,
      level3: 0,
      level4: 0,
      level5: 0,
    };

    retentionData.forEach(item => {
      const key = `level${item.difficulty_level}` as keyof typeof retentionByDifficulty;
      const totalAnswers = Number(item.total_answers);
      const correctAnswers = Number(item.correct_answers);
      
      if (totalAnswers > 0) {
        retentionByDifficulty[key] = Math.round((correctAnswers / totalAnswers) * 100);
      }
    });

    // Calculate overall retention rate
    const totalAnswers = retentionData.reduce((sum, item) => sum + Number(item.total_answers), 0);
    const totalCorrect = retentionData.reduce((sum, item) => sum + Number(item.correct_answers), 0);
    const averageRetentionRate = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;

    return {
      totalMemosInReview,
      memosNeedingReview,
      averageRetentionRate,
      difficultyDistribution: difficultyDist,
      retentionByDifficulty,
    };
  }
}