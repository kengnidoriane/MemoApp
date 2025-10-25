import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Memo, Category } from '@memo-app/shared';

// Define the database schema
interface MemoAppDB extends DBSchema {
  memos: {
    key: string;
    value: Memo & { 
      syncStatus: 'synced' | 'pending' | 'conflict';
      lastModified: number;
    };
    indexes: { 
      'by-category': string;
      'by-sync-status': 'synced' | 'pending' | 'conflict';
      'by-last-modified': number;
    };
  };
  categories: {
    key: string;
    value: Category & { 
      syncStatus: 'synced' | 'pending' | 'conflict';
      lastModified: number;
    };
    indexes: { 
      'by-sync-status': 'synced' | 'pending' | 'conflict';
    };
  };
  offlineChanges: {
    key: string;
    value: {
      id: string;
      type: 'create' | 'update' | 'delete';
      entity: 'memo' | 'category';
      data: any;
      timestamp: number;
    };
    indexes: { 
      'by-timestamp': number;
      'by-entity': 'memo' | 'category';
    };
  };
  userPreferences: {
    key: 'preferences';
    value: {
      theme: 'light' | 'dark';
      language: 'en' | 'fr';
      reminderFrequency: string;
      notificationsEnabled: boolean;
      fontSize: 'small' | 'medium' | 'large';
      lastSync: number;
    };
  };
  syncMetadata: {
    key: string;
    value: {
      entity: string;
      lastSyncTimestamp: number;
      conflictResolutionNeeded: boolean;
    };
  };
}

class IndexedDBManager {
  private db: IDBPDatabase<MemoAppDB> | null = null;
  private readonly DB_NAME = 'MemoAppDB';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<MemoAppDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Memos store
        const memoStore = db.createObjectStore('memos', { keyPath: 'id' });
        memoStore.createIndex('by-category', 'categoryId');
        memoStore.createIndex('by-sync-status', 'syncStatus');
        memoStore.createIndex('by-last-modified', 'lastModified');

        // Categories store
        const categoryStore = db.createObjectStore('categories', { keyPath: 'id' });
        categoryStore.createIndex('by-sync-status', 'syncStatus');

        // Offline changes store
        const changesStore = db.createObjectStore('offlineChanges', { keyPath: 'id' });
        changesStore.createIndex('by-timestamp', 'timestamp');
        changesStore.createIndex('by-entity', 'entity');

        // User preferences store
        db.createObjectStore('userPreferences', { keyPath: 'key' });

