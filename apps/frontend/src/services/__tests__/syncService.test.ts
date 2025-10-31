import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncService } from '../syncService';
import { offlineMemoService } from '../offlineMemoService';
import { offlineCategoryService } from '../offlineCategoryService';
import { createMockMemo, createMockCategory } from '../../test/utils';

// Mock dependencies
vi.mock('../offlineMemoService');
vi.mock('../offlineCategoryService');
vi.mock('../memoService');
vi.mock('../categoryService');
vi.mock('../../lib/api');

describe('SyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset IndexedDB mock
    global.indexedDB = {
      open: vi.fn(() => ({
        result: {
          transaction: vi.fn(() => ({
            objectStore: vi.fn(() => ({
              getAll: vi.fn(() => ({ result: [] })),
              put: vi.fn(),
              delete: vi.fn(),
              clear: vi.fn(),
            })),
          })),
        },
        onsuccess: null,
        onerror: null,
      })),
    } as any;
  });

  describe('syncUserData', () => {
    it('should sync memos and categories when online', async () => {
      const mockMemos = [createMockMemo(), createMockMemo({ id: 'memo-2' })];
      const mockCategories = [createMockCategory(), createMockCategory({ id: 'cat-2' })];

      // Mock API responses
      const mockApiClient = {
        get: vi.fn()
          .mockResolvedValueOnce({ data: { memos: mockMemos } })
          .mockResolvedValueOnce({ data: mockCategories }),
      };

      vi.mocked(require('../../lib/api').apiClient).mockReturnValue(mockApiClient);
      vi.mocked(offlineMemoService.syncMemos).mockResolvedValue(undefined);
      vi.mocked(offlineCategoryService.syncCategories).mockResolvedValue(undefined);

      const result = await syncService.syncUserData('user-1', new Date('2023-01-01'));

      expect(mockApiClient.get).toHaveBeenCalledWith('/sync', {
        params: { lastSync: '2023-01-01T00:00:00.000Z' },
      });
      expect(offlineMemoService.syncMemos).toHaveBeenCalledWith(mockMemos);
      expect(offlineCategoryService.syncCategories).toHaveBeenCalledWith(mockCategories);
      expect(result.success).toBe(true);
      expect(result.lastSyncTimestamp).toBeInstanceOf(Date);
    });

    it('should handle sync conflicts', async () => {
      const conflictedMemo = createMockMemo({
        id: 'memo-1',
        title: 'Server Version',
        updatedAt: new Date('2023-01-02'),
      });

      const localMemo = createMockMemo({
        id: 'memo-1',
        title: 'Local Version',
        updatedAt: new Date('2023-01-01'),
      });

      const mockApiClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            memos: [conflictedMemo],
            categories: [],
            conflicts: [
              {
                id: 'memo-1',
                type: 'memo',
                serverVersion: conflictedMemo,
                localVersion: localMemo,
                conflictType: 'update',
              },
            ],
          },
        }),
      };

      vi.mocked(require('../../lib/api').apiClient).mockReturnValue(mockApiClient);
      vi.mocked(offlineMemoService.getConflicts).mockResolvedValue([
        {
          id: 'memo-1',
          type: 'memo',
          serverVersion: conflictedMemo,
          localVersion: localMemo,
          conflictType: 'update',
        },
      ]);

      const result = await syncService.syncUserData('user-1', new Date('2023-01-01'));

      expect(result.success).toBe(false);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].id).toBe('memo-1');
    });

    it('should handle network errors gracefully', async () => {
      const mockApiClient = {
        get: vi.fn().mockRejectedValue(new Error('Network error')),
      };

      vi.mocked(require('../../lib/api').apiClient).mockReturnValue(mockApiClient);

      const result = await syncService.syncUserData('user-1', new Date('2023-01-01'));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should queue offline changes when offline', async () => {
      const mockApiClient = {
        get: vi.fn().mockRejectedValue(new Error('Network unavailable')),
      };

      vi.mocked(require('../../lib/api').apiClient).mockReturnValue(mockApiClient);
      vi.mocked(offlineMemoService.getPendingChanges).mockResolvedValue([
        {
          id: 'change-1',
          type: 'create',
          entity: 'memo',
          data: createMockMemo(),
          timestamp: new Date(),
        },
      ]);

      const result = await syncService.syncUserData('user-1', new Date('2023-01-01'));

      expect(result.success).toBe(false);
      expect(result.pendingChanges).toHaveLength(1);
    });
  });

  describe('resolveConflict', () => {
    it('should resolve conflict by choosing server version', async () => {
      const conflict = {
        id: 'memo-1',
        type: 'memo' as const,
        serverVersion: createMockMemo({ title: 'Server Version' }),
        localVersion: createMockMemo({ title: 'Local Version' }),
        conflictType: 'update' as const,
      };

      vi.mocked(offlineMemoService.resolveConflict).mockResolvedValue(undefined);

      await syncService.resolveConflict(conflict, 'server');

      expect(offlineMemoService.resolveConflict).toHaveBeenCalledWith(
        conflict,
        'server'
      );
    });

    it('should resolve conflict by choosing local version', async () => {
      const conflict = {
        id: 'memo-1',
        type: 'memo' as const,
        serverVersion: createMockMemo({ title: 'Server Version' }),
        localVersion: createMockMemo({ title: 'Local Version' }),
        conflictType: 'update' as const,
      };

      vi.mocked(offlineMemoService.resolveConflict).mockResolvedValue(undefined);

      await syncService.resolveConflict(conflict, 'local');

      expect(offlineMemoService.resolveConflict).toHaveBeenCalledWith(
        conflict,
        'local'
      );
    });

    it('should handle category conflicts', async () => {
      const conflict = {
        id: 'cat-1',
        type: 'category' as const,
        serverVersion: createMockCategory({ name: 'Server Category' }),
        localVersion: createMockCategory({ name: 'Local Category' }),
        conflictType: 'update' as const,
      };

      vi.mocked(offlineCategoryService.resolveConflict).mockResolvedValue(undefined);

      await syncService.resolveConflict(conflict, 'server');

      expect(offlineCategoryService.resolveConflict).toHaveBeenCalledWith(
        conflict,
        'server'
      );
    });
  });

  describe('processOfflineQueue', () => {
    it('should process pending memo changes', async () => {
      const pendingChanges = [
        {
          id: 'change-1',
          type: 'create' as const,
          entity: 'memo' as const,
          data: createMockMemo(),
          timestamp: new Date(),
        },
        {
          id: 'change-2',
          type: 'update' as const,
          entity: 'memo' as const,
          data: { id: 'memo-1', title: 'Updated Title' },
          timestamp: new Date(),
        },
        {
          id: 'change-3',
          type: 'delete' as const,
          entity: 'memo' as const,
          data: { id: 'memo-2' },
          timestamp: new Date(),
        },
      ];

      const mockApiClient = {
        post: vi.fn().mockResolvedValue({ data: createMockMemo() }),
        put: vi.fn().mockResolvedValue({ data: createMockMemo() }),
        delete: vi.fn().mockResolvedValue({ data: { success: true } }),
      };

      vi.mocked(require('../../lib/api').apiClient).mockReturnValue(mockApiClient);
      vi.mocked(offlineMemoService.getPendingChanges).mockResolvedValue(pendingChanges);
      vi.mocked(offlineMemoService.clearPendingChange).mockResolvedValue(undefined);

      const result = await syncService.processOfflineQueue('user-1');

      expect(mockApiClient.post).toHaveBeenCalledWith('/memos', pendingChanges[0].data);
      expect(mockApiClient.put).toHaveBeenCalledWith('/memos/memo-1', pendingChanges[1].data);
      expect(mockApiClient.delete).toHaveBeenCalledWith('/memos/memo-2');
      expect(offlineMemoService.clearPendingChange).toHaveBeenCalledTimes(3);
      expect(result.processedChanges).toBe(3);
      expect(result.failedChanges).toBe(0);
    });

    it('should handle failed changes gracefully', async () => {
      const pendingChanges = [
        {
          id: 'change-1',
          type: 'create' as const,
          entity: 'memo' as const,
          data: createMockMemo(),
          timestamp: new Date(),
        },
      ];

      const mockApiClient = {
        post: vi.fn().mockRejectedValue(new Error('Server error')),
      };

      vi.mocked(require('../../lib/api').apiClient).mockReturnValue(mockApiClient);
      vi.mocked(offlineMemoService.getPendingChanges).mockResolvedValue(pendingChanges);

      const result = await syncService.processOfflineQueue('user-1');

      expect(result.processedChanges).toBe(0);
      expect(result.failedChanges).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Server error');
    });

    it('should process category changes', async () => {
      const pendingChanges = [
        {
          id: 'change-1',
          type: 'create' as const,
          entity: 'category' as const,
          data: createMockCategory(),
          timestamp: new Date(),
        },
      ];

      const mockApiClient = {
        post: vi.fn().mockResolvedValue({ data: createMockCategory() }),
      };

      vi.mocked(require('../../lib/api').apiClient).mockReturnValue(mockApiClient);
      vi.mocked(offlineCategoryService.getPendingChanges).mockResolvedValue(pendingChanges);
      vi.mocked(offlineCategoryService.clearPendingChange).mockResolvedValue(undefined);

      const result = await syncService.processOfflineQueue('user-1');

      expect(mockApiClient.post).toHaveBeenCalledWith('/categories', pendingChanges[0].data);
      expect(offlineCategoryService.clearPendingChange).toHaveBeenCalledWith('change-1');
      expect(result.processedChanges).toBe(1);
    });
  });

  describe('getConflicts', () => {
    it('should return all unresolved conflicts', async () => {
      const memoConflicts = [
        {
          id: 'memo-1',
          type: 'memo' as const,
          serverVersion: createMockMemo(),
          localVersion: createMockMemo(),
          conflictType: 'update' as const,
        },
      ];

      const categoryConflicts = [
        {
          id: 'cat-1',
          type: 'category' as const,
          serverVersion: createMockCategory(),
          localVersion: createMockCategory(),
          conflictType: 'update' as const,
        },
      ];

      vi.mocked(offlineMemoService.getConflicts).mockResolvedValue(memoConflicts);
      vi.mocked(offlineCategoryService.getConflicts).mockResolvedValue(categoryConflicts);

      const conflicts = await syncService.getConflicts();

      expect(conflicts).toHaveLength(2);
      expect(conflicts[0].type).toBe('memo');
      expect(conflicts[1].type).toBe('category');
    });
  });

  describe('getSyncStatus', () => {
    it('should return sync status with pending changes count', async () => {
      vi.mocked(offlineMemoService.getPendingChanges).mockResolvedValue([
        {
          id: 'change-1',
          type: 'create',
          entity: 'memo',
          data: createMockMemo(),
          timestamp: new Date(),
        },
      ]);

      vi.mocked(offlineCategoryService.getPendingChanges).mockResolvedValue([]);

      const status = await syncService.getSyncStatus();

      expect(status.pendingChanges).toBe(1);
      expect(status.lastSyncTimestamp).toBeInstanceOf(Date);
      expect(status.isOnline).toBe(true);
    });

    it('should detect offline status', async () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const status = await syncService.getSyncStatus();

      expect(status.isOnline).toBe(false);
    });
  });

  describe('forceSyncAll', () => {
    it('should force sync all data ignoring timestamps', async () => {
      const mockMemos = [createMockMemo()];
      const mockCategories = [createMockCategory()];

      const mockApiClient = {
        get: vi.fn()
          .mockResolvedValueOnce({ data: { memos: mockMemos } })
          .mockResolvedValueOnce({ data: mockCategories }),
      };

      vi.mocked(require('../../lib/api').apiClient).mockReturnValue(mockApiClient);
      vi.mocked(offlineMemoService.syncMemos).mockResolvedValue(undefined);
      vi.mocked(offlineCategoryService.syncCategories).mockResolvedValue(undefined);

      const result = await syncService.forceSyncAll('user-1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/sync', {
        params: { lastSync: null },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('clearSyncData', () => {
    it('should clear all sync-related data', async () => {
      vi.mocked(offlineMemoService.clearAll).mockResolvedValue(undefined);
      vi.mocked(offlineCategoryService.clearAll).mockResolvedValue(undefined);

      await syncService.clearSyncData();

      expect(offlineMemoService.clearAll).toHaveBeenCalled();
      expect(offlineCategoryService.clearAll).toHaveBeenCalled();
    });
  });

  describe('auto-sync', () => {
    it('should start auto-sync when online', async () => {
      const mockSyncUserData = vi.spyOn(syncService, 'syncUserData').mockResolvedValue({
        success: true,
        lastSyncTimestamp: new Date(),
        conflicts: [],
        pendingChanges: [],
      });

      syncService.startAutoSync('user-1', 30000); // 30 seconds

      // Fast-forward time
      vi.advanceTimersByTime(30000);

      expect(mockSyncUserData).toHaveBeenCalledWith('user-1', expect.any(Date));

      syncService.stopAutoSync();
    });

    it('should stop auto-sync', () => {
      const mockSyncUserData = vi.spyOn(syncService, 'syncUserData').mockResolvedValue({
        success: true,
        lastSyncTimestamp: new Date(),
        conflicts: [],
        pendingChanges: [],
      });

      syncService.startAutoSync('user-1', 30000);
      syncService.stopAutoSync();

      // Fast-forward time
      vi.advanceTimersByTime(30000);

      expect(mockSyncUserData).not.toHaveBeenCalled();
    });
  });

  describe('conflict resolution strategies', () => {
    it('should apply merge strategy for compatible changes', async () => {
      const serverMemo = createMockMemo({
        id: 'memo-1',
        title: 'Server Title',
        content: 'Original content',
        tags: ['server', 'tag'],
      });

      const localMemo = createMockMemo({
        id: 'memo-1',
        title: 'Original Title',
        content: 'Local content',
        tags: ['local', 'tag'],
      });

      const conflict = {
        id: 'memo-1',
        type: 'memo' as const,
        serverVersion: serverMemo,
        localVersion: localMemo,
        conflictType: 'update' as const,
      };

      vi.mocked(offlineMemoService.resolveConflict).mockResolvedValue(undefined);

      await syncService.resolveConflict(conflict, 'merge');

      expect(offlineMemoService.resolveConflict).toHaveBeenCalledWith(
        conflict,
        'merge'
      );
    });

    it('should handle three-way merge conflicts', async () => {
      const baseVersion = createMockMemo({
        id: 'memo-1',
        title: 'Original Title',
        content: 'Original content',
      });

      const serverVersion = createMockMemo({
        id: 'memo-1',
        title: 'Server Title',
        content: 'Original content',
      });

      const localVersion = createMockMemo({
        id: 'memo-1',
        title: 'Original Title',
        content: 'Local content',
      });

      const conflict = {
        id: 'memo-1',
        type: 'memo' as const,
        serverVersion,
        localVersion,
        baseVersion,
        conflictType: 'update' as const,
      };

      const mergedVersion = {
        ...baseVersion,
        title: 'Server Title', // From server
        content: 'Local content', // From local
      };

      vi.mocked(offlineMemoService.performThreeWayMerge).mockResolvedValue(mergedVersion);

      const result = await syncService.performThreeWayMerge(conflict);

      expect(result).toEqual(mergedVersion);
      expect(offlineMemoService.performThreeWayMerge).toHaveBeenCalledWith(conflict);
    });
  });

  describe('sync events', () => {
    it('should emit sync events', async () => {
      const onSyncStart = vi.fn();
      const onSyncComplete = vi.fn();
      const onSyncError = vi.fn();

      syncService.on('syncStart', onSyncStart);
      syncService.on('syncComplete', onSyncComplete);
      syncService.on('syncError', onSyncError);

      const mockApiClient = {
        get: vi.fn().mockResolvedValue({
          data: { memos: [], categories: [] },
        }),
      };

      vi.mocked(require('../../lib/api').apiClient).mockReturnValue(mockApiClient);

      await syncService.syncUserData('user-1', new Date());

      expect(onSyncStart).toHaveBeenCalled();
      expect(onSyncComplete).toHaveBeenCalled();
      expect(onSyncError).not.toHaveBeenCalled();
    });

    it('should emit error events on sync failure', async () => {
      const onSyncError = vi.fn();
      syncService.on('syncError', onSyncError);

      const mockApiClient = {
        get: vi.fn().mockRejectedValue(new Error('Network error')),
      };

      vi.mocked(require('../../lib/api').apiClient).mockReturnValue(mockApiClient);

      await syncService.syncUserData('user-1', new Date());

      expect(onSyncError).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});