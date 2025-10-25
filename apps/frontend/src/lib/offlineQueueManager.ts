import { indexedDBManager } from './indexedDB';
import { useSyncStore } from '../stores/syncStore';
import { api } from './api';
import type { Memo, Category } from '@memo-app/shared/types';

interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'memo' | 'category';
  data: any;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

/**
 * Manages offline operations queue and handles sync when online
 */
export class OfflineQueueManager {
  private static instance: OfflineQueueManager;
  private isProcessing = false;
  private maxRetries = 3;
  private retryDelay = 1000; // Start with 1 second

  static getInstance(): OfflineQueueManager {
    if (!OfflineQueueManager.instance) {
      OfflineQueueManager.instance = new OfflineQueueManager();
    }
    return OfflineQueueManager.instance;
  }

  /**
   * Add an operation to the offline queue
   */
  async queueOperation(
    type: 'create' | 'update' | 'delete',
    entity: 'memo' | 'category',
    data: any
  ): Promise<void> {
    const operation: QueuedOperation = {
      id: `${entity}-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      entity,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    // Add to IndexedDB
    await indexedDBManager.init();
    const db = (indexedDBManager as any).db;
    if (db) {
      await db.put('offlineChanges', operation);
    }

    // Add to Zustand store for UI updates
    const syncStore = useSyncStore.getState();
    syncStore.addOfflineChange({
      type,
      entity,
      data,
    });
  }

  /**
   * Process the offline queue when online
   */
  async processQueue(): Promise<{
    processed: number;
    failed: number;
    errors: string[];
  }> {
    if (this.isProcessing) {
      return { processed: 0, failed: 0, errors: ['Queue is already being processed'] };
    }

    this.isProcessing = true;
    const result = { processed: 0, failed: 0, errors: [] as string[] };

    try {
      const operations = await indexedDBManager.getOfflineChanges();
      
      if (operations.length === 0) {
        return result;
      }

      // Sort by timestamp to maintain order
      operations.sort((a, b) => a.timestamp - b.timestamp);

      for (const operation of operations) {
        try {
          await this.processOperation(operation);
          await indexedDBManager.removeOfflineChange(operation.id);
          
          // Remove from Zustand store
          const syncStore = useSyncStore.getState();
          syncStore.removeOfflineChange(operation.id);
          
          result.processed++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          // Increment retry count
          operation.retryCount++;
          operation.lastError = errorMessage;

          if (operation.retryCount >= this.maxRetries) {
            // Remove failed operation after max retries
            await indexedDBManager.removeOfflineChange(operation.id);
            
            const syncStore = useSyncStore.getState();
            syncStore.removeOfflineChange(operation.id);
            syncStore.addSyncError(`Failed to sync ${operation.entity} ${operation.type} after ${this.maxRetries} attempts: ${errorMessage}`);
            
            result.failed++;
            result.errors.push(`${operation.entity} ${operation.type}: ${errorMessage}`);
          } else {
            // Update operation with new retry count
            const db = (indexedDBManager as any).db;
            if (db) {
              await db.put('offlineChanges', operation);
            }
            
            // Schedule retry with exponential backoff
            setTimeout(() => {
              this.processQueue().catch(console.error);
            }, this.retryDelay * Math.pow(2, operation.retryCount));
          }
        }
      }
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Queue processing failed');
    } finally {
      this.isProcessing = false;
    }

    return result;
  }

  /**
   * Process a single operation
   */
  private async processOperation(operation: QueuedOperation): Promise<void> {
    const { type, entity, data } = operation;

    switch (entity) {
      case 'memo':
        await this.processMemoOperation(type, data);
        break;
      case 'category':
        await this.processCategoryOperation(type, data);
        break;
      default:
        throw new Error(`Unknown entity type: ${entity}`);
    }
  }

  /**
   * Process memo operations
   */
  private async processMemoOperation(type: string, data: any): Promise<void> {
    switch (type) {
      case 'create':
        // Handle temp IDs by creating new memo and updating local references
        if (data.id && data.id.startsWith('temp-')) {
          const response = await api.post<Memo>('/memos', {
            title: data.title,
            content: data.content,
            tags: data.tags,
            categoryId: data.categoryId,
          });
          
          const newMemo = response.data;
          
          // Update IndexedDB with real ID
          await indexedDBManager.deleteMemo(data.id); // Remove temp memo
          await indexedDBManager.saveMemo(newMemo, 'synced'); // Add real memo
          
          // Update any references to the temp ID in other operations
          await this.updateTempIdReferences('memo', data.id, newMemo.id);
        } else {
          await api.post<Memo>('/memos', data);
        }
        break;
        
      case 'update':
        if (data.id && !data.id.startsWith('temp-')) {
          await api.put<Memo>(`/memos/${data.id}`, data);
          // Update local copy as synced
          await indexedDBManager.saveMemo(data, 'synced');
        }
        break;
        
      case 'delete':
        if (data.id && !data.id.startsWith('temp-')) {
          await api.delete(`/memos/${data.id}`);
        }
        // Remove from IndexedDB regardless
        await indexedDBManager.deleteMemo(data.id);
        break;
        
      default:
        throw new Error(`Unknown memo operation: ${type}`);
    }
  }

  /**
   * Process category operations
   */
  private async processCategoryOperation(type: string, data: any): Promise<void> {
    switch (type) {
      case 'create':
        // Handle temp IDs
        if (data.id && data.id.startsWith('temp-')) {
          const response = await api.post<Category>('/categories', {
            name: data.name,
            color: data.color,
          });
          
          const newCategory = response.data;
          
          // Update IndexedDB with real ID
          await indexedDBManager.deleteCategory(data.id); // Remove temp category
          await indexedDBManager.saveCategory(newCategory, 'synced'); // Add real category
          
          // Update any references to the temp ID
          await this.updateTempIdReferences('category', data.id, newCategory.id);
        } else {
          await api.post<Category>('/categories', data);
        }
        break;
        
      case 'update':
        if (data.id && !data.id.startsWith('temp-')) {
          await api.put<Category>(`/categories/${data.id}`, data);
          // Update local copy as synced
          await indexedDBManager.saveCategory(data, 'synced');
        }
        break;
        
      case 'delete':
        if (data.id && !data.id.startsWith('temp-')) {
          await api.delete(`/categories/${data.id}`);
        }
        // Remove from IndexedDB regardless
        await indexedDBManager.deleteCategory(data.id);
        break;
        
      default:
        throw new Error(`Unknown category operation: ${type}`);
    }
  }

  /**
   * Update references to temp IDs in other queued operations
   */
  private async updateTempIdReferences(
    entity: 'memo' | 'category',
    tempId: string,
    realId: string
  ): Promise<void> {
    const operations = await indexedDBManager.getOfflineChanges();
    
    for (const operation of operations) {
      let updated = false;
      
      if (entity === 'category' && operation.entity === 'memo') {
        // Update memo categoryId references
        if (operation.data.categoryId === tempId) {
          operation.data.categoryId = realId;
          updated = true;
        }
      }
      
      if (updated) {
        const db = (indexedDBManager as any).db;
        if (db) {
          await db.put('offlineChanges', operation);
        }
      }
    }
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<{
    totalOperations: number;
    operationsByType: Record<string, number>;
    operationsByEntity: Record<string, number>;
    oldestOperation?: Date;
  }> {
    const operations = await indexedDBManager.getOfflineChanges();
    
    const status = {
      totalOperations: operations.length,
      operationsByType: {} as Record<string, number>,
      operationsByEntity: {} as Record<string, number>,
      oldestOperation: undefined as Date | undefined,
    };

    operations.forEach(op => {
      // Count by type
      status.operationsByType[op.type] = (status.operationsByType[op.type] || 0) + 1;
      
      // Count by entity
      status.operationsByEntity[op.entity] = (status.operationsByEntity[op.entity] || 0) + 1;
      
      // Find oldest operation
      const opDate = new Date(op.timestamp);
      if (!status.oldestOperation || opDate < status.oldestOperation) {
        status.oldestOperation = opDate;
      }
    });

    return status;
  }

  /**
   * Clear all queued operations (use with caution)
   */
  async clearQueue(): Promise<void> {
    await indexedDBManager.clearOfflineChanges();
    
    const syncStore = useSyncStore.getState();
    syncStore.clearOfflineChanges();
  }

  /**
   * Get failed operations that exceeded retry limit
   */
  async getFailedOperations(): Promise<QueuedOperation[]> {
    const operations = await indexedDBManager.getOfflineChanges();
    return operations.filter(op => op.retryCount >= this.maxRetries);
  }
}

// Export singleton instance
export const offlineQueueManager = OfflineQueueManager.getInstance();