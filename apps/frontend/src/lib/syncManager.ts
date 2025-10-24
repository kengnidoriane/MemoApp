import { useSyncStore } from '../stores/syncStore';
import { useMemoStore } from '../stores/memoStore';
import { useAuthStore } from '../stores/authStore';
import { api } from './api';
import { handleSyncError } from './errorHandler';
import type { Memo, Category } from '@memo-app/shared/types';

interface SyncResult {
  success: boolean;
  synced: number;
  conflicts: number;
  errors: string[];
}

/**
 * Manages data synchronization between client and server
 */
export class SyncManager {
  private static instance: SyncManager;
  private syncInterval: NodeJS.Timeout | null = null;
  private isDestroyed = false;

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  /**
   * Initialize sync manager with auto-sync
   */
  initialize(): void {
    if (this.isDestroyed) return;

    const { autoSyncEnabled, syncInterval } = useSyncStore.getState();
    
    if (autoSyncEnabled) {
      this.startAutoSync(syncInterval);
    }

    // Listen for online status changes
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  /**
   * Cleanup sync manager
   */
  destroy(): void {
    this.isDestroyed = true;
    this.stopAutoSync();
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  /**
   * Start automatic synchronization
   */
  startAutoSync(interval: number): void {
    this.stopAutoSync();
    
    if (this.isDestroyed) return;

    this.syncInterval = setInterval(() => {
      if (navigator.onLine && useAuthStore.getState().isAuthenticated) {
        this.syncData().catch((error) => {
          handleSyncError(error, { showToast: false });
        });
      }
    }, interval);
  }

  /**
   * Stop automatic synchronization
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Perform full data synchronization
   */
  async syncData(): Promise<SyncResult> {
    const syncStore = useSyncStore.getState();
    const authStore = useAuthStore.getState();

    if (!navigator.onLine) {
      throw new Error('Cannot sync while offline');
    }

    if (!authStore.isAuthenticated) {
      throw new Error('Cannot sync without authentication');
    }

    if (syncStore.isSyncing) {
      return { success: false, synced: 0, conflicts: 0, errors: ['Sync already in progress'] };
    }

    syncStore.setSyncing(true);
    syncStore.setSyncProgress(0);

    try {
      const result: SyncResult = {
        success: true,
        synced: 0,
        conflicts: 0,
        errors: [],
      };

      // Step 1: Push offline changes (25% progress)
      await this.pushOfflineChanges();
      syncStore.setSyncProgress(25);

      // Step 2: Pull server changes (50% progress)
      const pullResult = await this.pullServerChanges();
      result.synced += pullResult.synced;
      result.conflicts += pullResult.conflicts;
      result.errors.push(...pullResult.errors);
      syncStore.setSyncProgress(75);

      // Step 3: Resolve conflicts if any (100% progress)
      if (result.conflicts > 0) {
        // Conflicts will be handled by user interaction
        // For now, just mark them in the store
      }

      syncStore.setSyncProgress(100);
      syncStore.setLastSyncAt(new Date());
      
      return result;
    } catch (error) {
      handleSyncError(error, { showToast: false });
      return {
        success: false,
        synced: 0,
        conflicts: 0,
        errors: [error instanceof Error ? error.message : 'Sync failed'],
      };
    } finally {
      syncStore.setSyncing(false);
    }
  }

  /**
   * Push offline changes to server
   */
  private async pushOfflineChanges(): Promise<void> {
    const syncStore = useSyncStore.getState();
    const { offlineChanges } = syncStore;

    if (offlineChanges.length === 0) return;

    const failedChanges: typeof offlineChanges = [];

    for (const change of offlineChanges) {
      try {
        await this.pushSingleChange(change);
        syncStore.removeOfflineChange(change.id);
      } catch (error) {
        // Increment retry count and keep for later
        syncStore.incrementRetryCount(change.id);
        
        // Remove changes that have failed too many times
        if (change.retryCount >= 3) {
          syncStore.removeOfflineChange(change.id);
          syncStore.addSyncError(`Failed to sync ${change.type} ${change.entity} after 3 attempts`);
        } else {
          failedChanges.push(change);
        }
      }
    }
  }

  /**
   * Push a single offline change to server
   */
  private async pushSingleChange(change: any): Promise<void> {
    const { type, entity, data } = change;

    switch (entity) {
      case 'memo':
        if (type === 'create') {
          await api.post<Memo>('/memos', data);
        } else if (type === 'update') {
          await api.put<Memo>(`/memos/${data.id}`, data);
        } else if (type === 'delete') {
          await api.delete(`/memos/${data.id}`);
        }
        break;
        
      case 'category':
        if (type === 'create') {
          await api.post<Category>('/categories', data);
        } else if (type === 'update') {
          await api.put<Category>(`/categories/${data.id}`, data);
        } else if (type === 'delete') {
          await api.delete(`/categories/${data.id}`);
        }
        break;
        
      default:
        throw new Error(`Unknown entity type: ${entity}`);
    }
  }

  /**
   * Pull changes from server
   */
  private async pullServerChanges(): Promise<{ synced: number; conflicts: number; errors: string[] }> {
    const syncStore = useSyncStore.getState();
    const memoStore = useMemoStore.getState();
    const { lastSyncAt } = syncStore;

    try {
      // Get incremental sync data
      const response = await api.get<{
        memos: Memo[];
        categories: Category[];
        deletedMemoIds: string[];
        deletedCategoryIds: string[];
        conflicts: any[];
      }>('/sync', {
        since: lastSyncAt?.toISOString(),
      });

      const syncData = response.data;
      if (!syncData) {
        throw new Error('No sync data received');
      }
      
      const { memos, categories, deletedMemoIds, deletedCategoryIds, conflicts } = syncData;

      // Update memos
      const currentMemos = memoStore.memos;
      const updatedMemos = [...currentMemos];

      // Add/update memos from server
      memos.forEach((serverMemo: Memo) => {
        const existingIndex = updatedMemos.findIndex(m => m.id === serverMemo.id);
        if (existingIndex >= 0) {
          updatedMemos[existingIndex] = serverMemo;
        } else {
          updatedMemos.push(serverMemo);
        }
      });

      // Remove deleted memos
      deletedMemoIds.forEach((id: string) => {
        const index = updatedMemos.findIndex(m => m.id === id);
        if (index >= 0) {
          updatedMemos.splice(index, 1);
        }
      });

      memoStore.setMemos(updatedMemos);

      // Update categories
      const currentCategories = memoStore.categories;
      const updatedCategories = [...currentCategories];

      // Add/update categories from server
      categories.forEach((serverCategory: Category) => {
        const existingIndex = updatedCategories.findIndex(c => c.id === serverCategory.id);
        if (existingIndex >= 0) {
          updatedCategories[existingIndex] = serverCategory;
        } else {
          updatedCategories.push(serverCategory);
        }
      });

      // Remove deleted categories
      deletedCategoryIds.forEach((id: string) => {
        const index = updatedCategories.findIndex(c => c.id === id);
        if (index >= 0) {
          updatedCategories.splice(index, 1);
        }
      });

      memoStore.setCategories(updatedCategories);

      // Handle conflicts
      conflicts.forEach((conflict: any) => {
        syncStore.addConflict({
          id: `conflict-${Date.now()}-${Math.random()}`,
          type: conflict.type,
          localVersion: conflict.local,
          serverVersion: conflict.server,
          timestamp: new Date(),
        });
      });

      return {
        synced: memos.length + categories.length,
        conflicts: conflicts.length,
        errors: [],
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    const syncStore = useSyncStore.getState();
    syncStore.setOnlineStatus(true);

    // Auto-sync when coming back online
    if (syncStore.autoSyncEnabled && useAuthStore.getState().isAuthenticated) {
      setTimeout(() => {
        this.syncData().catch((error) => {
          handleSyncError(error, { showToast: false });
        });
      }, 1000); // Wait 1 second to ensure connection is stable
    }
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    const syncStore = useSyncStore.getState();
    syncStore.setOnlineStatus(false);
  };

  /**
   * Queue an offline change
   */
  queueOfflineChange(type: 'create' | 'update' | 'delete', entity: 'memo' | 'category', data: any): void {
    const syncStore = useSyncStore.getState();
    syncStore.addOfflineChange({ type, entity, data });
  }

  /**
   * Resolve a sync conflict
   */
  async resolveConflict(conflictId: string, resolution: 'local' | 'server' | 'merge', mergedData?: any): Promise<void> {
    const syncStore = useSyncStore.getState();
    const { conflicts } = syncStore;
    
    const conflict = conflicts.find(c => c.id === conflictId);
    if (!conflict) {
      throw new Error('Conflict not found');
    }

    try {
      let resolvedData;
      
      switch (resolution) {
        case 'local':
          resolvedData = conflict.localVersion;
          break;
        case 'server':
          resolvedData = conflict.serverVersion;
          break;
        case 'merge':
          resolvedData = mergedData || conflict.localVersion;
          break;
        default:
          throw new Error('Invalid resolution type');
      }

      // Send resolution to server
      await api.post('/sync/resolve-conflict', {
        conflictId,
        resolution,
        data: resolvedData,
      });

      // Remove conflict from store
      syncStore.removeConflict(conflictId);

      // Update local data
      if (conflict.type === 'memo') {
        useMemoStore.getState().updateMemo(resolvedData.id, resolvedData);
      } else if (conflict.type === 'category') {
        useMemoStore.getState().updateCategory(resolvedData.id, resolvedData);
      }
    } catch (error) {
      handleSyncError(error);
      throw error;
    }
  }
}

// Export singleton instance
export const syncManager = SyncManager.getInstance();