import { ErrorCode, ERROR_MESSAGES } from '@memo-app/shared/constants';
import { useNotificationStore } from '../stores/notificationStore';
import { useAuthStore } from '../stores/authStore';
import { useSyncStore } from '../stores/syncStore';
import type { ApiError } from './api';

interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  redirectOnAuth?: boolean;
  retryable?: boolean;
}

const defaultOptions: ErrorHandlerOptions = {
  showToast: true,
  logError: true,
  redirectOnAuth: true,
  retryable: false,
};

/**
 * Centralized error handler for API and application errors
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle API errors with appropriate user feedback and state updates
   */
  handleApiError(error: unknown, options: ErrorHandlerOptions = {}): string {
    const opts = { ...defaultOptions, ...options };
    const apiError = this.normalizeError(error);
    
    // Log error if enabled
    if (opts.logError && import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('API Error:', apiError);
    }

    // Handle specific error types
    this.handleSpecificErrors(apiError, opts);

    // Show toast notification if enabled
    if (opts.showToast) {
      this.showErrorToast(apiError, opts.retryable);
    }

    return apiError.message;
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(error: unknown, options: ErrorHandlerOptions = {}): void {
    const apiError = this.normalizeError(error);
    
    // Clear auth state for auth-related errors
    if (this.isAuthError(apiError.code)) {
      useAuthStore.getState().clearAuth();
      
      if (options.redirectOnAuth !== false) {
        // Redirect to login page
        window.location.href = '/login';
      }
    }

    this.handleApiError(error, options);
  }

  /**
   * Handle sync errors
   */
  handleSyncError(error: unknown, options: ErrorHandlerOptions = {}): void {
    const apiError = this.normalizeError(error);
    const syncStore = useSyncStore.getState();
    
    // Update sync state
    syncStore.setSyncing(false);
    syncStore.addSyncError(apiError.message);
    
    // Handle network errors
    if (apiError.code === ErrorCode.NETWORK_ERROR) {
      syncStore.setOnlineStatus(false);
    }

    this.handleApiError(error, { ...options, showToast: false }); // Don't show toast for sync errors
  }

  /**
   * Handle validation errors with field-specific feedback
   */
  handleValidationError(error: unknown, fieldErrors?: Record<string, string>): Record<string, string> {
    const apiError = this.normalizeError(error);
    
    if (fieldErrors && apiError.details) {
      // Merge API validation errors with field errors
      return { ...fieldErrors, ...apiError.details };
    }

    // Show general validation error
    this.showErrorToast(apiError);
    
    return fieldErrors || {};
  }

  /**
   * Normalize different error types to ApiError format
   */
  private normalizeError(error: unknown): ApiError {
    // Already an ApiError
    if (this.isApiError(error)) {
      return error;
    }

    // Standard Error object
    if (error instanceof Error) {
      return {
        code: ErrorCode.UNKNOWN_ERROR,
        message: error.message || 'An unexpected error occurred',
        timestamp: new Date(),
        requestId: 'client-error',
      };
    }

    // String error
    if (typeof error === 'string') {
      return {
        code: ErrorCode.UNKNOWN_ERROR,
        message: error,
        timestamp: new Date(),
        requestId: 'client-error',
      };
    }

    // Unknown error type
    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message: 'An unexpected error occurred',
      timestamp: new Date(),
      requestId: 'unknown-error',
    };
  }

  /**
   * Check if error is an ApiError
   */
  private isApiError(error: unknown): error is ApiError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error &&
      'timestamp' in error
    );
  }

  /**
   * Check if error code is authentication-related
   */
  private isAuthError(code: ErrorCode): boolean {
    return [
      ErrorCode.AUTHENTICATION_ERROR,
      ErrorCode.AUTHORIZATION_ERROR,
      ErrorCode.TOKEN_EXPIRED,
      ErrorCode.TOKEN_INVALID,
      ErrorCode.INVALID_CREDENTIALS,
    ].includes(code);
  }

  /**
   * Handle specific error types with custom logic
   */
  private handleSpecificErrors(error: ApiError, _options: ErrorHandlerOptions): void {
    switch (error.code) {
      case ErrorCode.NETWORK_ERROR:
        useSyncStore.getState().setOnlineStatus(false);
        break;
        
      case ErrorCode.RATE_LIMIT_EXCEEDED:
        // Could implement exponential backoff here
        break;
        
      case ErrorCode.SYNC_CONFLICT:
        // Handle sync conflicts
        if (error.details) {
          useSyncStore.getState().addConflict({
            id: `conflict-${Date.now()}`,
            type: error.details.type as 'memo' | 'category',
            localVersion: error.details.local,
            serverVersion: error.details.server,
            timestamp: new Date(),
          });
        }
        break;
        
      default:
        // No special handling needed
        break;
    }
  }

  /**
   * Show error toast with appropriate styling and actions
   */
  private showErrorToast(error: ApiError, retryable: boolean = false): void {
    const notificationStore = useNotificationStore.getState();
    
    // Get user-friendly message
    const message = ERROR_MESSAGES[error.code] || error.message;
    
    notificationStore.addToast({
      type: 'error',
      title: this.getErrorTitle(error.code),
      message,
      duration: retryable ? 0 : 5000, // Don't auto-dismiss retryable errors
      action: retryable ? {
        label: 'Retry',
        onClick: () => {
          // Retry logic would be implemented by the calling component
          // This is just a placeholder
        },
      } : undefined,
    });
  }

  /**
   * Get appropriate title for error type
   */
  private getErrorTitle(code: ErrorCode): string {
    if (this.isAuthError(code)) {
      return 'Authentication Error';
    }
    
    if (code === ErrorCode.NETWORK_ERROR) {
      return 'Connection Error';
    }
    
    if (code === ErrorCode.VALIDATION_ERROR) {
      return 'Validation Error';
    }
    
    if (code === ErrorCode.RATE_LIMIT_EXCEEDED) {
      return 'Rate Limit Exceeded';
    }
    
    return 'Error';
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Convenience functions
export const handleApiError = (error: unknown, options?: ErrorHandlerOptions) => 
  errorHandler.handleApiError(error, options);

export const handleAuthError = (error: unknown, options?: ErrorHandlerOptions) => 
  errorHandler.handleAuthError(error, options);

export const handleSyncError = (error: unknown, options?: ErrorHandlerOptions) => 
  errorHandler.handleSyncError(error, options);

export const handleValidationError = (error: unknown, fieldErrors?: Record<string, string>) => 
  errorHandler.handleValidationError(error, fieldErrors);