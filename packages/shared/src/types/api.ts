export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: Date;
  requestId: string;
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  requestId: string;
}

// ErrorCode is imported from constants
import { ErrorCode } from '../constants/errors';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Sync-related types
export interface SyncRequest {
  lastSyncTimestamp?: Date;
  offlineChanges?: OfflineChange[];
}

export interface SyncResult {
  updatedMemos: SyncEntity[];
  deletedMemoIds: string[];
  updatedCategories: SyncEntity[];
  deletedCategoryIds: string[];
  conflicts: DataConflict[];
  lastSyncTimestamp: Date;
}

export interface SyncEntity {
  id: string;
  updatedAt: Date;
  syncVersion: number;
  data: any;
}

export interface DataConflict {
  id: string;
  type: 'memo' | 'category';
  localVersion: any;
  serverVersion: any;
  conflictFields: string[];
  localSyncVersion: number;
  serverSyncVersion: number;
}

export interface OfflineChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'memo' | 'category';
  data: any;
  timestamp: Date;
  clientId?: string; // For conflict resolution
}

export interface ConflictResolution {
  conflictId: string;
  resolution: 'local' | 'server' | 'merge';
  mergedData?: any;
}

export interface BatchUpdateRequest {
  changes: OfflineChange[];
}

export interface BatchUpdateResult {
  processed: number;
  conflicts: DataConflict[];
  errors: Array<{ changeId: string; error: string }>;
}

export interface SyncStatus {
  memos: Array<{ id: string; syncVersion: number; lastSyncAt?: Date; hasConflicts: boolean }>;
  categories: Array<{ id: string; syncVersion: number; lastSyncAt?: Date; hasConflicts: boolean }>;
  pendingChanges: number;
}

export interface AutoResolveResult {
  resolved: number;
  remainingConflicts: number;
}

export interface ThreeWayMergeResult {
  merged: any;
  conflicts: string[];
  autoResolved: string[];
}