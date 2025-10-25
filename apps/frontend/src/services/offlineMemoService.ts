import { memoService } from './memoService';
import { indexedDBManager } from '../lib/indexedDB';
import { useSyncStore } from '../stores/syncStore';
import { useOffline } from '../hooks/useOffline';
import type { 
  Memo, 
  CreateMemoRequest, 
  UpdateMemoRequest
} from '@memo-app/shared/types';

/**
 * Offline-aware memo service that handles both online and offline operations
 */
export class OfflineMemoService {
  private static instance: OfflineMemoService;

  static getInstance(): OfflineMemoService {
    if (!OfflineMemoService.instance) {
      OfflineMemoService.instance = new OfflineMemoService();
    }
    return OfflineMemoService.instance;
  }

  /**
   * Create a memo - works offline and online
   */
  async createMemo(memoData: CreateMemoRequest): Promise<Memo> {
    const { isOnline } = useOffline();
    
    if (isOnline) {
      try {
        // Try to create online first
        const memo = await memoService.createMemo(memoData);
        // Save to IndexedDB as synced
        await indexedDBManager.saveMemo(memo, 'synced');
        return memo;
      } catch (error) {
        // If online creation fails, fall back to offline
        console.warn('Online memo creation failed, falling back to offline:', error);
      }
    }

    // Create offline - add missing fields for Memo type
    const offlineMemoData = {
      ...memoData,
      tags: memoData.tags || [],
      userId: 'current-user', // This would come from auth context
      reviewCount: 0,
      difficultyLevel: 3,
      easeFactor: 2.5,
      intervalDays: 1,
      repetitions: 0,
      syncVersion: 0,
      isDeleted: false,
    };
    
    const offlineMemo = await indexedDBManager.createMemoOffline(offlineMemoData);
    
    // Add to sync queue
    const syncStore = useSyncStore.getState();
    syncStore.addOfflineChange({
      type: 'create',
      entity: 'memo',
      data: offlineMemo,
    });

    return offlineMemo;
  }

  /**
   * Update a memo - works offline and online
   */
  async updateMemo(id: string, updates: UpdateMemoRequest): Promise<Memo> {
    const { isOnline } = useOffline();
    
    // Get current memo from IndexedDB
    let currentMemo = await indexedDBManager.getMemo(id);
    
    if (!currentMemo) {
      throw new Error('Memo not found');
    }

    // Create updated memo
    const updatedMemo: Memo = {
      ...currentMemo,
      ...updates,
      updatedAt: new Date(),
    };

    if (isOnline && !id.startsWith('temp-')) {
      try {
        // Try to update online first
        const serverMemo = await memoService.updateMemo(id, updates);
        // Save to IndexedDB as synced
        await indexedDBManager.saveMemo(serverMemo, 'synced');
        return serverMemo;
      } catch (error) {
        console.warn('Online memo update failed, falling back to offline:', error);
      }
    }

    // Update offline
    await indexedDBManager.saveMemo(updatedMemo, 'pending');
    
    // Add to sync queue
    const syncStore = useSyncStore.getState();
    syncStore.addOfflineChange({
      type: 'update',
      entity: 'memo',
      data: updatedMemo,
    });

    return updatedMemo;
  }

  /**
   * Delete a memo - works offline and online
   */
  async deleteMemo(id: string): Promise<void> {
    const { isOnline } = useOffline();
    
    if (isOnline && !id.startsWith('temp-')) {
      try {
        // Try to delete online first
        await memoService.deleteMemo(id);
        // Remove from IndexedDB
        await indexedDBManager.deleteMemo(id);
        return;
      } catch (error) {
        console.warn('Online memo deletion failed, falling back to offline:', error);
      }
    }

    // Delete offline
    await indexedDBManager.deleteMemo(id);
    
    // Add to sync queue (unless it's a temp memo)
    if (!id.startsWith('temp-')) {
      const syncStore = useSyncStore.getState();
      syncStore.addOfflineChange({
        type: 'delete',
        entity: 'memo',
        data: { id },
      });
    }
  }

  /**
   * Get all memos - prioritizes local data for better performance
   */
  async getMemos(): Promise<Memo[]> {
    const { isOnline } = useOffline();
    
    // Always return local data first for better UX
    const localMemos = await indexedDBManager.getAllMemos();
    
    // If online, try to sync in background
    if (isOnline) {
      this.backgroundSync().catch(error => {
        console.warn('Background sync failed:', error);
      });
    }
    
    return localMemos.map(memo => ({
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
      nextReviewAt: memo.nextReviewAt,
      easeFactor: memo.easeFactor || 2.5,
      intervalDays: memo.intervalDays || 1,
      repetitions: memo.repetitions || 0,
      syncVersion: memo.syncVersion || 0,
      isDeleted: memo.isDeleted || false,
    }));
  }

  /**
   * Get a single memo by ID
   */
  async getMemo(id: string): Promise<Memo | null> {
    const memo = await indexedDBManager.getMemo(id);
    
    if (!memo) {
      return null;
    }

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
      nextReviewAt: memo.nextReviewAt,
      easeFactor: memo.easeFactor || 2.5,
      intervalDays: memo.intervalDays || 1,
      repetitions: memo.repetitions || 0,
      syncVersion: memo.syncVersion || 0,
      isDeleted: memo.isDeleted || false,
    };
  }

  /**
   * Search memos locally
   */
  async searchMemos(query: string): Promise<Memo[]> {
    const allMemos = await this.getMemos();
    
    if (!query.trim()) {
      return allMemos;
    }

    const searchTerm = query.toLowerCase();
    
    return allMemos.filter(memo => 
      memo.title.toLowerCase().includes(searchTerm) ||
      memo.content.toLowerCase().includes(searchTerm) ||
      memo.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get memos by category
   */
  async getMemosByCategory(categoryId: string): Promise<Memo[]> {
    const memos = await indexedDBManager.getMemosByCategory(categoryId);
    
    return memos.map(memo => ({
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
      nextReviewAt: memo.nextReviewAt,
      easeFactor: memo.easeFactor || 2.5,
      intervalDays: memo.intervalDays || 1,
      repetitions: memo.repetitions || 0,
      syncVersion: memo.syncVersion || 0,
      isDeleted: memo.isDeleted || false,
    }));
  }

  /**
   * Get sync status for UI indicators
   */
  async getSyncStatus(): Promise<{
    pendingCount: number;
    conflictCount: number;
    hasOfflineChanges: boolean;
  }> {
    const [pendingItems, conflictItems, hasChanges] = await Promise.all([
      indexedDBManager.getPendingItems(),
      indexedDBManager.getConflictItems(),
      indexedDBManager.hasOfflineChanges(),
    ]);

    return {
      pendingCount: pendingItems.memos.length,
      conflictCount: conflictItems.memos.length,
      hasOfflineChanges: hasChanges,
    };
  }

  /**
   * Background sync when online
   */
  private async backgroundSync(): Promise<void> {
    // This would trigger the sync manager
    // Implementation depends on sync strategy
    console.log('Background sync triggered');
  }

  /**
   * Force sync all data
   */
  async forceSync(): Promise<void> {
    const { isOnline } = useOffline();
    
    if (!isOnline) {
      throw new Error('Cannot sync while offline');
    }

    // This would be handled by the sync manager
    // For now, just log
    console.log('Force sync requested');
  }
}

// Export singleton instance
export const offlineMemoService = OfflineMemoService.getInstance();