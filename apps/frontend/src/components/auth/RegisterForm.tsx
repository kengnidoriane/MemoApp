import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';
import { createUserSchema, type CreateUserInput } from '@memo-app/shared/validation/user';
import { useRegister } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../utils';

interface RegisterFormProps {
  onSuccess?: () => void;
  className?: string;
}

export const RegisterForm = ({ onSuccess, className }: RegisterFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: CreateUserInput) => {
    try {
      await registerMutation.mutateAsync(data);
      onSuccess?.();
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 409) {
        setError('email', {
          message: 'An account with this email already exists.',
        });
      } else if (error.response?.status === 429) {
        setError('root', {
          message: 'Too many registration attempts. Please try again later.',
        });
      } else {
        setError('root', {
          message: error.message || 'An error occurred during registration. Please try again.',
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
      {/* Name Field */}
      <Input
        {...register('name')}
        type="text"
        label="Full Name"
        placeholder="Enter your full name"
        error={errors.name?.message}
        leftIcon={<UserIcon className="h-5 w-5" />}
        autoComplete="name"
        disabled={isSubmitting}
      />

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
        placeholder="Create a strong password"
        error={errors.password?.message}
        helperText="Must contain at least 8 characters with uppercase, lowercase, and number"
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
        autoComplete="new-password"
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

      {/* Terms and Privacy */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        By creating an account, you agree to our{' '}
        <a
          href="/terms"
          className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
        >
          Terms of Service
        </a>{' '}
        and{' '}
        <a
          href="/privacy"
          className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
        >
          Privacy Policy
        </a>
        .
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isSubmitting}
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating Account...' : 'Create Account'}
      </Button>
    </motion.form>
  );
};