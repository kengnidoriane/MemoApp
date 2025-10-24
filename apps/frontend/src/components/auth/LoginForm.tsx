import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { loginSchema, type LoginInput } from '@memo-app/shared/validation/user';
import { useLogin } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../utils';

interface LoginFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
  className?: string;
}

export const LoginForm = ({ onSuccess, onForgotPassword, className }: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      await loginMutation.mutateAsync(data);
      onSuccess?.();
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 401) {
        setError('root', {
          message: 'Invalid email or password. Please try again.',
        });
      } else if (error.response?.status === 429) {
        setError('root', {
          message: 'Too many login attempts. Please try again later.',
        });
      } else {
        setError('root', {
          message: error.message || 'An error occurred during login. Please try again.',
        });
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit(onSubmit)}
      className={cn('space-y-6', className)}
    >
      {/* Email Field */}
      <Input
        {...register('email')}
        type="email"
        label="Email Address"
        placeholder="Enter your email"
        error={errors.email?.message}
        leftIcon={<EnvelopeIcon className="h-5 w-5" />}
        autoComplete="email"
        disabled={isSubmitting}
      />

      {/* Password Field */}
      <Input
        {...register('password')}
        type={showPassword ? 'text' : 'password'}
        label="Password"
        placeholder="Enter your password"
        error={errors.password?.message}
        leftIcon={<LockClosedIcon className="h-5 w-5" />}
        rightIcon={
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        }
        autoComplete="current-password"
        disabled={isSubmitting}
      />

      {/* Form Error */}
      {errors.root && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-error-50 border border-error-200 rounded-lg dark:bg-error-900/20 dark:border-error-800"
        >
          <p className="text-sm text-error-600 dark:text-error-400">
            {errors.root.message}
          </p>
        </motion.div>
      )}

      {/* Forgot Password Link */}
      {onForgotPassword && (
        <div className="text-right">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            disabled={isSubmitting}
          >
            Forgot your password?
          </button>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isSubmitting}
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Signing In...' : 'Sign In'}
      </Button>
    </motion.form>
  );
};