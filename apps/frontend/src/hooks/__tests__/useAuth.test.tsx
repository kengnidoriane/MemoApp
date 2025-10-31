import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '../useAuth';
import { createMockUser } from '../../test/utils';

// Mock the auth service
vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

// Mock the auth store
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useAuth', () => {
  const mockUser = createMockUser();
  const mockAuthStore = {
    user: null,
    token: null,
    isAuthenticated: false,
    setUser: vi.fn(),
    setToken: vi.fn(),
    clearAuth: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    const { useAuthStore } = require('../../stores/authStore');
    useAuthStore.mockReturnValue(mockAuthStore);
  });

  it('should initialize with unauthenticated state', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should login successfully with valid credentials', async () => {
    const { authService } = require('../../services/authService');
    const loginResponse = {
      user: mockUser,
      token: 'mock-token',
    };
    authService.login.mockResolvedValue(loginResponse);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(mockAuthStore.setUser).toHaveBeenCalledWith(mockUser);
    expect(mockAuthStore.setToken).toHaveBeenCalledWith('mock-token');
  });

  it('should handle login failure', async () => {
    const { authService } = require('../../services/authService');
    const loginError = new Error('Invalid credentials');
    authService.login.mockRejectedValue(loginError);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        });
      } catch (error) {
        expect(error).toBe(loginError);
      }
    });

    expect(mockAuthStore.setUser).not.toHaveBeenCalled();
    expect(mockAuthStore.setToken).not.toHaveBeenCalled();
  });

  it('should register successfully with valid data', async () => {
    const { authService } = require('../../services/authService');
    const registerResponse = {
      user: mockUser,
      token: 'mock-token',
    };
    authService.register.mockResolvedValue(registerResponse);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });
    });

    expect(authService.register).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });
    expect(mockAuthStore.setUser).toHaveBeenCalledWith(mockUser);
    expect(mockAuthStore.setToken).toHaveBeenCalledWith('mock-token');
  });

  it('should handle registration failure', async () => {
    const { authService } = require('../../services/authService');
    const registerError = new Error('Email already exists');
    authService.register.mockRejectedValue(registerError);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.register({
          email: 'existing@example.com',
          password: 'password123',
          name: 'Test User',
        });
      } catch (error) {
        expect(error).toBe(registerError);
      }
    });

    expect(mockAuthStore.setUser).not.toHaveBeenCalled();
    expect(mockAuthStore.setToken).not.toHaveBeenCalled();
  });

  it('should logout successfully', async () => {
    const { authService } = require('../../services/authService');
    authService.logout.mockResolvedValue(undefined);

    // Start with authenticated state
    const authenticatedStore = {
      ...mockAuthStore,
      user: mockUser,
      token: 'mock-token',
      isAuthenticated: true,
    };
    const { useAuthStore } = require('../../stores/authStore');
    useAuthStore.mockReturnValue(authenticatedStore);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(authService.logout).toHaveBeenCalled();
    expect(mockAuthStore.clearAuth).toHaveBeenCalled();
  });

  it('should handle logout failure gracefully', async () => {
    const { authService } = require('../../services/authService');
    authService.logout.mockRejectedValue(new Error('Network error'));

    const authenticatedStore = {
      ...mockAuthStore,
      user: mockUser,
      token: 'mock-token',
      isAuthenticated: true,
    };
    const { useAuthStore } = require('../../stores/authStore');
    useAuthStore.mockReturnValue(authenticatedStore);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.logout();
    });

    // Should still clear local auth state even if server request fails
    expect(mockAuthStore.clearAuth).toHaveBeenCalled();
  });

  it('should refresh token successfully', async () => {
    const { authService } = require('../../services/authService');
    const newToken = 'new-mock-token';
    authService.refreshToken.mockResolvedValue({ token: newToken });

    const authenticatedStore = {
      ...mockAuthStore,
      user: mockUser,
      token: 'old-token',
      isAuthenticated: true,
    };
    const { useAuthStore } = require('../../stores/authStore');
    useAuthStore.mockReturnValue(authenticatedStore);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.refreshToken();
    });

    expect(authService.refreshToken).toHaveBeenCalled();
    expect(mockAuthStore.setToken).toHaveBeenCalledWith(newToken);
  });

  it('should handle token refresh failure', async () => {
    const { authService } = require('../../services/authService');
    authService.refreshToken.mockRejectedValue(new Error('Token expired'));

    const authenticatedStore = {
      ...mockAuthStore,
      user: mockUser,
      token: 'expired-token',
      isAuthenticated: true,
    };
    const { useAuthStore } = require('../../stores/authStore');
    useAuthStore.mockReturnValue(authenticatedStore);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.refreshToken();
      } catch (error) {
        expect(error.message).toBe('Token expired');
      }
    });

    // Should clear auth state on refresh failure
    expect(mockAuthStore.clearAuth).toHaveBeenCalled();
  });

  it('should update user profile successfully', async () => {
    const { authService } = require('../../services/authService');
    const updatedUser = { ...mockUser, name: 'Updated Name' };
    authService.updateProfile = vi.fn().mockResolvedValue(updatedUser);

    const authenticatedStore = {
      ...mockAuthStore,
      user: mockUser,
      token: 'mock-token',
      isAuthenticated: true,
    };
    const { useAuthStore } = require('../../stores/authStore');
    useAuthStore.mockReturnValue(authenticatedStore);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.updateProfile({ name: 'Updated Name' });
    });

    expect(authService.updateProfile).toHaveBeenCalledWith({ name: 'Updated Name' });
    expect(mockAuthStore.setUser).toHaveBeenCalledWith(updatedUser);
  });

  it('should handle profile update failure', async () => {
    const { authService } = require('../../services/authService');
    const updateError = new Error('Validation failed');
    authService.updateProfile = vi.fn().mockRejectedValue(updateError);

    const authenticatedStore = {
      ...mockAuthStore,
      user: mockUser,
      token: 'mock-token',
      isAuthenticated: true,
    };
    const { useAuthStore } = require('../../stores/authStore');
    useAuthStore.mockReturnValue(authenticatedStore);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.updateProfile({ name: '' });
      } catch (error) {
        expect(error).toBe(updateError);
      }
    });

    expect(mockAuthStore.setUser).not.toHaveBeenCalled();
  });

  it('should track loading states correctly', async () => {
    const { authService } = require('../../services/authService');
    let resolveLogin: (value: any) => void;
    const loginPromise = new Promise(resolve => {
      resolveLogin = resolve;
    });
    authService.login.mockReturnValue(loginPromise);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // Start login
    act(() => {
      result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    // Should be loading
    expect(result.current.isLoading).toBe(true);

    // Resolve login
    await act(async () => {
      resolveLogin!({
        user: mockUser,
        token: 'mock-token',
      });
      await loginPromise;
    });

    // Should not be loading anymore
    expect(result.current.isLoading).toBe(false);
  });

  it('should persist authentication state', () => {
    const authenticatedStore = {
      ...mockAuthStore,
      user: mockUser,
      token: 'mock-token',
      isAuthenticated: true,
    };
    const { useAuthStore } = require('../../stores/authStore');
    useAuthStore.mockReturnValue(authenticatedStore);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.user).toBe(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });
});