import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockMemo, createMockCategory } from '../../test/utils';

// Conflict resolution logic to test
export interface DataConflict {
  id: string;
  type: 'memo' | 'category';
  serverVersion: any;
  localVersion: any;
  baseVersion?: any;
  conflictType: 'update' | 'delete' | 'create';
  timestamp: Date;
}

export class ConflictResolver {
  static detectConflicts(serverData: any[], localData: any[]): DataConflict[] {
    const conflicts: DataConflict[] = [];
    const serverMap = new Map(serverData.map(item => [item.id, item]));
    const localMap = new Map(localData.map(item => [item.id, item]));

    // Check for update conflicts
    for (const [id, serverItem] of serverMap) {
      const localItem = localMap.get(id);
      if (localItem && this.hasConflict(serverItem, localItem)) {
        conflicts.push({
          id,
          type: this.getItemType(serverItem),
          serverVersion: serverItem,
          localVersion: localItem,
          conflictType: 'update',
          timestamp: new Date(),
        });
      }
    }

    return conflicts;
  }

  static hasConflict(serverItem: any, localItem: any): boolean {
    // Check if both versions have been modified since last sync
    const serverUpdated = new Date(serverItem.updatedAt);
    const localUpdated = new Date(localItem.updatedAt);
    const lastSync = new Date(localItem.lastSyncAt || 0);

    return serverUpdated > lastSync && localUpdated > lastSync;
  }

  static getItemType(item: any): 'memo' | 'category' {
    return item.content !== undefined ? 'memo' : 'category';
  }

  static resolveConflictAutomatically(conflict: DataConflict): {
    canAutoResolve: boolean;
    resolution?: any;
    strategy?: string;
  } {
    const { serverVersion, localVersion, type } = conflict;

    if (type === 'memo') {
      return this.resolveMemoConflict(serverVersion, localVersion);
    } else {
      return this.resolveCategoryConflict(serverVersion, localVersion);
    }
  }

  static resolveMemoConflict(serverMemo: any, localMemo: any): {
    canAutoResolve: boolean;
    resolution?: any;
    strategy?: string;
  } {
    // Check if changes are in different fields (non-conflicting)
    const serverChanges = this.getChangedFields(serverMemo, localMemo);
    const localChanges = this.getChangedFields(localMemo, serverMemo);
    
    const conflictingFields = serverChanges.filter(field => localChanges.includes(field));

    if (conflictingFields.length === 0) {
      // No conflicting fields, can merge automatically
      const merged = {
        ...localMemo,
        ...serverMemo,
        // Preserve local changes
        ...this.extractChanges(localMemo, serverMemo),
        // Use latest timestamp
        updatedAt: new Date(Math.max(
          new Date(serverMemo.updatedAt).getTime(),
          new Date(localMemo.updatedAt).getTime()
        )),
      };

      return {
        canAutoResolve: true,
        resolution: merged,
        strategy: 'merge',
      };
    }

    // Check for simple cases that can be auto-resolved
    if (conflictingFields.length === 1 && conflictingFields[0] === 'tags') {
      // Merge tags automatically
      const mergedTags = [...new Set([...serverMemo.tags, ...localMemo.tags])];
      return {
        canAutoResolve: true,
        resolution: {
          ...serverMemo,
          tags: mergedTags,
        },
        strategy: 'merge-tags',
      };
    }

    return { canAutoResolve: false };
  }

  static resolveCategoryConflict(serverCategory: any, localCategory: any): {
    canAutoResolve: boolean;
    resolution?: any;
    strategy?: string;
  } {
    // Categories are simpler - only name and color can conflict
    if (serverCategory.name !== localCategory.name && 
        serverCategory.color !== localCategory.color) {
      // Both name and color changed - cannot auto-resolve
      return { canAutoResolve: false };
    }

    if (serverCategory.name !== localCategory.name) {
      // Only name changed - use most recent
      const useServer = new Date(serverCategory.updatedAt) > new Date(localCategory.updatedAt);
      return {
        canAutoResolve: true,
        resolution: useServer ? serverCategory : localCategory,
        strategy: 'use-latest',
      };
    }

    if (serverCategory.color !== localCategory.color) {
      // Only color changed - use most recent
      const useServer = new Date(serverCategory.updatedAt) > new Date(localCategory.updatedAt);
      return {
        canAutoResolve: true,
        resolution: useServer ? serverCategory : localCategory,
        strategy: 'use-latest',
      };
    }

    return { canAutoResolve: false };
  }

