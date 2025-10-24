import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils';

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
  containerClassName?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      className,
      containerClassName,
      resize = 'vertical',
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);

    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    };

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        
        <motion.textarea
          ref={ref}
          id={textareaId}
          className={cn(
            // Base styles
            'block w-full rounded-lg border shadow-sm transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'placeholder-gray-400 dark:placeholder-gray-500',
            'px-3 py-2 min-h-[80px]',
            // Resize styles
            resizeClasses[resize],
            // State styles
            hasError
              ? 'border-error-300 focus:border-error-500 focus:ring-error-500 dark:border-error-600'
              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600',
            // Background styles
            'bg-white dark:bg-gray-700',
            'text-gray-900 dark:text-gray-100',
            // Disabled styles
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            'dark:disabled:bg-gray-800 dark:disabled:text-gray-400',
            className
          )}
          whileFocus={{ scale: 1.01 }}
          {...props}
        />
        
        {(error || helperText) && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'mt-1 text-sm',
              hasError
                ? 'text-error-600 dark:text-error-400'
                : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {error || helperText}
          </motion.p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';