import axios, { type AxiosInstance, type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';
import { useAppStore } from '../stores/appStore';
import { useSyncStore } from '../stores/syncStore';
import type { ApiError as SharedApiError, ApiResponse as SharedApiResponse } from '@memo-app/shared/types';
import { ErrorCode } from '@memo-app/shared/constants';

// Re-export shared types for consistency
export type ApiError = SharedApiError;
export type ApiResponse<T = unknown> = SharedApiResponse<T>;

// Network status tracking
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

// Create axios instance
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    (config) => {
      const { token } = useAuthStore.getState();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for error handling and token refresh
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Handle network errors
      if (!error.response) {
        useAppStore.getState().setOnlineStatus(false);
        useSyncStore.getState().setOnlineStatus(false);
        const apiError: ApiError = {
          code: ErrorCode.NETWORK_ERROR,
          message: 'Network connection failed. Please check your internet connection.',
          timestamp: new Date(),
          requestId: 'network-error',
        };
        return Promise.reject(apiError);
      }

      // Handle 401 errors (unauthorized) with token refresh
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        if (isRefreshing) {
          // If already refreshing, queue the request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return client(originalRequest);
          }).catch((err) => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const { refreshToken } = useAuthStore.getState();
          if (refreshToken) {
            const response = await axios.post(`${client.defaults.baseURL}/auth/refresh`, {
              refreshToken,
            });

            const { token: newToken, refreshToken: newRefreshToken, user } = response.data.data;
            
            useAuthStore.getState().setAuth(user, newToken, newRefreshToken);
            
            // Process queued requests
            failedQueue.forEach(({ resolve }) => resolve(newToken));
            failedQueue = [];
            
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return client(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, clear auth and redirect to login
          failedQueue.forEach(({ reject }) => reject(refreshError));
          failedQueue = [];
          
          useAuthStore.getState().clearAuth();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Handle other HTTP errors
      const responseData = error.response?.data as Record<string, unknown> | undefined;
      const apiError: ApiError = {
        code: (responseData?.code as ErrorCode) || (`HTTP_${error.response?.status}` as ErrorCode) || ErrorCode.UNKNOWN_ERROR,
        message: (responseData?.message as string) || error.message || 'An unexpected error occurred',
        details: responseData?.details as Record<string, unknown> | undefined,
        timestamp: new Date(),
        requestId: (error.response?.headers?.['x-request-id'] as string) || 'unknown',
      };

      // Update online status for certain errors
      if (error.response?.status >= 500) {
        useAppStore.getState().setOnlineStatus(false);
        useSyncStore.getState().setOnlineStatus(false);
      }

      return Promise.reject(apiError);
    }
  );

  return client;
};

// Create the API client instance
export const apiClient = createApiClient();

// Generic API methods
export const api = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<T>>(url, { params }).then((res) => {
      if (!res.data.success) {
        throw new Error(res.data.message || 'Request failed');
      }
      return res.data;
    }),

  post: <T>(url: string, data?: unknown) =>
    apiClient.post<ApiResponse<T>>(url, data).then((res) => {
      if (!res.data.success) {
        throw new Error(res.data.message || 'Request failed');
      }
      return res.data;
    }),

  put: <T>(url: string, data?: unknown) =>
    apiClient.put<ApiResponse<T>>(url, data).then((res) => {
      if (!res.data.success) {
        throw new Error(res.data.message || 'Request failed');
      }
      return res.data;
    }),

  patch: <T>(url: string, data?: unknown) =>
    apiClient.patch<ApiResponse<T>>(url, data).then((res) => {
      if (!res.data.success) {
        throw new Error(res.data.message || 'Request failed');
      }
      return res.data;
    }),

  delete: <T>(url: string) =>
    apiClient.delete<ApiResponse<T>>(url).then((res) => {
      if (!res.data.success) {
        throw new Error(res.data.message || 'Request failed');
      }
      return res.data;
    }),
};

// Utility function to handle API errors
export const handleApiError = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as ApiError).message;
  }
  return 'An unexpected error occurred';
};
// Network status monitoring
export const setupNetworkMonitoring = () => {
  const updateOnlineStatus = () => {
    useAppStore.getState().setOnlineStatus(navigator.onLine);
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', updateOnlineStatus);
    window.removeEventListener('offline', updateOnlineStatus);
  };
};

// Retry utility for failed requests
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx) except 408 (timeout)
      if (error && typeof error === 'object' && 'code' in error) {
        const apiError = error as unknown as ApiError;
        const codeStr = String(apiError.code);
        if (codeStr.startsWith('4') && codeStr !== '408') {
          throw error;
        }
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }

  throw lastError;
};

// Enhanced API methods with retry logic
export const apiWithRetry = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    retryRequest(() => api.get<T>(url, params)),

  post: <T>(url: string, data?: unknown) =>
    retryRequest(() => api.post<T>(url, data)),

  put: <T>(url: string, data?: unknown) =>
    retryRequest(() => api.put<T>(url, data)),

  patch: <T>(url: string, data?: unknown) =>
    retryRequest(() => api.patch<T>(url, data)),

  delete: <T>(url: string) =>
    retryRequest(() => api.delete<T>(url)),
};