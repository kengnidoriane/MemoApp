import { PrismaClient } from '@prisma/client';
import { ExportFormat, ExportResult, ErrorCode } from '@memo-app/shared';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export class ExportService {
  private static readonly EXPORT_DIR = path.join(process.cwd(), 'exports');
  private static readonly EXPORT_EXPIRY_HOURS = 24;

  /**
   * Initialize export directory
   */
  static async initialize() {
    try {
      await fs.mkdir(this.EXPORT_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create export directory:', error);
    }
  }

  /**
   * Export user memos in specified format
   */
  static async exportUserMemos(
    userId: string, 
    format: ExportFormat
  ): Promise<ExportResult> {
    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) {
      throw {
        code: ErrorCode.NOT_FOUND,
        message: 'User not found',
      };
    }

    // Build query filters
    const whereClause: any = {
      userId,
      isDeleted: false,
    };

    if (format.dateRange) {
      whereClause.createdAt = {
        gte: new Date(format.dateRange.start),
        lte: new Date(format.dateRange.end),
      };
    }

    // Fetch memos with related data
    const memos = await prisma.memo.findMany({
      where: whereClause,
      include: {
        category: format.includeCategories ? {
          select: { name: true, color: true },
        } : false,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Generate export based on format
    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format.format) {
      case 'txt':
        content = this.generateTxtExport(memos, user, format);
        filename = `memos-export-${Date.now()}.txt`;
        mimeType = 'text/plain';
        break;
      
      case 'json':
        content = this.generateJsonExport(memos, user, format);
        filename = `memos-export-${Date.now()}.json`;
        mimeType = 'application/json';
        break;
      
      case 'pdf':
        // For now, we'll generate a simple text-based PDF content
        // In a real implementation, you'd use a library like puppeteer or pdfkit
        content = this.generatePdfContent(memos, user, format);
        filename = `memos-export-${Date.now()}.pdf`;
        mimeType = 'application/pdf';
        break;
      
      default:
        throw {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Unsupported export format',
        };
    }

    // Save file to export directory
    const fileId = uuidv4();
    const filePath = path.join(this.EXPORT_DIR, `${fileId}-${filename}`);
    
    await fs.writeFile(filePath, content, 'utf8');

    // Calculate file size
    const stats = await fs.stat(filePath);
    const size = stats.size;

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.EXPORT_EXPIRY_HOURS);

    return {
      downloadUrl: `/api/export/download/${fileId}-${filename}`,
      filename,
      size,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Generate TXT format export
   */
  private static generateTxtExport(
    memos: any[], 
    user: any, 
    format: ExportFormat
  ): string {
    let content = `MemoApp Export - ${user.name || user.email}\n`;
    content += `Generated: ${new Date().toISOString()}\n`;
    content += `Total Memos: ${memos.length}\n\n`;
    content += '='.repeat(50) + '\n\n';

    memos.forEach((memo, index) => {
      content += `${index + 1}. ${memo.title}\n`;
      content += `Created: ${memo.createdAt.toISOString()}\n`;
      
      if (format.includeCategories && memo.category) {
        content += `Category: ${memo.category.name}\n`;
      }
      
      if (format.includeTags && memo.tags.length > 0) {
        content += `Tags: ${memo.tags.join(', ')}\n`;
      }
      
      if (format.includeMetadata) {
        content += `Difficulty: ${memo.difficultyLevel}/5\n`;
        content += `Reviews: ${memo.reviewCount}\n`;
        if (memo.lastReviewedAt) {
          content += `Last Reviewed: ${memo.lastReviewedAt.toISOString()}\n`;
        }
      }
      
      content += '\nContent:\n';
      content += memo.content + '\n\n';
      content += '-'.repeat(30) + '\n\n';
    });

    return content;
  }

  /**
   * Generate JSON format export
   */
  private static generateJsonExport(
    memos: any[], 
    user: any, 
    format: ExportFormat
  ): string {
    const exportData = {
      exportInfo: {
        user: {
          email: user.email,
          name: user.name,
        },
        generatedAt: new Date().toISOString(),
        totalMemos: memos.length,
        format: format,
      },
      memos: memos.map(memo => {
        const exportMemo: any = {
          id: memo.id,
          title: memo.title,
          content: memo.content,
          createdAt: memo.createdAt.toISOString(),
          updatedAt: memo.updatedAt.toISOString(),
        };

        if (format.includeCategories && memo.category) {
          exportMemo.category = {
            name: memo.category.name,
            color: memo.category.color,
          };
        }

        if (format.includeTags) {
          exportMemo.tags = memo.tags;
        }

        if (format.includeMetadata) {
          exportMemo.metadata = {
            difficultyLevel: memo.difficultyLevel,
            reviewCount: memo.reviewCount,
            lastReviewedAt: memo.lastReviewedAt?.toISOString(),
            nextReviewAt: memo.nextReviewAt?.toISOString(),
            easeFactor: memo.easeFactor,
            intervalDays: memo.intervalDays,
            repetitions: memo.repetitions,
          };
        }

        return exportMemo;
      }),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Generate PDF content (simplified - in real implementation use proper PDF library)
   */
  private static generatePdfContent(
    memos: any[], 
    user: any, 
    format: ExportFormat
  ): string {
    // This is a simplified PDF content generation
    // In a real implementation, you would use a library like pdfkit or puppeteer
    return this.generateTxtExport(memos, user, format);
  }

  /**
   * Delete user account and all associated data (GDPR compliance)
   */
  static async deleteUserAccount(userId: string): Promise<void> {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw {
        code: ErrorCode.NOT_FOUND,
        message: 'User not found',
      };
    }

    // Delete all user data in correct order (respecting foreign key constraints)
    await prisma.$transaction(async (tx) => {
      // Delete quiz answers first
      await tx.quizAnswer.deleteMany({
        where: {
          session: {
            userId,
          },
        },
      });

      // Delete quiz sessions
      await tx.quizSession.deleteMany({
        where: { userId },
      });

      // Delete notification schedules
      await tx.notificationSchedule.deleteMany({
        where: { userId },
      });

      // Delete memos
      await tx.memo.deleteMany({
        where: { userId },
      });

      // Delete categories
      await tx.category.deleteMany({
        where: { userId },
      });

      // Delete password reset tokens
      await tx.passwordResetToken.deleteMany({
        where: { userId },
      });

      // Delete email verification tokens
      await tx.emailVerificationToken.deleteMany({
        where: { userId },
      });

      // Delete blacklisted tokens
      await tx.blacklistedToken.deleteMany({
        where: { userId },
      });

      // Delete sync logs
      await tx.syncLog.deleteMany({
        where: { userId },
      });

      // Delete offline changes
      await tx.offlineChange.deleteMany({
        where: { userId },
      });

      // Finally, delete the user
      await tx.user.delete({
        where: { id: userId },
      });
    });

    console.log(`User account ${userId} and all associated data deleted successfully`);
  }

  /**
   * Clean up expired export files
   */
  static async cleanupExpiredExports(): Promise<void> {
    try {
      const files = await fs.readdir(this.EXPORT_DIR);
      const now = Date.now();
      const expiryTime = this.EXPORT_EXPIRY_HOURS * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.EXPORT_DIR, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > expiryTime) {
          await fs.unlink(filePath);
          console.log(`Deleted expired export file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up expired exports:', error);
    }
  }

  /**
   * Get export file for download
   */
  static async getExportFile(filename: string): Promise<{ filePath: string; mimeType: string }> {
    const filePath = path.join(this.EXPORT_DIR, filename);
    
    try {
      await fs.access(filePath);
    } catch {
      throw {
        code: ErrorCode.NOT_FOUND,
        message: 'Export file not found or expired',
      };
    }

    // Determine MIME type based on extension
    const ext = path.extname(filename).toLowerCase();
    let mimeType = 'application/octet-stream';
    
    switch (ext) {
      case '.txt':
        mimeType = 'text/plain';
        break;
      case '.json':
        mimeType = 'application/json';
        break;
      case '.pdf':
        mimeType = 'application/pdf';
        break;
    }

    return { filePath, mimeType };
  }
}