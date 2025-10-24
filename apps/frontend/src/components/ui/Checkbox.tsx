import { forwardRef, type InputHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> {
  label?: string;
  description?: string;
  error?: string;
  className?: string;
  containerClassName?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      description,
      error,
      className,
      containerClassName,
      id,
      ...props
    },
    ref
  ) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);

    return (
      <div className={cn('flex items-start', containerClassName)}>
        <div className="flex items-center h-5">
          <motion.input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            className={cn(
              // Base styles
              'w-4 h-4 rounded border transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-primary-500',
              // State styles
              hasError
                ? 'border-error-300 text-error-600 dark:border-error-600'
                : 'border-gray-300 text-primary-600 dark:border-gray-600',
              // Background styles
              'bg-white dark:bg-gray-700',
              // Disabled styles
              'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
              'dark:disabled:bg-gray-800',
              className
            )}
            whileTap={{ scale: 0.95 }}
            {...props}
          />
        </div>
        
        {(label || description) && (
          <div className="ml-3">
            {label && (
              <label
                htmlFor={checkboxId}
                className={cn(
                  'text-sm font-medium cursor-pointer',
                  hasError
                    ? 'text-error-700 dark:text-error-400'
                    : 'text-gray-700 dark:text-gray-300'
                )}
              >
                {label}
              </label>
            )}
            
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
            
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 text-sm text-error-600 dark:text-error-400"
              >
                {error}
              </motion.p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';