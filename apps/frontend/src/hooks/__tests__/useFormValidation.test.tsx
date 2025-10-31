import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Validation schemas to test
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be 100 characters or less'),
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const memoSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(500, 'Title must be 500 characters or less'),
  content: z.string()
    .min(1, 'Content is required')
    .max(10000, 'Content must be 10000 characters or less'),
  tags: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
});

const categorySchema = z.object({
  name: z.string()
    .min(1, 'Category name is required')
    .max(50, 'Category name must be 50 characters or less'),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
});

// Custom hook for form validation
function useFormValidation<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  options?: {
    mode?: 'onChange' | 'onBlur' | 'onSubmit';
    defaultValues?: Partial<T>;
  }
) {
  return useForm<T>({
    resolver: zodResolver(schema),
    mode: options?.mode || 'onSubmit',
    defaultValues: options?.defaultValues,
  });
}

describe('Form Validation with React Hook Form + Zod', () => {
  describe('Login Form Validation', () => {
    it('should validate login form successfully with valid data', async () => {
      const { result } = renderHook(() =>
        useFormValidation(loginSchema, { mode: 'onChange' })
      );

      await act(async () => {
        result.current.setValue('email', 'test@example.com');
        result.current.setValue('password', 'SecurePass123!');
        await result.current.trigger();
      });

      expect(result.current.formState.isValid).toBe(true);
      expect(Object.keys(result.current.formState.errors)).toHaveLength(0);
    });

    it('should show email validation errors', async () => {
      const { result } = renderHook(() =>
        useFormValidation(loginSchema, { mode: 'onChange' })
      );

      // Test empty email
      await act(async () => {
        result.current.setValue('email', '');
        await result.current.trigger('email');
      });

      expect(result.current.formState.errors.email?.message).toBe('Email is required');

      // Test invalid email format
      await act(async () => {
        result.current.setValue('email', 'invalid-email');
        await result.current.trigger('email');
      });

      expect(result.current.formState.errors.email?.message).toBe('Invalid email format');
    });

    it('should show password validation errors', async () => {
      const { result } = renderHook(() =>
        useForm({
          resolver: zodResolver(loginSchema),
          mode: 'onChange',
        })
      );

      // Test empty password
      await act(async () => {
        result.current.setValue('password', '');
        await result.current.trigger('password');
      });

      expect(result.current.formState.errors.password?.message).toBe('Password must be at least 8 characters');

      // Test short password
      await act(async () => {
        result.current.setValue('password', '1234567');
        await result.current.trigger('password');
      });

      expect(result.current.formState.errors.password?.message).toBe('Password must be at least 8 characters');
    });
  });

  describe('Registration Form Validation', () => {
    it('should validate registration form successfully with valid data', async () => {
      const { result } = renderHook(() =>
        useForm({
          resolver: zodResolver(registerSchema),
          mode: 'onChange',
        })
      );

      await act(async () => {
        result.current.setValue('name', 'Test User');
        result.current.setValue('email', 'test@example.com');
        result.current.setValue('password', 'SecurePass123!');
        result.current.setValue('confirmPassword', 'SecurePass123!');
        result.current.setValue('acceptTerms', true);
        await result.current.trigger();
      });

      expect(result.current.formState.isValid).toBe(true);
      expect(Object.keys(result.current.formState.errors)).toHaveLength(0);
    });

    it('should validate name field', async () => {
      const { result } = renderHook(() =>
        useForm({
          resolver: zodResolver(registerSchema),
          mode: 'onChange',
        })
      );

      // Test empty name
      await act(async () => {
        result.current.setValue('name', '');
        await result.current.trigger('name');
      });

      expect(result.current.formState.errors.name?.message).toBe('Name must be at least 2 characters');

      // Test short name
      await act(async () => {
        result.current.setValue('name', 'a');
        await result.current.trigger('name');
      });

      expect(result.current.formState.errors.name?.message).toBe('Name must be at least 2 characters');

      // Test long name
      await act(async () => {
        result.current.setValue('name', 'a'.repeat(101));
        await result.current.trigger('name');
      });

      expect(result.current.formState.errors.name?.message).toBe('Name must be 100 characters or less');
    });

    it('should validate password strength requirements', async () => {
      const { result } = renderHook(() =>
        useForm({
          resolver: zodResolver(registerSchema),
          mode: 'onChange',
        })
      );

      // Test password without uppercase
      await act(async () => {
        result.current.setValue('password', 'password123!');
        await result.current.trigger('password');
      });

      expect(result.current.formState.errors.password?.message).toBe('Password must contain at least one uppercase letter');

      // Test password without lowercase
      await act(async () => {
        result.current.setValue('password', 'PASSWORD123!');
        await result.current.trigger('password');
      });

      expect(result.current.formState.errors.password?.message).toBe('Password must contain at least one lowercase letter');

      // Test password without number
      await act(async () => {
        result.current.setValue('password', 'Password!');
        await result.current.trigger('password');
      });

      expect(result.current.formState.errors.password?.message).toBe('Password must contain at least one number');

      // Test password without special character
      await act(async () => {
        result.current.setValue('password', 'Password123');
        await result.current.trigger('password');
      });

      expect(result.current.formState.errors.password?.message).toBe('Password must contain at least one special character');
    });

    it('should validate password confirmation', async () => {
      const { result } = renderHook(() =>
        useForm({
          resolver: zodResolver(registerSchema),
          mode: 'onChange',
        })
      );

      await act(async () => {
        result.current.setValue('password', 'SecurePass123!');
        result.current.setValue('confirmPassword', 'DifferentPass123!');
        await result.current.trigger();
      });

      expect(result.current.formState.errors.confirmPassword?.message).toBe('Passwords do not match');
    });

    it('should validate terms acceptance', async () => {
      const { result } = renderHook(() =>
        useForm({
          resolver: zodResolver(registerSchema),
          mode: 'onChange',
        })
      );

      await act(async () => {
        result.current.setValue('acceptTerms', false);
        await result.current.trigger('acceptTerms');
      });

      expect(result.current.formState.errors.acceptTerms?.message).toBe('You must accept the terms and conditions');
    });
  });

  describe('Memo Form Validation', () => {
    it('should validate memo form successfully with valid data', async () => {
      const { result } = renderHook(() =>
        useForm({
          resolver: zodResolver(memoSchema),
          mode: 'onChange',
        })
      );

      await act(async () => {
        result.current.setValue('title', 'Test Memo');
        result.current.setValue('content', 'This is test content');
        result.current.setValue('tags', ['test', 'memo']);
        result.current.setValue('categoryId', 'cat-1');
        await result.current.trigger();
      });

      expect(result.current.formState.isValid).toBe(true);
      expect(Object.keys(result.current.formState.errors)).toHaveLength(0);
    });

    it('should validate required fields', async () => {
      const { result } = renderHook(() =>
        useForm({
          resolver: zodResolver(memoSchema),
          mode: 'onChange',
        })
      );

      await act(async () => {
        result.current.setValue('title', '');
        result.current.setValue('content', '');
        await result.current.trigger();
      });

      expect(result.current.formState.errors.title?.message).toBe('Title is required');
      expect(result.current.formState.errors.content?.message).toBe('Content is required');
    });

    it('should validate field length limits', async () => {
      const { result } = renderHook(() =>
        useForm({
          resolver: zodResolver(memoSchema),
          mode: 'onChange',
        })
      );

      // Test title length
      await act(async () => {
        result.current.setValue('title', 'a'.repeat(501));
        await result.current.trigger('title');
      });

      expect(result.current.formState.errors.title?.message).toBe('Title must be 500 characters or less');

      // Test content length
      await act(async () => {
        result.current.setValue('content', 'a'.repeat(10001));
        await result.current.trigger('content');
      });

      expect(result.current.formState.errors.content?.message).toBe('Content must be 10000 characters or less');
    });
  });

  describe('Category Form Validation', () => {
    it('should validate category form successfully with valid data', async () => {
      const { result } = renderHook(() =>
        useForm({
          resolver: zodResolver(categorySchema),
          mode: 'onChange',
        })
      );

      await act(async () => {
        result.current.setValue('name', 'Test Category');
        result.current.setValue('color', '#3B82F6');
        await result.current.trigger();
      });

      expect(result.current.formState.isValid).toBe(true);
      expect(Object.keys(result.current.formState.errors)).toHaveLength(0);
    });

    it('should validate category name', async () => {
      const { result } = renderHook(() =>
        useForm({
          resolver: zodResolver(categorySchema),
          mode: 'onChange',
        })
      );

      // Test empty name
      await act(async () => {
        result.current.setValue('name', '');
        await result.current.trigger('name');
      });

      expect(result.current.formState.errors.name?.message).toBe('Category name is required');

      // Test long name
      await act(async () => {
        result.current.setValue('name', 'a'.repeat(51));
        await result.current.trigger('name');
      });

      expect(result.current.formState.errors.name?.message).toBe('Category name must be 50 characters or less');
    });

    it('should validate color format', async () => {
      const { result } = renderHook(() =>
        useForm({
          resolver: zodResolver(categorySchema),
          mode: 'onChange',
        })
      );

      const invalidColors = [
        'invalid-color',
        '#GGG',
        '#12345',
        '#1234567',
        'rgb(255, 0, 0)',
        'blue',
      ];

      for (const color of invalidColors) {
        await act(async () => {
          result.current.setValue('color', color);
          await result.current.trigger('color');
        });

        expect(result.current.formState.errors.color?.message).toBe('Invalid color format');
      }

      // Test valid colors
      const validColors = ['#FF0000', '#00FF00', '#0000FF', '#3B82F6', '#10B981'];

      for (const color of validColors) {
        await act(async () => {
          result.current.setValue('color', color);
          await result.current.trigger('color');
        });

        expect(result.current.formState.errors.color).toBeUndefined();
      }
    });
  });

  describe('Form State Management', () => {
    it('should track form dirty state', async () => {
      const { result } = renderHook(() =>
        useForm({
          resolver: zodResolver(loginSchema),
          defaultValues: {
            email: '',
            password: '',
          },
        })
      );

      expect(result.current.formState.isDirty).toBe(false);

      await act(async () => {
        result.current.setValue('email', 'test@example.com');
      });

      expect(result.current.formState.isDirty).toBe(true);
    });

    it('should track touched fields', async () => {
      const { result } = renderHook(() =>
        useForm({
          resolver: zodResolver(loginSchema),
          mode: 'onTouched',
        })
      );

      expect(result.current.formState.touchedFields.email).toBeUndefined();

      await act(async () => {
        result.current.trigger('email');
      });

      expect(result.current.formState.touchedFields.email).toBe(true);
    });

    it('should handle form submission', async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useForm({
          resolver: zodResolver(loginSchema),
        })
      );

      await act(async () => {
        result.current.setValue('email', 'test@example.com');
        result.current.setValue('password', 'SecurePass123!');
      });

      await act(async () => {
        await result.current.handleSubmit(onSubmit)();
      });

      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'SecurePass123!',
      });
    });

    it('should prevent submission with invalid data', async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useForm({
          resolver: zodResolver(loginSchema),
        })
      );

      await act(async () => {
        result.current.setValue('email', 'invalid-email');
        result.current.setValue('password', '123');
      });

      await act(async () => {
        await result.current.handleSubmit(onSubmit)();
      });

      expect(onSubmit).not.toHaveBeenCalled();
      expect(result.current.formState.isValid).toBe(false);
    });
  });

  describe('Real-time Validation', () => {
    it('should validate on change when mode is onChange', async () => {
      const { result } = renderHook(() =>
        useForm({
          resolver: zodResolver(loginSchema),
          mode: 'onChange',
        })
      );

      await act(async () => {
        result.current.setValue('email', 'invalid');
      });

      // Should immediately show validation error
      expect(result.current.formState.errors.email?.message).toBe('Invalid email format');

      await act(async () => {
        result.current.setValue('email', 'valid@example.com');
      });

      // Should immediately clear validation error
      expect(result.current.formState.errors.email).toBeUndefined();
    });

    it('should validate on blur when mode is onBlur', async () => {
      const { result } = renderHook(() =>
        useForm({
          resolver: zodResolver(loginSchema),
          mode: 'onBlur',
        })
      );

      await act(async () => {
        result.current.setValue('email', 'invalid');
      });

      // Should not show validation error immediately
      expect(result.current.formState.errors.email).toBeUndefined();

      await act(async () => {
        result.current.trigger('email');
      });

      // Should show validation error after trigger (simulating blur)
      expect(result.current.formState.errors.email?.message).toBe('Invalid email format');
    });
  });

  describe('Custom Validation Rules', () => {
    it('should handle custom async validation', async () => {
      const asyncEmailSchema = z.object({
        email: z.string().email().refine(async (email) => {
          // Simulate async email availability check
          await new Promise(resolve => setTimeout(resolve, 100));
          return email !== 'taken@example.com';
        }, 'Email is already taken'),
      });

      const { result } = renderHook(() =>
        useForm({
          resolver: zodResolver(asyncEmailSchema),
          mode: 'onChange',
        })
      );

      await act(async () => {
        result.current.setValue('email', 'taken@example.com');
        await result.current.trigger('email');
      });

      expect(result.current.formState.errors.email?.message).toBe('Email is already taken');
    });

    it('should handle conditional validation', async () => {
      const conditionalSchema = z.object({
        hasAccount: z.boolean(),
        email: z.string().optional(),
        password: z.string().optional(),
      }).refine(data => {
        if (data.hasAccount) {
          return data.email && data.password;
        }
        return true;
      }, {
        message: 'Email and password are required when you have an account',
        path: ['email'],
      });

      const { result } = renderHook(() =>
        useForm({
          resolver: zodResolver(conditionalSchema),
          mode: 'onChange',
        })
      );

      await act(async () => {
        result.current.setValue('hasAccount', true);
        await result.current.trigger();
      });

      expect(result.current.formState.errors.email?.message).toBe('Email and password are required when you have an account');

      await act(async () => {
        result.current.setValue('email', 'test@example.com');
        result.current.setValue('password', 'password123');
        await result.current.trigger();
      });

      expect(result.current.formState.errors.email).toBeUndefined();
    });
  });
});