  static getChangedFields(item1: any, item2: any): string[] {
    const changes: string[] = [];
    const keys = new Set([...Object.keys(item1), ...Object.keys(item2)]);

    for (const key of keys) {
      if (key === 'updatedAt' || key === 'lastSyncAt') continue;
      
      if (JSON.stringify(item1[key]) !== JSON.stringify(item2[key])) {
        changes.push(key);
      }
    }

    return changes;
  }

  static extractChanges(source: any, base: any): any {
    const changes: any = {};
    const changedFields = this.getChangedFields(source, base);

    for (const field of changedFields) {
      changes[field] = source[field];
    }

    return changes;
  }

  static performThreeWayMerge(conflict: DataConflict): any {
    const { serverVersion, localVersion, baseVersion } = conflict;
    
    if (!baseVersion) {
      throw new Error('Base version required for three-way merge');
    }

    const serverChanges = this.extractChanges(serverVersion, baseVersion);
    const localChanges = this.extractChanges(localVersion, baseVersion);

    // Start with base version
    const merged = { ...baseVersion };

    // Apply non-conflicting changes
    const serverFields = Object.keys(serverChanges);
    const localFields = Object.keys(localChanges);
    const conflictingFields = serverFields.filter(field => localFields.includes(field));

    // Apply server changes that don't conflict
    for (const field of serverFields) {
      if (!conflictingFields.includes(field)) {
        merged[field] = serverChanges[field];
      }
    }

    // Apply local changes that don't conflict
    for (const field of localFields) {
      if (!conflictingFields.includes(field)) {
        merged[field] = localChanges[field];
      }
    }

    // Handle conflicting fields
    for (const field of conflictingFields) {
      if (field === 'tags' && Array.isArray(serverChanges[field]) && Array.isArray(localChanges[field])) {
        // Merge tags
        merged[field] = [...new Set([...serverChanges[field], ...localChanges[field]])];
      } else {
        // For other conflicts, prefer local changes (user's work)
        merged[field] = localChanges[field];
      }
    }

    // Update timestamp
    merged.updatedAt = new Date();

    return merged;
  }

  static createConflictSummary(conflicts: DataConflict[]): {
    total: number;
    byType: Record<string, number>;
    autoResolvable: number;
    requiresUserInput: number;
  } {
    const summary = {
      total: conflicts.length,
      byType: {} as Record<string, number>,
      autoResolvable: 0,
      requiresUserInput: 0,
    };

    for (const conflict of conflicts) {
      // Count by type
      summary.byType[conflict.type] = (summary.byType[conflict.type] || 0) + 1;

      // Check if auto-resolvable
      const resolution = this.resolveConflictAutomatically(conflict);
      if (resolution.canAutoResolve) {
        summary.autoResolvable++;
      } else {
        summary.requiresUserInput++;
      }
    }

    return summary;
  }

  static generateConflictDescription(conflict: DataConflict): string {
    const { type, serverVersion, localVersion, conflictType } = conflict;

    if (type === 'memo') {
      const changes = [];
      if (serverVersion.title !== localVersion.title) {
        changes.push(`title ("${localVersion.title}" vs "${serverVersion.title}")`);
      }
      if (serverVersion.content !== localVersion.content) {
        changes.push('content');
      }
      if (JSON.stringify(serverVersion.tags) !== JSON.stringify(localVersion.tags)) {
        changes.push('tags');
      }

      return `Memo "${localVersion.title}" has conflicting changes in: ${changes.join(', ')}`;
    } else {
      const changes = [];
      if (serverVersion.name !== localVersion.name) {
        changes.push(`name ("${localVersion.name}" vs "${serverVersion.name}")`);
      }
      if (serverVersion.color !== localVersion.color) {
        changes.push(`color (${localVersion.color} vs ${serverVersion.color})`);
      }

      return `Category "${localVersion.name}" has conflicting changes in: ${changes.join(', ')}`;
    }
  }
}

