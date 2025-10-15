import { PrismaClient } from '@prisma/client';
import { 
  SyncResult, 
  SyncEntity, 
  DataConflict, 
  OfflineChange, 
  ConflictResolution,
  BatchUpdateResult,
  Memo,
  Category
} from '@memo-app/shared';

const prisma = new PrismaClient();

export class SyncService {
  /**
   * Get incremental sync data for a user since last sync timestamp
   */
  static async getIncrementalSync(
    userId: string, 
    lastSyncTimestamp?: Date
  ): Promise<SyncResult> {
    const syncTimestamp = new Date();
    const whereClause = lastSyncTimestamp 
      ? { userId, updatedAt: { gt: lastSyncTimestamp } }
      : { userId };

    // Get updated memos (including soft-deleted ones)
    const updatedMemos = await prisma.memo.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'asc' }
    });

    // Get updated categories (including soft-deleted ones)
    const updatedCategories = await prisma.category.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'asc' }
    });

    // Separate deleted items
    const deletedMemoIds = updatedMemos
      .filter(memo => memo.isDeleted)
      .map(memo => memo.id);

    const deletedCategoryIds = updatedCategories
      .filter(category => category.isDeleted)
      .map(category => category.id);

    // Convert to sync entities (exclude deleted items from data)
    const memoSyncEntities: SyncEntity[] = updatedMemos
      .filter(memo => !memo.isDeleted)
      .map(memo => ({
        id: memo.id,
        updatedAt: memo.updatedAt,
        syncVersion: memo.syncVersion,
        data: this.memoToSyncData(memo)
      }));

    const categorySyncEntities: SyncEntity[] = updatedCategories
      .filter(category => !category.isDeleted)
      .map(category => ({
        id: category.id,
        updatedAt: category.updatedAt,
        syncVersion: category.syncVersion,
        data: this.categoryToSyncData(category)
      }));

    return {
      updatedMemos: memoSyncEntities,
      deletedMemoIds,
      updatedCategories: categorySyncEntities,
      deletedCategoryIds,
      conflicts: [], // Conflicts are detected during batch updates
      lastSyncTimestamp: syncTimestamp
    };
  }

  /**
   * Process batch updates from offline changes
   */
  static async processBatchUpdates(
    userId: string,
    changes: OfflineChange[]
  ): Promise<BatchUpdateResult> {
    const conflicts: DataConflict[] = [];
    const errors: Array<{ changeId: string; error: string }> = [];
    let processed = 0;

    for (const change of changes) {
      try {
        const conflict = await this.processOfflineChange(userId, change);
        if (conflict) {
          conflicts.push(conflict);
        } else {
          processed++;
        }
      } catch (error) {
        errors.push({
          changeId: change.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { processed, conflicts, errors };
  }

  /**
   * Process a single offline change and detect conflicts
   */
  private static async processOfflineChange(
    userId: string,
    change: OfflineChange
  ): Promise<DataConflict | null> {
    if (change.entity === 'memo') {
      return this.processMemoChange(userId, change);
    } else if (change.entity === 'category') {
      return this.processCategoryChange(userId, change);
    }
    
    throw new Error(`Unknown entity type: ${change.entity}`);
  }

  /**
   * Get base version of memo for three-way merge
   */
  private static async getMemoBaseVersion(memoId: string, syncVersion: number): Promise<any | null> {
    // In a real implementation, you'd store version history
    // For now, we'll use the previous sync version from sync logs
    const syncLog = await prisma.syncLog.findFirst({
      where: {
        entityType: 'memo',
        entityId: memoId,
        syncVersion: syncVersion - 1
      },
      orderBy: { timestamp: 'desc' }
    });
    
    if (!syncLog) {
      return null;
    }
    
    // In a full implementation, you'd store the actual data in the sync log
    // For now, return null to indicate no base version available
    return null;
  }

  /**
   * Get base version of category for three-way merge
   */
  private static async getCategoryBaseVersion(categoryId: string, syncVersion: number): Promise<any | null> {
    // Similar to memo base version
    const syncLog = await prisma.syncLog.findFirst({
      where: {
        entityType: 'category',
        entityId: categoryId,
        syncVersion: syncVersion - 1
      },
      orderBy: { timestamp: 'desc' }
    });
    
    if (!syncLog) {
      return null;
    }
    
    return null;
  }

  /**
   * Process memo changes and detect conflicts
   */
  private static async processMemoChange(
    userId: string,
    change: OfflineChange
  ): Promise<DataConflict | null> {
    const { type, data, timestamp } = change;

    if (type === 'create') {
      // For creates, check if memo already exists (duplicate ID scenario)
      const existing = await prisma.memo.findUnique({
        where: { id: data.id }
      });

      if (existing) {
        return this.createMemoConflict(data, existing, ['id']);
      }

      await prisma.memo.create({
        data: {
          ...data,
          userId,
          syncVersion: 1,
          isDeleted: false
        }
      });

      await this.logSyncOperation(userId, 'memo', data.id, 'create', 1);
      return null;
    }

    if (type === 'update') {
      const existing = await prisma.memo.findUnique({
        where: { id: data.id, userId }
      });

      if (!existing) {
        throw new Error(`Memo ${data.id} not found`);
      }

      // Check for conflicts based on sync version and timestamp
      const hasConflict = existing.updatedAt > timestamp || 
                         (data.syncVersion && existing.syncVersion > data.syncVersion);

      if (hasConflict) {
        // Get base version for three-way merge
        const baseVersion = await this.getMemoBaseVersion(data.id, Math.min(data.syncVersion || 0, existing.syncVersion));
        const conflictFields = this.detectMemoConflictFields(data, existing, baseVersion);
        
        if (conflictFields.length > 0) {
          return this.createMemoConflict(data, existing, conflictFields);
        } else if (baseVersion) {
          // No conflicts, perform automatic three-way merge
          const mergedData = this.performMemoThreeWayMerge(data, existing, baseVersion);
          Object.assign(data, mergedData);
        }
      }

      // No conflict, apply update
      const newSyncVersion = existing.syncVersion + 1;
      await prisma.memo.update({
        where: { id: data.id },
        data: {
          ...data,
          syncVersion: newSyncVersion,
          updatedAt: new Date()
        }
      });

      await this.logSyncOperation(userId, 'memo', data.id, 'update', newSyncVersion);
      return null;
    }

    if (type === 'delete') {
      const existing = await prisma.memo.findUnique({
        where: { id: data.id, userId }
      });

      if (!existing) {
        // Already deleted, no conflict
        return null;
      }

      // Soft delete
      const newSyncVersion = existing.syncVersion + 1;
      await prisma.memo.update({
        where: { id: data.id },
        data: {
          isDeleted: true,
          syncVersion: newSyncVersion,
          updatedAt: new Date()
        }
      });

      await this.logSyncOperation(userId, 'memo', data.id, 'delete', newSyncVersion);
      return null;
    }

    throw new Error(`Unknown operation type: ${type}`);
  }

  /**
   * Process category changes and detect conflicts
   */
  private static async processCategoryChange(
    userId: string,
    change: OfflineChange
  ): Promise<DataConflict | null> {
    const { type, data, timestamp } = change;

    if (type === 'create') {
      const existing = await prisma.category.findUnique({
        where: { id: data.id }
      });

      if (existing) {
        return this.createCategoryConflict(data, existing, ['id']);
      }

      await prisma.category.create({
        data: {
          ...data,
          userId,
          syncVersion: 1,
          isDeleted: false
        }
      });

      await this.logSyncOperation(userId, 'category', data.id, 'create', 1);
      return null;
    }

    if (type === 'update') {
      const existing = await prisma.category.findUnique({
        where: { id: data.id, userId }
      });

      if (!existing) {
        throw new Error(`Category ${data.id} not found`);
      }

      const hasConflict = existing.updatedAt > timestamp || 
                         (data.syncVersion && existing.syncVersion > data.syncVersion);

      if (hasConflict) {
        // Get base version for three-way merge
        const baseVersion = await this.getCategoryBaseVersion(data.id, Math.min(data.syncVersion || 0, existing.syncVersion));
        const conflictFields = this.detectCategoryConflictFields(data, existing, baseVersion);
        
        if (conflictFields.length > 0) {
          return this.createCategoryConflict(data, existing, conflictFields);
        } else if (baseVersion) {
          // No conflicts, perform automatic three-way merge
          const mergedData = this.performCategoryThreeWayMerge(data, existing, baseVersion);
          Object.assign(data, mergedData);
        }
      }

      const newSyncVersion = existing.syncVersion + 1;
      await prisma.category.update({
        where: { id: data.id },
        data: {
          ...data,
          syncVersion: newSyncVersion,
          updatedAt: new Date()
        }
      });

      await this.logSyncOperation(userId, 'category', data.id, 'update', newSyncVersion);
      return null;
    }

    if (type === 'delete') {
      const existing = await prisma.category.findUnique({
        where: { id: data.id, userId }
      });

      if (!existing) {
        return null;
      }

      const newSyncVersion = existing.syncVersion + 1;
      await prisma.category.update({
        where: { id: data.id },
        data: {
          isDeleted: true,
          syncVersion: newSyncVersion,
          updatedAt: new Date()
        }
      });

      await this.logSyncOperation(userId, 'category', data.id, 'delete', newSyncVersion);
      return null;
    }

    throw new Error(`Unknown operation type: ${type}`);
  }

  /**
   * Resolve conflicts based on user choice
   */
  static async resolveConflicts(
    userId: string,
    resolutions: ConflictResolution[]
  ): Promise<void> {
    for (const resolution of resolutions) {
      await this.resolveConflict(userId, resolution);
    }
  }

  /**
   * Resolve a single conflict
   */
  private static async resolveConflict(
    userId: string,
    resolution: ConflictResolution
  ): Promise<void> {
    // In a real implementation, you'd store conflicts temporarily
    // and resolve them based on the resolution strategy
    // For now, we'll implement a basic resolution mechanism
    
    if (resolution.resolution === 'merge' && resolution.mergedData) {
      // Apply merged data
      const { conflictId } = resolution;
      const [entityType, entityId] = conflictId.split(':');
      
      if (entityType === 'memo') {
        const existing = await prisma.memo.findUnique({
          where: { id: entityId, userId }
        });
        
        if (existing) {
          const newSyncVersion = existing.syncVersion + 1;
          await prisma.memo.update({
            where: { id: entityId },
            data: {
              ...resolution.mergedData,
              syncVersion: newSyncVersion,
              updatedAt: new Date()
            }
          });
          
          await this.logSyncOperation(userId, 'memo', entityId, 'update', newSyncVersion, true);
        }
      } else if (entityType === 'category') {
        const existing = await prisma.category.findUnique({
          where: { id: entityId, userId }
        });
        
        if (existing) {
          const newSyncVersion = existing.syncVersion + 1;
          await prisma.category.update({
            where: { id: entityId },
            data: {
              ...resolution.mergedData,
              syncVersion: newSyncVersion,
              updatedAt: new Date()
            }
          });
          
          await this.logSyncOperation(userId, 'category', entityId, 'update', newSyncVersion, true);
        }
      }
    }
  }

  /**
   * Detect conflicting fields between memo versions using three-way merge
   */
  private static detectMemoConflictFields(localMemo: any, serverMemo: any, baseMemo?: any): string[] {
    const conflicts: string[] = [];
    const fieldsToCheck = ['title', 'content', 'tags', 'categoryId'];
    
    for (const field of fieldsToCheck) {
      const localValue = JSON.stringify(localMemo[field]);
      const serverValue = JSON.stringify(serverMemo[field]);
      
      // If values are the same, no conflict
      if (localValue === serverValue) {
        continue;
      }
      
      // If we have a base version, perform three-way merge
      if (baseMemo) {
        const baseValue = JSON.stringify(baseMemo[field]);
        
        // If local changed but server didn't, use local
        if (localValue !== baseValue && serverValue === baseValue) {
          continue; // No conflict, local wins
        }
        
        // If server changed but local didn't, use server
        if (serverValue !== baseValue && localValue === baseValue) {
          continue; // No conflict, server wins
        }
        
        // Both changed differently from base - this is a conflict
        if (localValue !== baseValue && serverValue !== baseValue && localValue !== serverValue) {
          conflicts.push(field);
        }
      } else {
        // Without base version, any difference is a conflict
        conflicts.push(field);
      }
    }
    
    return conflicts;
  }

  /**
   * Detect conflicting fields between category versions using three-way merge
   */
  private static detectCategoryConflictFields(localCategory: any, serverCategory: any, baseCategory?: any): string[] {
    const conflicts: string[] = [];
    const fieldsToCheck = ['name', 'color'];
    
    for (const field of fieldsToCheck) {
      const localValue = localCategory[field];
      const serverValue = serverCategory[field];
      
      // If values are the same, no conflict
      if (localValue === serverValue) {
        continue;
      }
      
      // If we have a base version, perform three-way merge
      if (baseCategory) {
        const baseValue = baseCategory[field];
        
        // If local changed but server didn't, use local
        if (localValue !== baseValue && serverValue === baseValue) {
          continue; // No conflict, local wins
        }
        
        // If server changed but local didn't, use server
        if (serverValue !== baseValue && localValue === baseValue) {
          continue; // No conflict, server wins
        }
        
        // Both changed differently from base - this is a conflict
        if (localValue !== baseValue && serverValue !== baseValue && localValue !== serverValue) {
          conflicts.push(field);
        }
      } else {
        // Without base version, any difference is a conflict
        conflicts.push(field);
      }
    }
    
    return conflicts;
  }

  /**
   * Perform automatic three-way merge for memo data
   */
  private static performMemoThreeWayMerge(localMemo: any, serverMemo: any, baseMemo: any): any {
    const merged = { ...serverMemo }; // Start with server version
    const fieldsToMerge = ['title', 'content', 'tags', 'categoryId'];
    
    for (const field of fieldsToMerge) {
      const localValue = localMemo[field];
      const serverValue = serverMemo[field];
      const baseValue = baseMemo[field];
      
      // If local changed but server didn't, use local
      if (JSON.stringify(localValue) !== JSON.stringify(baseValue) && 
          JSON.stringify(serverValue) === JSON.stringify(baseValue)) {
        merged[field] = localValue;
      }
      
      // If server changed but local didn't, use server (already in merged)
      // If both changed the same way, use either (already in merged)
      // If both changed differently, this should have been caught as a conflict
    }
    
    return merged;
  }

  /**
   * Perform automatic three-way merge for category data
   */
  private static performCategoryThreeWayMerge(localCategory: any, serverCategory: any, baseCategory: any): any {
    const merged = { ...serverCategory }; // Start with server version
    const fieldsToMerge = ['name', 'color'];
    
    for (const field of fieldsToMerge) {
      const localValue = localCategory[field];
      const serverValue = serverCategory[field];
      const baseValue = baseCategory[field];
      
      // If local changed but server didn't, use local
      if (localValue !== baseValue && serverValue === baseValue) {
        merged[field] = localValue;
      }
      
      // If server changed but local didn't, use server (already in merged)
      // If both changed the same way, use either (already in merged)
      // If both changed differently, this should have been caught as a conflict
    }
    
    return merged;
  }

  /**
   * Create a memo conflict object
   */
  private static createMemoConflict(
    localVersion: any, 
    serverVersion: any, 
    conflictFields: string[]
  ): DataConflict {
    return {
      id: `memo:${localVersion.id}`,
      type: 'memo',
      localVersion,
      serverVersion: this.memoToSyncData(serverVersion),
      conflictFields,
      localSyncVersion: localVersion.syncVersion || 0,
      serverSyncVersion: serverVersion.syncVersion
    };
  }

  /**
   * Create a category conflict object
   */
  private static createCategoryConflict(
    localVersion: any, 
    serverVersion: any, 
    conflictFields: string[]
  ): DataConflict {
    return {
      id: `category:${localVersion.id}`,
      type: 'category',
      localVersion,
      serverVersion: this.categoryToSyncData(serverVersion),
      conflictFields,
      localSyncVersion: localVersion.syncVersion || 0,
      serverSyncVersion: serverVersion.syncVersion
    };
  }

  /**
   * Convert memo to sync data format
   */
  private static memoToSyncData(memo: any): Memo {
    return {
      id: memo.id,
      title: memo.title,
      content: memo.content,
      tags: memo.tags,
      categoryId: memo.categoryId,
      userId: memo.userId,
      createdAt: memo.createdAt,
      updatedAt: memo.updatedAt,
      lastReviewedAt: memo.lastReviewedAt,
      reviewCount: memo.reviewCount,
      difficultyLevel: memo.difficultyLevel,
      easeFactor: memo.easeFactor,
      intervalDays: memo.intervalDays,
      repetitions: memo.repetitions,
      nextReviewAt: memo.nextReviewAt,
      syncVersion: memo.syncVersion,
      isDeleted: memo.isDeleted
    };
  }

  /**
   * Convert category to sync data format
   */
  private static categoryToSyncData(category: any): Category {
    return {
      id: category.id,
      name: category.name,
      color: category.color,
      userId: category.userId,
      memoCount: 0, // Will be calculated on client side
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      syncVersion: category.syncVersion,
      isDeleted: category.isDeleted
    };
  }

  /**
   * Log sync operation for audit trail
   */
  private static async logSyncOperation(
    userId: string,
    entityType: string,
    entityId: string,
    operation: string,
    syncVersion: number,
    conflictResolved: boolean = false
  ): Promise<void> {
    await prisma.syncLog.create({
      data: {
        userId,
        entityType,
        entityId,
        operation,
        syncVersion,
        conflictResolved
      }
    });
  }

  /**
   * Clean up old sync logs (keep last 30 days)
   */
  static async cleanupSyncLogs(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await prisma.syncLog.deleteMany({
      where: {
        timestamp: {
          lt: thirtyDaysAgo
        }
      }
    });
  }

  /**
   * Get sync statistics for a user
   */
  static async getSyncStats(userId: string): Promise<{
    totalSyncs: number;
    lastSyncAt?: Date;
    conflictsResolved: number;
  }> {
    const stats = await prisma.syncLog.aggregate({
      where: { userId },
      _count: { id: true },
      _max: { timestamp: true }
    });

    const conflictsResolved = await prisma.syncLog.count({
      where: { userId, conflictResolved: true }
    });

    return {
      totalSyncs: stats._count.id || 0,
      lastSyncAt: stats._max.timestamp || undefined,
      conflictsResolved
    };
  }

  /**
   * Automatically resolve conflicts that can be merged without user intervention
   */
  static async autoResolveConflicts(userId: string): Promise<{
    resolved: number;
    remainingConflicts: number;
  }> {
    // Get pending offline changes that might have conflicts
    const pendingChanges = await prisma.offlineChange.findMany({
      where: { userId, processed: false },
      orderBy: { timestamp: 'asc' }
    });

    let resolved = 0;
    const remainingConflicts: DataConflict[] = [];

    for (const change of pendingChanges) {
      try {
        // Convert database change to OfflineChange format
        const offlineChange: OfflineChange = {
          id: change.id,
          type: change.operation as 'create' | 'update' | 'delete',
          entity: change.entityType as 'memo' | 'category',
          data: change.data,
          timestamp: change.timestamp,
          clientId: undefined
        };
        
        const conflict = await this.processOfflineChange(userId, offlineChange);
        
        if (!conflict) {
          // Successfully processed without conflict
          resolved++;
          await prisma.offlineChange.update({
            where: { id: change.id },
            data: { processed: true }
          });
        } else {
          // Still has conflicts that need user intervention
          remainingConflicts.push(conflict);
        }
      } catch (error) {
        console.error(`Failed to auto-resolve change ${change.id}:`, error);
      }
    }

    return {
      resolved,
      remainingConflicts: remainingConflicts.length
    };
  }

  /**
   * Get sync status for user entities
   */
  static async getSyncStatus(userId: string): Promise<{
    memos: Array<{ id: string; syncVersion: number; lastSyncAt?: Date; hasConflicts: boolean }>;
    categories: Array<{ id: string; syncVersion: number; lastSyncAt?: Date; hasConflicts: boolean }>;
    pendingChanges: number;
  }> {
    // Get memo sync status
    const memos = await prisma.memo.findMany({
      where: { userId, isDeleted: false },
      select: { id: true, syncVersion: true, updatedAt: true }
    });

    // Get category sync status
    const categories = await prisma.category.findMany({
      where: { userId, isDeleted: false },
      select: { id: true, syncVersion: true, updatedAt: true }
    });

    // Get last sync times for each entity
    const memoSyncTimes = await prisma.syncLog.groupBy({
      by: ['entityId'],
      where: { userId, entityType: 'memo' },
      _max: { timestamp: true }
    });

    const categorySyncTimes = await prisma.syncLog.groupBy({
      by: ['entityId'],
      where: { userId, entityType: 'category' },
      _max: { timestamp: true }
    });

    // Check for pending offline changes
    const pendingChanges = await prisma.offlineChange.count({
      where: { userId, processed: false }
    });

    // Create sync time lookup maps
    const memoSyncTimeMap = new Map(
      memoSyncTimes.map(item => [item.entityId, item._max.timestamp])
    );
    const categorySyncTimeMap = new Map(
      categorySyncTimes.map(item => [item.entityId, item._max.timestamp])
    );

    return {
      memos: memos.map(memo => ({
        id: memo.id,
        syncVersion: memo.syncVersion,
        lastSyncAt: memoSyncTimeMap.get(memo.id) || undefined,
        hasConflicts: false // TODO: Check for unresolved conflicts
      })),
      categories: categories.map(category => ({
        id: category.id,
        syncVersion: category.syncVersion,
        lastSyncAt: categorySyncTimeMap.get(category.id) || undefined,
        hasConflicts: false // TODO: Check for unresolved conflicts
      })),
      pendingChanges
    };
  }
}