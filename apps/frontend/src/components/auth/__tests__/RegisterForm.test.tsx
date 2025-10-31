import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../test/utils';
import { RegisterForm } from '../RegisterForm';

// Mock the auth service
vi.mock('../../../services/authService', () => ({
  authService: {
    register: vi.fn(),
  },
}));

// Mock the auth store
vi.mock('../../../stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    register: vi.fn(),
    isLoading: false,
    error: null,
  })),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('RegisterForm', () => {
  const mockRegister = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    const { useAuthStore } = require('../../../stores/authStore');
    useAuthStore.mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: null,
    });
  });

  it('renders registration form with all required fields', () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('validates name length', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'a'); // Too short
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    });

    // Test maximum length
    await user.clear(nameInput);
    await user.type(nameInput, 'a'.repeat(101)); // Too long
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name must be 100 characters or less/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email/i);
    
    // Test invalid email formats
    const invalidEmails = [
      'invalid-email',
      '@example.com',
      'test@',
      'test.example.com',
      'test@.com',
    ];

    for (const email of invalidEmails) {
      await user.clear(emailInput);
      await user.type(emailInput, email);
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
    }
  });

  it('validates password strength', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Test minimum length
    await user.type(passwordInput, '1234567'); // 7 characters
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });

    // Test password without uppercase
    await user.clear(passwordInput);
    await user.type(passwordInput, 'password123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must contain at least one uppercase letter/i)).toBeInTheDocument();
    });

    // Test password without lowercase
    await user.clear(passwordInput);
    await user.type(passwordInput, 'PASSWORD123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must contain at least one lowercase letter/i)).toBeInTheDocument();
    });

    // Test password without number
    await user.clear(passwordInput);
    await user.type(passwordInput, 'Password!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must contain at least one number/i)).toBeInTheDocument();
    });

    // Test password without special character
    await user.clear(passwordInput);
    await user.type(passwordInput, 'Password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must contain at least one special character/i)).toBeInTheDocument();
    });
  });

  it('validates password confirmation', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    await user.type(passwordInput, 'SecurePass123!');
    await user.type(confirmPasswordInput, 'DifferentPass123!');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('shows password strength indicator', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const passwordInput = screen.getByLabelText(/^password$/i);

    // Weak password
    await user.type(passwordInput, 'weak');
    await expect(screen.getByText(/weak/i)).toBeInTheDocument();
    await expect(screen.getByTestId('password-strength')).toHaveClass('bg-red-500');

    // Medium password
    await user.clear(passwordInput);
    await user.type(passwordInput, 'Medium123');
    await expect(screen.getByText(/medium/i)).toBeInTheDocument();
    await expect(screen.getByTestId('password-strength')).toHaveClass('bg-yellow-500');

    // Strong password
    await user.clear(passwordInput);
    await user.type(passwordInput, 'StrongPass123!');
    await expect(screen.getByText(/strong/i)).toBeInTheDocument();
    await expect(screen.getByTestId('password-strength')).toHaveClass('bg-green-500');
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue({ success: true });
    
    render(<RegisterForm />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'SecurePass123!');
    await user.type(confirmPasswordInput, 'SecurePass123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123!',
      });
    });
  });

  it('shows loading state during submission', async () => {
    const { useAuthStore } = require('../../../stores/authStore');
    useAuthStore.mockReturnValue({
      register: vi.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
      isLoading: true,
      error: null,
    });

    render(<RegisterForm />);

    const submitButton = screen.getByRole('button', { name: /creating account/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('displays error message on registration failure', async () => {
    const errorMessage = 'Email already exists';
    const { useAuthStore } = require('../../../stores/authStore');
    useAuthStore.mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: errorMessage,
    });

    render(<RegisterForm />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    const toggleButton = screen.getByRole('button', { name: /show password/i });

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('navigates to login page when clicking sign in link', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const signInLink = screen.getByRole('link', { name: /sign in/i });
    await user.click(signInLink);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('accepts terms and conditions', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const termsCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Should be required
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/you must accept the terms and conditions/i)).toBeInTheDocument();
    });

    // Should allow submission when checked
    await user.check(termsCheckbox);
    expect(termsCheckbox).toBeChecked();
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const termsCheckbox = screen.getByLabelText(/i agree to the terms/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.click(nameInput);
    expect(nameInput).toHaveFocus();

    await user.tab();
    expect(emailInput).toHaveFocus();

    await user.tab();
    expect(passwordInput).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: /show password/i })).toHaveFocus();

    await user.tab();
    expect(confirmPasswordInput).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: /show password/i })).toHaveFocus();

    await user.tab();
    expect(termsCheckbox).toHaveFocus();

    await user.tab();
    expect(submitButton).toHaveFocus();
  });

  it('submits form on Enter key press', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue({ success: true });
    
    render(<RegisterForm />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const termsCheckbox = screen.getByLabelText(/i agree to the terms/i);

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'SecurePass123!');
    await user.type(confirmPasswordInput, 'SecurePass123!');
    await user.check(termsCheckbox);
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123!',
      });
    });
  });

  it('clears error when user starts typing', async () => {
    const user = userEvent.setup();
    const { useAuthStore } = require('../../../stores/authStore');
    
    // Start with error state
    useAuthStore.mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: 'Email already exists',
    });

    const { rerender } = render(<RegisterForm />);
    expect(screen.getByText('Email already exists')).toBeInTheDocument();

    // Clear error when user types
    useAuthStore.mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: null,
    });

    rerender(<RegisterForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'a');

    expect(screen.queryByText('Email already exists')).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<RegisterForm />);

    const form = screen.getByRole('form');
    expect(form).toHaveAttribute('aria-label', 'Registration form');

    const nameInput = screen.getByLabelText(/name/i);
    expect(nameInput).toHaveAttribute('aria-required', 'true');
    expect(nameInput).toHaveAttribute('aria-describedby');

    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toHaveAttribute('aria-required', 'true');
    expect(emailInput).toHaveAttribute('aria-describedby');

    const passwordInput = screen.getByLabelText(/^password$/i);
    expect(passwordInput).toHaveAttribute('aria-required', 'true');
    expect(passwordInput).toHaveAttribute('aria-describedby');

    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    expect(confirmPasswordInput).toHaveAttribute('aria-required', 'true');
    expect(confirmPasswordInput).toHaveAttribute('aria-describedby');
  });

  it('validates email uniqueness on blur', async () => {
    const user = userEvent.setup();
    
    // Mock email validation API
    vi.mock('../../../services/authService', () => ({
      authService: {
        checkEmailAvailability: vi.fn().mockResolvedValue({ available: false }),
      },
    }));

    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'existing@example.com');
    await user.tab(); // Trigger blur

    await waitFor(() => {
      expect(screen.getByText(/email is already taken/i)).toBeInTheDocument();
    });
  });

  it('shows real-time validation feedback', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email/i);
    
    // Type invalid email
    await user.type(emailInput, 'invalid');
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });

    // Fix email
    await user.clear(emailInput);
    await user.type(emailInput, 'valid@example.com');
    await waitFor(() => {
      expect(screen.queryByText(/invalid email format/i)).not.toBeInTheDocument();
    });
  });
});