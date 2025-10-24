import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { EnvelopeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { resetPasswordSchema, type ResetPasswordInput } from '@memo-app/shared/validation/user';
import { useForgotPassword } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../utils';

interface ForgotPasswordFormProps {
  onBack?: () => void;
  className?: string;
}

export const ForgotPasswordForm = ({ onBack, className }: ForgotPasswordFormProps) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const forgotPasswordMutation = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    getValues,
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    try {
      await forgotPasswordMutation.mutateAsync(data.email);
      setIsSuccess(true);
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 404) {
        setError('email', {
          message: 'No account found with this email address.',
        });
      } else if (error.response?.status === 429) {
        setError('root', {
          message: 'Too many password reset requests. Please try again later.',
        });
      } else {
        setError('root', {
          message: error.message || 'An error occurred. Please try again.',
        });
      }
    }
  };

  const handleResendEmail = async () => {
    const email = getValues('email');
    if (email) {
      try {
        await forgotPasswordMutation.mutateAsync(email);
      } catch (error) {
        console.error('Failed to resend email:', error);
      }
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={cn('text-center space-y-6', className)}
      >
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center">
            <CheckCircleIcon className="w-8 h-8 text-success-600 dark:text-success-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Check Your Email
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            We've sent a password reset link to{' '}
            <span className="font-medium text-gray-900 dark:text-white">
              {getValues('email')}
            </span>
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Didn't receive the email? Check your spam folder or try again.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleResendEmail}
              isLoading={forgotPasswordMutation.isPending}
              className="flex-1"
            >
              Resend Email
            </Button>
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex-1"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit(onSubmit)}
      className={cn('space-y-6', className)}
    >
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Reset Your Password
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

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
        autoFocus
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

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          className="flex-1"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending...' : 'Send Reset Link'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={onBack}
          className="flex-1"
          disabled={isSubmitting}
        >
          Back to Login
        </Button>
      </div>
    </motion.form>
  );
};