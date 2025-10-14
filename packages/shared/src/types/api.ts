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
export interface SyncResult {
  updatedMemos: Array<{ id: string; updatedAt: Date; data: any }>;
  deletedMemoIds: string[];
  updatedCategories: Array<{ id: string; updatedAt: Date; data: any }>;
  deletedCategoryIds: string[];
  conflicts: DataConflict[];
  lastSyncTimestamp: Date;
}

export interface DataConflict {
  id: string;
  type: 'memo' | 'category';
  localVersion: any;
  serverVersion: any;
  conflictFields: string[];
}

export interface OfflineChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'memo' | 'category';
  data: any;
  timestamp: Date;
}