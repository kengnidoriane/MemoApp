import { api } from '../lib/api';
import type { 
  SyncRequest,
  SyncResult,
  DataConflict,
  ConflictResolution,
  BatchUpdateRequest,
  BatchUpdateResult,
  SyncStatus,
  OfflineChange 
} from '@memo-app/shared/types';

export const syncService = {
  // Main sync operations
  syncData: async (request: SyncRequest): Promise<SyncResult> => {
    const response = await api.post<SyncResult>('/sync', request);
    return response.data;
  },

  getSyncStatus: async (): Promise<SyncStatus> => {
    const response = await api.get<SyncStatus>('/sync/status');
    return response.data;
  },

  // Conflict resolution
  resolveConflicts: async (resolutions: ConflictResolution[]): Promise<void> => {
    await api.post('/sync/resolve-conflicts', { resolutions });
  },

  getConflicts: async (): Promise<DataConflict[]> => {
    const response = await api.get<DataConflict[]>('/sync/conflicts');
    return response.data;
  },

  // Batch operations for offline changes
  batchUpdate: async (request: BatchUpdateRequest): Promise<BatchUpdateResult> => {
    const response = await api.post<BatchUpdateResult>('/sync/batch', request);
    return response.data;
  },

  // Force sync (full sync)
  forceSync: async (): Promise<SyncResult> => {
    const response = await api.post<SyncResult>('/sync/force');
    return response.data;
  },

  // Sync specific entities
  syncMemos: async (lastSyncTimestamp?: Date): Promise<{
    updatedMemos: any[];
    deletedMemoIds: string[];
    lastSyncTimestamp: Date;
  }> => {
    const response = await api.post('/sync/memos', { lastSyncTimestamp });
    return response.data;
  },

  syncCategories: async (lastSyncTimestamp?: Date): Promise<{
    updatedCategories: any[];
    deletedCategoryIds: string[];
    lastSyncTimestamp: Date;
  }> => {
    const response = await api.post('/sync/categories', { lastSyncTimestamp });
    return response.data;
  },
};