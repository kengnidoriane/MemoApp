import { categoryService } from './categoryService';
import { indexedDBManager } from '../lib/indexedDB';
import { useSyncStore } from '../stores/syncStore';
import { useOffline } from '../hooks/useOffline';
import type { 
  Category, 
  CreateCategoryRequest, 
  UpdateCategoryRequest 
} from '@memo-app/shared/types';

/**
 * Offline-aware category service that handles both online and offline operations
 */
export class OfflineCategoryService {
  private static instance: OfflineCategoryService;

  static getInstance(): OfflineCategoryService {
    if (!OfflineCategoryService.instance) {
      OfflineCategoryService.instance = new OfflineCategoryService();
    }
    return OfflineCategoryService.instance;
  }

  /**
   * Create a category - works offline and online
   */
  async createCategory(categoryData: CreateCategoryRequest): Promise<Category> {
    const { isOnline } = useOffline();
    
    if (isOnline) {
      try {
        // Try to create online first
        const category = await categoryService.createCategory(categoryData);
        // Save to IndexedDB as synced
        await indexedDBManager.saveCategory(category, 'synced');
        return category;
      } catch (error) {
        // If online creation fails, fall back to offline
        console.warn('Online category creation failed, falling back to offline:', error);
      }
    }

    // Create offline
    const offlineCategory = await indexedDBManager.createCategoryOffline(categoryData);
    
    // Add to sync queue
    const syncStore = useSyncStore.getState();
    syncStore.addOfflineChange({
      type: 'create',
      entity: 'category',
      data: offlineCategory,
    });

    return offlineCategory;
  }

  /**
   * Update a category - works offline and online
   */
  async updateCategory(id: string, updates: UpdateCategoryRequest): Promise<Category> {
    const { isOnline } = useOffline();
    
    // Get current category from IndexedDB
    const currentCategories = await indexedDBManager.getAllCategories();
    const currentCategory = currentCategories.find(c => c.id === id);
    
    if (!currentCategory) {
      throw new Error('Category not found');
    }

    // Create updated category
    const updatedCategory: Category = {
      ...currentCategory,
      ...updates,
      updatedAt: new Date(),
    };

    if (isOnline && !id.startsWith('temp-')) {
      try {
        // Try to update online first
        const serverCategory = await categoryService.updateCategory(id, updates);
        // Save to IndexedDB as synced
        await indexedDBManager.saveCategory(serverCategory, 'synced');
        return serverCategory;
      } catch (error) {
        console.warn('Online category update failed, falling back to offline:', error);
      }
    }

    // Update offline
    await indexedDBManager.saveCategory(updatedCategory, 'pending');
    
    // Add to sync queue
    const syncStore = useSyncStore.getState();
    syncStore.addOfflineChange({
      type: 'update',
      entity: 'category',
      data: updatedCategory,
    });

    return updatedCategory;
  }

  /**
   * Delete a category - works offline and online
   */
  async deleteCategory(id: string): Promise<void> {
    const { isOnline } = useOffline();
    
    if (isOnline && !id.startsWith('temp-')) {
      try {
        // Try to delete online first
        await categoryService.deleteCategory(id);
        // Remove from IndexedDB
        await indexedDBManager.deleteCategory(id);
        return;
      } catch (error) {
        console.warn('Online category deletion failed, falling back to offline:', error);
      }
    }

    // Delete offline
    await indexedDBManager.deleteCategory(id);
    
    // Add to sync queue (unless it's a temp category)
    if (!id.startsWith('temp-')) {
      const syncStore = useSyncStore.getState();
      syncStore.addOfflineChange({
        type: 'delete',
        entity: 'category',
        data: { id },
      });
    }
  }

  /**
   * Get all categories - prioritizes local data for better performance
   */
  async getCategories(): Promise<Category[]> {
    const { isOnline } = useOffline();
    
    // Always return local data first for better UX
    const localCategories = await indexedDBManager.getAllCategories();
    
    // If online, try to sync in background
    if (isOnline) {
      this.backgroundSync().catch(error => {
        console.warn('Background sync failed:', error);
      });
    }
    
    return localCategories.map(category => ({
      id: category.id,
      name: category.name,
      color: category.color,
      userId: category.userId,
      memoCount: category.memoCount,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      syncVersion: category.syncVersion,
      isDeleted: category.isDeleted,
    }));
  }

  /**
   * Get a single category by ID
   */
  async getCategory(id: string): Promise<Category | null> {
    const categories = await indexedDBManager.getAllCategories();
    const category = categories.find(c => c.id === id);
    
    if (!category) {
      return null;
    }

    return {
      id: category.id,
      name: category.name,
      color: category.color,
      userId: category.userId,
      memoCount: category.memoCount,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      syncVersion: category.syncVersion,
      isDeleted: category.isDeleted,
    };
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
      pendingCount: pendingItems.categories.length,
      conflictCount: conflictItems.categories.length,
      hasOfflineChanges: hasChanges,
    };
  }

  /**
   * Background sync when online
   */
  private async backgroundSync(): Promise<void> {
    // This would trigger the sync manager
    // Implementation depends on sync strategy
    console.log('Background sync triggered for categories');
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
    console.log('Force sync requested for categories');
  }
}

// Export singleton instance
export const offlineCategoryService = OfflineCategoryService.getInstance();