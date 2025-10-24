import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCategorySchema, updateCategorySchema, type CreateCategoryInput, type UpdateCategoryInput } from '@memo-app/shared/validation/category';
import type { Category } from '@memo-app/shared/types';
import { Button, Input, Card } from '../ui';
import { ColorPicker } from './ColorPicker';
import { cn } from '../../utils';

interface CategoryFormProps {
  category?: Category;
  onSubmit: (data: CreateCategoryInput | UpdateCategoryInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const CategoryForm = ({
  category,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: CategoryFormProps) => {
  const isEditing = !!category;
  const schema = isEditing ? updateCategorySchema : createCategorySchema;
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateCategoryInput | UpdateCategoryInput>({
    resolver: zodResolver(schema),
    defaultValues: category ? {
      name: category.name,
      color: category.color,
    } : {
      name: '',
      color: '#3B82F6',
    },
  });

  const watchedColor = watch('color');

  const handleFormSubmit = async (data: CreateCategoryInput | UpdateCategoryInput) => {
    try {
      await onSubmit(data);
      if (!isEditing) {
        reset(); // Reset form after successful creation
      }
    } catch (error) {
      console.error('Failed to submit category:', error);
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Category' : 'Create New Category'}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {isEditing ? 'Update category details' : 'Add a new category to organize your memos'}
          </p>
        </div>

        {/* Category Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category Name
          </label>
          <Input
            {...register('name')}
            placeholder="Enter category name..."
            error={errors.name?.message}
            autoFocus={!isEditing}
          />
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category Color
          </label>
          <ColorPicker
            value={watchedColor || '#3B82F6'}
            onChange={(color: string) => setValue('color', color, { shouldDirty: true })}
          />
          {errors.color && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.color.message}
            </p>
          )}
        </div>

        {/* Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Preview
          </label>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: watchedColor || '#3B82F6' }}
            />
            <span className="text-gray-900 dark:text-white font-medium">
              {watch('name') || 'Category Name'}
            </span>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
          
          <Button
            type="submit"
            disabled={isLoading || isSubmitting}
            loading={isLoading || isSubmitting}
          >
            {isEditing ? 'Update Category' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Card>
  );
};