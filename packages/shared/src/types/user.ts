export interface User {
  id: string;
  email: string;
  name: string;
  preferences: UserPreferences;
  createdAt: Date;
  lastLoginAt: Date;
  emailVerified: boolean;
}

import type { ReminderFrequency } from '../constants/notifications';

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'en' | 'fr';
  reminderFrequency: ReminderFrequency;
  notificationsEnabled: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export interface AuthResult {
  user: User;
  token: string;
  refreshToken: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  name?: string;
  preferences?: Partial<UserPreferences>;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}