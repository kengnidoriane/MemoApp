import { api } from '../lib/api';
import type { 
  User, 
  LoginRequest, 
  CreateUserRequest,
  AuthResult,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateUserRequest
} from '@memo-app/shared/types';

export const authService = {
  // Authentication endpoints
  login: async (credentials: LoginRequest): Promise<AuthResult> => {
    const response = await api.post<AuthResult>('/auth/login', credentials);
    return response.data as AuthResult;
  },

  register: async (userData: CreateUserRequest): Promise<AuthResult> => {
    const response = await api.post<AuthResult>('/auth/register', userData);
    return response.data as AuthResult;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  refreshToken: async (refreshToken: string): Promise<AuthResult> => {
    const response = await api.post<AuthResult>('/auth/refresh', { refreshToken });
    return response.data as AuthResult;
  },

  // Password management
  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
    await api.post('/auth/reset-password', data);
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await api.put('/auth/change-password', data);
  },

  // Email verification
  verifyEmail: async (token: string): Promise<void> => {
    await api.post('/auth/verify-email', { token });
  },

  resendVerification: async (email: string): Promise<void> => {
    await api.post('/auth/resend-verification', { email });
  },

  // Profile management
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/users/profile');
    return response.data as User;
  },

  updateProfile: async (updates: UpdateUserRequest): Promise<User> => {
    const response = await api.put<User>('/users/profile', updates);
    return response.data as User;
  },

  deleteAccount: async (): Promise<void> => {
    await api.delete('/users/profile');
  },
};