import { QueryClient } from '@tanstack/react-query';
import { handleApiError, type ApiError } from './api';
import { useAppStore } from '../stores/appStore';

// Custom retry function that considers network status
const customRetry = (failureCount: number, error: unknown) => {
  // Don't retry if offline
  if (!navigator.onLine) {
    return false;
  }

  // Don't retry on 4xx errors (client errors) except 408 (timeout)
  if (error && typeof error === 'object' && 'code' in error) {
    const apiError = error as unknown as ApiError;
    const codeStr = String(apiError.code);
    if (codeStr.startsWith('4') && codeStr !== '408') {
      return false;
    }
  }

  // Retry up to 3 times for other errors
  return failureCount < 3;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: customRetry,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: 'offlineFirst', // Allow queries to run offline if data is cached
      retryOnMount: true,
      refetchOnMount: 'always',
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations if offline
        if (!navigator.onLine) {
          return false;
        }
        
        // Don't retry on client errors
        if (error && typeof error === 'object' && 'code' in error) {
          const apiError = error as unknown as ApiError;
          const codeStr = String(apiError.code);
          if (codeStr.startsWith('4')) {
            return false;
          }
        }
        
        // Retry once for server errors
        return failureCount < 1;
      },
      networkMode: 'online', // Only run mutations when online
      onError: (error) => {
        // Global error handling for mutations
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('Mutation error:', handleApiError(error));
        }

        // Update app state for certain errors
        if (error && typeof error === 'object' && 'code' in error) {
          const apiError = error as unknown as ApiError;
          if (apiError.code === 'NETWORK_ERROR') {
            useAppStore.getState().setOnlineStatus(false);
          }
        }
      },
      onSuccess: () => {
        // Ensure we're marked as online after successful mutation
        if (navigator.onLine) {
          useAppStore.getState().setOnlineStatus(true);
        }
      },
    },
  },
});