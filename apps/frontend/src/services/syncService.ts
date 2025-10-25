import { api } from '../lib/api';
import type { 
  SyncRequest,
  SyncResult,
  DataConflict,
  ConflictResolution,
  BatchUpdateRequest,
  BatchUpdateResult,
  SyncStatus
} from '@memo-app/shared/types';

export const syncService = {
  // Main sync operations
  syncData: async (request: SyncRequest): Promise<SyncResult> => {
    const response = await api.post<{ data: SyncResult }>('/sync', request);
    return response.data?.data || { updatedMemos: [], deletedMemoIds: [], updatedCategories: [], deletedCategoryIds: [], conflicts: [], lastSyncTimestamp: new Date() };
  },

  getSyncStatus: async (): Promise<SyncStatus> => {
    const response = await api.get<{ data: SyncStatus }>('/sync/status');
    return response.data?.data || { memos: [], categories: [], pendingChanges: 0 };
  },

  // Conflict resolution
  resolveConflicts: async (resolutions: ConflictResolution[]): Promise<void> => {
    await api.post('/sync/resolve-conflicts', { resolutions });
  },

  getConflicts: async (): Promise<DataConflict[]> => {
    const response = await api.get<{ data: DataConflict[] }>('/sync/conflicts');
    return response.data?.data || [];
  },

  // Batch operations for offline changes
  batchUpdate: async (request: BatchUpdateRequest): Promise<BatchUpdateResult> => {
    const response = await api.post<{ data: BatchUpdateResult }>('/sync/batch', request);
    return response.data?.data || { processed: 0, conflicts: [], errors: [] };
  },

  // Force sync (full sync)
  forceSync: async (): Promise<SyncResult> => {
    const response = await api.post<{ data: SyncResult }>('/sync/force');
    return response.data?.data || { updatedMemos: [], deletedMemoIds: [], updatedCategories: [], deletedCategoryIds: [], conflicts: [], lastSyncTimestamp: new Date() };
  },

  // Sync specific entities
  syncMemos: async (lastSyncTimestamp?: Date): Promise<{
    updatedMemos: any[];
    deletedMemoIds: string[];
    lastSyncTimestamp: Date;
  }> => {
    const response = await api.post<{ data: {
      updatedMemos: any[];
      deletedMemoIds: string[];
      lastSyncTimestamp: Date;
    } }>('/sync/memos', { lastSyncTimestamp });
    return response.data?.data || { updatedMemos: [], deletedMemoIds: [], lastSyncTimestamp: new Date() };
  },

  syncCategories: async (lastSyncTimestamp?: Date): Promise<{
    updatedCategories: any[];
    deletedCategoryIds: string[];
    lastSyncTimestamp: Date;
  }> => {
    const response = await api.post<{ data: {
      updatedCategories: any[];
      deletedCategoryIds: string[];
      lastSyncTimestamp: Date;
    } }>('/sync/categories', { lastSyncTimestamp });
    return response.data?.data || { updatedCategories: [], deletedCategoryIds: [], lastSyncTimestamp: new Date() };
  },
};