import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import type { 
  LoginRequest, 
  CreateUserRequest, 
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateUserRequest,
  User 
} from '@memo-app/shared/types';

// Query keys
export const authKeys = {
  profile: ['auth', 'profile'] as const,
};

// Auth hooks
export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const setLoading = useAuthStore((state) => state.setLoading);

  return useMutation({
    mutationFn: authService.login,
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token, data.refreshToken);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

export const useRegister = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const setLoading = useAuthStore((state) => state.setLoading);

  return useMutation({
    mutationFn: authService.register,
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token, data.refreshToken);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

export const useLogout = () => {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      clearAuth();
      queryClient.clear(); // Clear all cached data
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: authService.forgotPassword,
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: authService.resetPassword,
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: authService.changePassword,
  });
};

export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: authService.verifyEmail,
  });
};

export const useResendVerification = () => {
  return useMutation({
    mutationFn: authService.resendVerification,
  });
};

// Profile hooks
export const useProfile = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: authKeys.profile,
    queryFn: authService.getProfile,
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: (data: UpdateUserRequest) => authService.updateProfile(data),
    onSuccess: (updatedUser) => {
      // Update both the store and query cache
      updateUser(updatedUser);
      queryClient.setQueryData(authKeys.profile, updatedUser);
    },
  });
};

export const useDeleteAccount = () => {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.deleteAccount,
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
    },
  });
};