import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { createMemoSchema, updateMemoSchema, type CreateMemoInput, type UpdateMemoInput } from '@memo-app/shared/validation/memo';
import type { Memo } from '@memo-app/shared/types';
import { Button, Input, Textarea, Card } from '../ui';
import { TagInput } from './TagInput';
import { CategorySelect } from './CategorySelect';
import { cn } from '../../utils';

interface MemoFormProps {
  memo?: Memo;
  onSubmit: (data: CreateMemoInput | UpdateMemoInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const MemoForm = ({
  memo,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: MemoFormProps) => {
  const isEditing = !!memo;
  const schema = isEditing ? updateMemoSchema : createMemoSchema;
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty, isSubmitting },
    reset,
  } = useForm<CreateMemoInput | UpdateMemoInput>({
    resolver: zodResolver(schema),
    defaultValues: memo ? {
      title: memo.title,
      content: memo.content,
      tags: memo.tags,
      categoryId: memo.categoryId,
    } : {
      title: '',
      content: '',
      tags: [],
      categoryId: undefined,
    },
  });

  const watchedTags = watch('tags');
  const watchedCategoryId = watch('categoryId');

  // Auto-save for editing mode (debounced)
  useEffect(() => {
    if (!isEditing || !isDirty) return;

    const timeoutId = setTimeout(() => {
      handleSubmit(onSubmit)();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [watch(), isEditing, isDirty, handleSubmit, onSubmit]);

  const handleFormSubmit = async (data: CreateMemoInput | UpdateMemoInput) => {
    try {
      await onSubmit(data);
      if (!isEditing) {
        reset(); // Reset form after successful creation
      }
    } catch (error) {
      console.error('Failed to submit memo:', error);
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Title */}
        <div>
          <Input
            {...register('title')}
            placeholder="Enter memo title..."
            error={errors.title?.message}
            className="text-lg font-medium"
            autoFocus={!isEditing}
          />
        </div>

        {/* Content */}
        <div>
          <Textarea
            {...register('content')}
            placeholder="Write your memo content here..."
            error={errors.content?.message}
            rows={8}
            className="resize-none"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags
          </label>
          <TagInput
            value={watchedTags || []}
            onChange={(tags) => setValue('tags', tags, { shouldDirty: true })}
            placeholder="Add tags..."
          />
          {errors.tags && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.tags.message}
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          <CategorySelect
            value={watchedCategoryId || undefined}
            onChange={(categoryId) => setValue('categoryId', categoryId, { shouldDirty: true })}
            placeholder="Select a category..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            {isEditing && isDirty && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-sm text-amber-600 dark:text-amber-400 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Auto-saving...
              </motion.span>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading || isSubmitting}
              >
                Cancel
              </Button>
            )}
            
            {!isEditing && (
              <Button
                type="submit"
                disabled={isLoading || isSubmitting}
                loading={isLoading || isSubmitting}
              >
                Create Memo
              </Button>
            )}
          </div>
        </div>
      </form>
    </Card>
  );
};