describe('ConflictResolver', () => {
  const baseMemo = createMockMemo({
    id: 'memo-1',
    title: 'Original Title',
    content: 'Original content',
    tags: ['original'],
    updatedAt: new Date('2023-01-01'),
    lastSyncAt: new Date('2023-01-01'),
  });

  const baseCategory = createMockCategory({
    id: 'cat-1',
    name: 'Original Category',
    color: '#3B82F6',
    updatedAt: new Date('2023-01-01'),
    lastSyncAt: new Date('2023-01-01'),
  });

  describe('detectConflicts', () => {
    it('should detect memo conflicts', () => {
      const serverMemo = {
        ...baseMemo,
        title: 'Server Title',
        updatedAt: new Date('2023-01-02'),
      };

      const localMemo = {
        ...baseMemo,
        content: 'Local content',
        updatedAt: new Date('2023-01-02'),
      };

      const conflicts = ConflictResolver.detectConflicts([serverMemo], [localMemo]);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]).toMatchObject({
        id: 'memo-1',
        type: 'memo',
        conflictType: 'update',
      });
    });

    it('should not detect conflicts when only one side changed', () => {
      const serverMemo = {
        ...baseMemo,
        title: 'Server Title',
        updatedAt: new Date('2023-01-02'),
      };

      const localMemo = {
        ...baseMemo,
        updatedAt: new Date('2023-01-01'), // Not changed locally
      };

      const conflicts = ConflictResolver.detectConflicts([serverMemo], [localMemo]);

      expect(conflicts).toHaveLength(0);
    });

    it('should detect category conflicts', () => {
      const serverCategory = {
        ...baseCategory,
        name: 'Server Category',
        updatedAt: new Date('2023-01-02'),
      };

      const localCategory = {
        ...baseCategory,
        color: '#10B981',
        updatedAt: new Date('2023-01-02'),
      };

      const conflicts = ConflictResolver.detectConflicts([serverCategory], [localCategory]);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]).toMatchObject({
        id: 'cat-1',
        type: 'category',
        conflictType: 'update',
      });
    });
  });

  describe('resolveConflictAutomatically', () => {
    it('should auto-resolve non-conflicting memo changes', () => {
      const serverMemo = {
        ...baseMemo,
        title: 'Server Title',
        updatedAt: new Date('2023-01-02'),
      };

      const localMemo = {
        ...baseMemo,
        content: 'Local content',
        updatedAt: new Date('2023-01-02'),
      };

      const conflict: DataConflict = {
        id: 'memo-1',
        type: 'memo',
        serverVersion: serverMemo,
        localVersion: localMemo,
        conflictType: 'update',
        timestamp: new Date(),
      };

      const result = ConflictResolver.resolveConflictAutomatically(conflict);

      expect(result.canAutoResolve).toBe(true);
      expect(result.strategy).toBe('merge');
      expect(result.resolution).toMatchObject({
        title: 'Server Title',
        content: 'Local content',
      });
    });

    it('should auto-resolve tag conflicts by merging', () => {
      const serverMemo = {
        ...baseMemo,
        tags: ['server', 'tag'],
        updatedAt: new Date('2023-01-02'),
      };

      const localMemo = {
        ...baseMemo,
        tags: ['local', 'tag'],
        updatedAt: new Date('2023-01-02'),
      };

      const conflict: DataConflict = {
        id: 'memo-1',
        type: 'memo',
        serverVersion: serverMemo,
        localVersion: localMemo,
        conflictType: 'update',
        timestamp: new Date(),
      };

      const result = ConflictResolver.resolveConflictAutomatically(conflict);

      expect(result.canAutoResolve).toBe(true);
      expect(result.strategy).toBe('merge-tags');
      expect(result.resolution.tags).toEqual(expect.arrayContaining(['server', 'local', 'tag']));
    });

    it('should not auto-resolve conflicting title and content changes', () => {
      const serverMemo = {
        ...baseMemo,
        title: 'Server Title',
        content: 'Server content',
        updatedAt: new Date('2023-01-02'),
      };

      const localMemo = {
        ...baseMemo,
        title: 'Local Title',
        content: 'Local content',
        updatedAt: new Date('2023-01-02'),
      };

      const conflict: DataConflict = {
        id: 'memo-1',
        type: 'memo',
        serverVersion: serverMemo,
        localVersion: localMemo,
        conflictType: 'update',
        timestamp: new Date(),
      };

      const result = ConflictResolver.resolveConflictAutomatically(conflict);

      expect(result.canAutoResolve).toBe(false);
    });

    it('should auto-resolve category conflicts using latest timestamp', () => {
      const serverCategory = {
        ...baseCategory,
        name: 'Server Category',
        updatedAt: new Date('2023-01-03'),
      };

      const localCategory = {
        ...baseCategory,
        name: 'Local Category',
        updatedAt: new Date('2023-01-02'),
      };

      const conflict: DataConflict = {
        id: 'cat-1',
        type: 'category',
        serverVersion: serverCategory,
        localVersion: localCategory,
        conflictType: 'update',
        timestamp: new Date(),
      };

      const result = ConflictResolver.resolveConflictAutomatically(conflict);

      expect(result.canAutoResolve).toBe(true);
      expect(result.strategy).toBe('use-latest');
      expect(result.resolution.name).toBe('Server Category');
    });
  });

  describe('performThreeWayMerge', () => {
    it('should perform three-way merge successfully', () => {
      const baseVersion = baseMemo;
      
      const serverVersion = {
        ...baseMemo,
        title: 'Server Title',
        updatedAt: new Date('2023-01-02'),
      };

      const localVersion = {
        ...baseMemo,
        content: 'Local content',
        tags: ['local', 'tag'],
        updatedAt: new Date('2023-01-02'),
      };

      const conflict: DataConflict = {
        id: 'memo-1',
        type: 'memo',
        serverVersion,
        localVersion,
        baseVersion,
        conflictType: 'update',
        timestamp: new Date(),
      };

      const merged = ConflictResolver.performThreeWayMerge(conflict);

      expect(merged).toMatchObject({
        title: 'Server Title', // From server
        content: 'Local content', // From local
        tags: ['local', 'tag'], // From local
      });
    });

    it('should merge tags in three-way merge', () => {
      const baseVersion = {
        ...baseMemo,
        tags: ['original'],
      };
      
      const serverVersion = {
        ...baseMemo,
        tags: ['original', 'server'],
        updatedAt: new Date('2023-01-02'),
      };

      const localVersion = {
        ...baseMemo,
        tags: ['original', 'local'],
        updatedAt: new Date('2023-01-02'),
      };

      const conflict: DataConflict = {
        id: 'memo-1',
        type: 'memo',
        serverVersion,
        localVersion,
        baseVersion,
        conflictType: 'update',
        timestamp: new Date(),
      };

      const merged = ConflictResolver.performThreeWayMerge(conflict);

      expect(merged.tags).toEqual(expect.arrayContaining(['original', 'server', 'local']));
    });

    it('should prefer local changes for conflicting fields', () => {
      const baseVersion = baseMemo;
      
      const serverVersion = {
        ...baseMemo,
        title: 'Server Title',
        updatedAt: new Date('2023-01-02'),
      };

      const localVersion = {
        ...baseMemo,
        title: 'Local Title',
        updatedAt: new Date('2023-01-02'),
      };

      const conflict: DataConflict = {
        id: 'memo-1',
        type: 'memo',
        serverVersion,
        localVersion,
        baseVersion,
        conflictType: 'update',
        timestamp: new Date(),
      };

      const merged = ConflictResolver.performThreeWayMerge(conflict);

      expect(merged.title).toBe('Local Title');
    });
  });

  describe('createConflictSummary', () => {
    it('should create accurate conflict summary', () => {
      const conflicts: DataConflict[] = [
        {
          id: 'memo-1',
          type: 'memo',
          serverVersion: { ...baseMemo, title: 'Server' },
          localVersion: { ...baseMemo, content: 'Local' },
          conflictType: 'update',
          timestamp: new Date(),
        },
        {
          id: 'memo-2',
          type: 'memo',
          serverVersion: { ...baseMemo, title: 'Server', content: 'Server' },
          localVersion: { ...baseMemo, title: 'Local', content: 'Local' },
          conflictType: 'update',
          timestamp: new Date(),
        },
        {
          id: 'cat-1',
          type: 'category',
          serverVersion: { ...baseCategory, name: 'Server' },
          localVersion: { ...baseCategory, name: 'Local' },
          conflictType: 'update',
          timestamp: new Date(),
        },
      ];

      const summary = ConflictResolver.createConflictSummary(conflicts);

      expect(summary.total).toBe(3);
      expect(summary.byType.memo).toBe(2);
      expect(summary.byType.category).toBe(1);
      expect(summary.autoResolvable).toBe(2); // First memo and category
      expect(summary.requiresUserInput).toBe(1); // Second memo
    });
  });

  describe('generateConflictDescription', () => {
    it('should generate memo conflict description', () => {
      const conflict: DataConflict = {
        id: 'memo-1',
        type: 'memo',
        serverVersion: { ...baseMemo, title: 'Server Title', content: 'Server content' },
        localVersion: { ...baseMemo, title: 'Local Title', tags: ['local'] },
        conflictType: 'update',
        timestamp: new Date(),
      };

      const description = ConflictResolver.generateConflictDescription(conflict);

      expect(description).toContain('Memo "Local Title"');
      expect(description).toContain('title');
      expect(description).toContain('content');
      expect(description).toContain('tags');
    });

    it('should generate category conflict description', () => {
      const conflict: DataConflict = {
        id: 'cat-1',
        type: 'category',
        serverVersion: { ...baseCategory, name: 'Server Category', color: '#FF0000' },
        localVersion: { ...baseCategory, name: 'Local Category' },
        conflictType: 'update',
        timestamp: new Date(),
      };

      const description = ConflictResolver.generateConflictDescription(conflict);

      expect(description).toContain('Category "Local Category"');
      expect(description).toContain('name');
      expect(description).toContain('color');
    });
  });

  describe('edge cases', () => {
    it('should handle empty arrays', () => {
      const conflicts = ConflictResolver.detectConflicts([], []);
      expect(conflicts).toHaveLength(0);
    });

    it('should handle missing lastSyncAt', () => {
      const serverMemo = {
        ...baseMemo,
        title: 'Server Title',
        updatedAt: new Date('2023-01-02'),
      };

      const localMemo = {
        ...baseMemo,
        content: 'Local content',
        updatedAt: new Date('2023-01-02'),
        lastSyncAt: undefined,
      };

      const conflicts = ConflictResolver.detectConflicts([serverMemo], [localMemo]);
      expect(conflicts).toHaveLength(1);
    });

    it('should handle null/undefined values in fields', () => {
      const serverMemo = {
        ...baseMemo,
        categoryId: null,
        updatedAt: new Date('2023-01-02'),
      };

      const localMemo = {
        ...baseMemo,
        categoryId: 'cat-1',
        updatedAt: new Date('2023-01-02'),
      };

      const conflict: DataConflict = {
        id: 'memo-1',
        type: 'memo',
        serverVersion: serverMemo,
        localVersion: localMemo,
        conflictType: 'update',
        timestamp: new Date(),
      };

      const result = ConflictResolver.resolveConflictAutomatically(conflict);
      expect(result.canAutoResolve).toBe(true);
    });
  });
});