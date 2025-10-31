import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ToastProvider } from '../providers/ToastProvider';

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          {children}
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  preferences: {
    theme: 'light' as const,
    language: 'en' as const,
    reminderFrequency: 'daily' as const,
    notificationsEnabled: true,
    fontSize: 'medium' as const,
  },
  createdAt: new Date(),
  lastLoginAt: new Date(),
  ...overrides,
});

export const createMockMemo = (overrides = {}) => ({
  id: 'memo-1',
  title: 'Test Memo',
  content: 'This is a test memo content',
  tags: ['test', 'example'],
  categoryId: 'cat-1',
  userId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  lastReviewedAt: null,
  reviewCount: 0,
  difficultyLevel: 3,
  easeFactor: 2.5,
  intervalDays: 1,
  repetitions: 0,
  nextReviewAt: null,
  category: {
    id: 'cat-1',
    name: 'Test Category',
    color: '#3B82F6',
    userId: 'user-1',
    memoCount: 1,
  },
  ...overrides,
});

export const createMockCategory = (overrides = {}) => ({
  id: 'cat-1',
  name: 'Test Category',
  color: '#3B82F6',
  userId: 'user-1',
  memoCount: 5,
  ...overrides,
});

export const createMockQuizSession = (overrides = {}) => ({
  id: 'session-1',
  userId: 'user-1',
  startedAt: new Date(),
  completedAt: null,
  totalQuestions: 5,
  correctAnswers: 0,
  status: 'active' as const,
  questions: [
    {
      id: 'q1',
      memoId: 'memo-1',
      type: 'recall' as const,
      question: 'What do you remember about: "Test Memo"?',
      correctAnswer: 'Test memo content',
    },
  ],
  currentQuestionIndex: 0,
  ...overrides,
});

// Mock API responses
export const mockApiResponse = <T,>(data: T, delay = 0) => {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

export const mockApiError = (message: string, status = 400, delay = 0) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(message) as any;
      error.response = { status, data: { message } };
      reject(error);
    }, delay);
  });
};

// Mock Zustand stores
export const createMockAuthStore = (overrides = {}) => ({
  user: createMockUser(),
  token: 'mock-token',
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  updateProfile: vi.fn(),
  ...overrides,
});

export const createMockMemoStore = (overrides = {}) => ({
  memos: [createMockMemo()],
  selectedMemo: null,
  isLoading: false,
  error: null,
  fetchMemos: vi.fn(),
  createMemo: vi.fn(),
  updateMemo: vi.fn(),
  deleteMemo: vi.fn(),
  selectMemo: vi.fn(),
  ...overrides,
});

// Test utilities
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.IntersectionObserver = mockIntersectionObserver;
};

export const mockResizeObserver = () => {
  const mockResizeObserver = vi.fn();
  mockResizeObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.ResizeObserver = mockResizeObserver;
};