        // Sync metadata store
        db.createObjectStore('syncMetadata', { keyPath: 'entity' });
      },
    });
  }

  // Memo operations
  async saveMemo(memo: Memo, syncStatus: 'synced' | 'pending' | 'conflict' = 'pending'): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const memoWithMeta = {
      ...memo,
      syncStatus,
      lastModified: Date.now(),
    };

    await this.db.put('memos', memoWithMeta);

    // If not synced, add to offline changes
    if (syncStatus === 'pending') {
      const isNew = !memo.id || memo.id.startsWith('temp-');
      await this.addOfflineChange('memo', isNew ? 'create' : 'update', memo);
    }
  }

  async createMemoOffline(memo: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Memo> {
    const tempId = `temp-memo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const newMemo: Memo = {
      ...memo,
      id: tempId,
      createdAt: now,
      updatedAt: now,
    };

    await this.saveMemo(newMemo, 'pending');
    return newMemo;
  }

  async getMemo(id: string): Promise<(Memo & { syncStatus: string; lastModified: number }) | undefined> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    return this.db.get('memos', id);
  }

  async getAllMemos(): Promise<(Memo & { syncStatus: string; lastModified: number })[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAll('memos');
  }

  async getMemosByCategory(categoryId: string): Promise<(Memo & { syncStatus: string; lastModified: number })[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAllFromIndex('memos', 'by-category', categoryId);
  }

  async deleteMemo(id: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.delete('memos', id);
    await this.addOfflineChange('memo', 'delete', { id });
  }

  // Category operations
  async saveCategory(category: Category, syncStatus: 'synced' | 'pending' | 'conflict' = 'pending'): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const categoryWithMeta = {
      ...category,
      syncStatus,
      lastModified: Date.now(),
    };

    await this.db.put('categories', categoryWithMeta);

    if (syncStatus === 'pending') {
      const isNew = !category.id || category.id.startsWith('temp-');
      await this.addOfflineChange('category', isNew ? 'create' : 'update', category);
    }
  }

  async createCategoryOffline(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    const tempId = `temp-category-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const newCategory: Category = {
      ...category,
      id: tempId,
      createdAt: now,
      updatedAt: now,
      memoCount: 0,
      syncVersion: 0,
      isDeleted: false,
    };

    await this.saveCategory(newCategory, 'pending');
    return newCategory;
  }

  async getAllCategories(): Promise<(Category & { syncStatus: string; lastModified: number })[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAll('categories');
  }

  async deleteCategory(id: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.delete('categories', id);
    await this.addOfflineChange('category', 'delete', { id });
  }

  // Offline changes management
  private async addOfflineChange(entity: 'memo' | 'category', type: 'create' | 'update' | 'delete', data: any): Promise<void> {
    if (!this.db) return;

    const change = {
      id: `${entity}-${type}-${Date.now()}-${Math.random()}`,
      type,
      entity,
      data,
      timestamp: Date.now(),
    };

    await this.db.put('offlineChanges', change);
  }

  async getOfflineChanges(): Promise<any[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAll('offlineChanges');
  }

  async clearOfflineChanges(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    await this.db.clear('offlineChanges');
  }

  async removeOfflineChange(changeId: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('offlineChanges', changeId);
  }

  // User preferences
  async saveUserPreferences(preferences: any): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('userPreferences', { key: 'preferences', ...preferences });
  }

  async getUserPreferences(): Promise<any> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.get('userPreferences', 'preferences');
    return result || {};
  }

  // Sync metadata
  async updateSyncMetadata(entity: string, lastSyncTimestamp: number, conflictResolutionNeeded = false): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.put('syncMetadata', {
      entity,
      lastSyncTimestamp,
      conflictResolutionNeeded,
    });
  }

  async getSyncMetadata(entity: string): Promise<any> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    return this.db.get('syncMetadata', entity);
  }

  // Utility methods
  async getPendingItems(): Promise<{ memos: any[]; categories: any[] }> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    const [memos, categories] = await Promise.all([
      this.db.getAllFromIndex('memos', 'by-sync-status', 'pending'),
      this.db.getAllFromIndex('categories', 'by-sync-status', 'pending'),
    ]);

    return { memos, categories };
  }

  async markAsSynced(entity: 'memo' | 'category', id: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    const store = entity === 'memo' ? 'memos' : 'categories';
    const item = await this.db.get(store as any, id);
    
    if (item) {
      item.syncStatus = 'synced';
      await this.db.put(store as any, item);
    }
  }

  async clearAllData(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    await Promise.all([
      this.db.clear('memos'),
      this.db.clear('categories'),
      this.db.clear('offlineChanges'),
      this.db.clear('userPreferences'),
      this.db.clear('syncMetadata'),
    ]);
  }

  // Enhanced offline queue management
  async getOfflineChangesByEntity(entity: 'memo' | 'category'): Promise<any[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAllFromIndex('offlineChanges', 'by-entity', entity);
  }

  async getOfflineChangesByTimestamp(since?: number): Promise<any[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    if (since) {
      const range = IDBKeyRange.lowerBound(since);
      return this.db.getAllFromIndex('offlineChanges', 'by-timestamp', range);
    }
    
    return this.db.getAll('offlineChanges');
  }

  async hasOfflineChanges(): Promise<boolean> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    const count = await this.db.count('offlineChanges');
    return count > 0;
  }

  async getConflictItems(): Promise<{ memos: any[]; categories: any[] }> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    const [memos, categories] = await Promise.all([
      this.db.getAllFromIndex('memos', 'by-sync-status', 'conflict'),
      this.db.getAllFromIndex('categories', 'by-sync-status', 'conflict'),
    ]);

    return { memos, categories };
  }

  async resolveConflict(entity: 'memo' | 'category', id: string, resolvedData: any): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    const store = entity === 'memo' ? 'memos' : 'categories';
    const resolvedItem = {
      ...resolvedData,
      syncStatus: 'synced' as const,
      lastModified: Date.now(),
    };

    await this.db.put(store as any, resolvedItem);
  }

  // Batch operations for better performance
  async batchSaveMemos(memos: Memo[], syncStatus: 'synced' | 'pending' | 'conflict' = 'synced'): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    const tx = this.db.transaction('memos', 'readwrite');
    const store = tx.objectStore('memos');
    
    await Promise.all(
      memos.map(memo => {
        const memoWithMeta = {
          ...memo,
          syncStatus,
          lastModified: Date.now(),
        };
        return store.put(memoWithMeta);
      })
    );
    
    await tx.done;
  }

  async batchSaveCategories(categories: Category[], syncStatus: 'synced' | 'pending' | 'conflict' = 'synced'): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    const tx = this.db.transaction('categories', 'readwrite');
    const store = tx.objectStore('categories');
    
    await Promise.all(
      categories.map(category => {
        const categoryWithMeta = {
          ...category,
          syncStatus,
          lastModified: Date.now(),
        };
        return store.put(categoryWithMeta);
      })
    );
    
    await tx.done;
  }
}

// Export singleton instance
export const indexedDBManager = new IndexedDBManager();