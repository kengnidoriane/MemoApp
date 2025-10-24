import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { UserIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { updateUserSchema, type UpdateUserInput } from '@memo-app/shared/validation/user';
import { useUpdateProfile } from '../../hooks/useAuth';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { cn } from '../../utils';

interface ProfileFormProps {
  className?: string;
}

export const ProfileForm = ({ className }: ProfileFormProps) => {
  const { user } = useAuthStore();
  const updateProfileMutation = useUpdateProfile();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    setError,
    reset,
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: user?.name || '',
    },
  });

  const onSubmit = async (data: UpdateUserInput) => {
    try {
      await updateProfileMutation.mutateAsync(data);
      reset(data); // Reset form with new values to clear dirty state
    } catch (error: any) {
      if (error.response?.status === 409) {
        setError('root', {
          message: 'This information is already in use by another account.',
        });
      } else {
        setError('root', {
          message: error.message || 'Failed to update profile. Please try again.',
        });
      }
    }
  };

  return (
    <Card className={cn('p-6', className)}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Profile Information
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Update your personal information and account details.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

        {/* Email Field (Read-only) */}
        <Input
          type="email"
          label="Email Address"
          value={user?.email || ''}
          leftIcon={<EnvelopeIcon className="h-5 w-5" />}
          disabled
          helperText="Email cannot be changed. Contact support if you need to update your email."
        />

        {/* Account Status */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Account Status
          </label>
          <div className="flex items-center space-x-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              user?.emailVerified ? 'bg-success-500' : 'bg-warning-500'
            )} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user?.emailVerified ? 'Email verified' : 'Email not verified'}
            </span>
          </div>
          {!user?.emailVerified && (
            <p className="text-sm text-warning-600 dark:text-warning-400">
              Please check your email and click the verification link to verify your account.
            </p>
          )}
        </div>

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

        {/* Success Message */}
        {updateProfileMutation.isSuccess && !isDirty && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-success-50 border border-success-200 rounded-lg dark:bg-success-900/20 dark:border-success-800"
          >
            <p className="text-sm text-success-600 dark:text-success-400">
              Profile updated successfully!
            </p>
          </motion.div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={!isDirty || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Card>
  );
};