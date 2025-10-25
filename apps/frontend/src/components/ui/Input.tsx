import { forwardRef, type InputHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className,
      containerClassName,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 dark:text-gray-500" aria-hidden="true">
                {leftIcon}
              </span>
            </div>
          )}
          
          <motion.input
            ref={ref}
            id={inputId}
            className={cn(
              // Base styles
              'block w-full rounded-lg border shadow-sm transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'placeholder-gray-400 dark:placeholder-gray-500',
              // Padding adjustments for icons
              leftIcon ? 'pl-10' : 'pl-3',
              rightIcon ? 'pr-10' : 'pr-3',
              'py-2',
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
            aria-invalid={hasError}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
            whileFocus={{ scale: 1.01 }}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400 dark:text-gray-500" aria-hidden="true">
                {rightIcon}
              </span>
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <motion.p
            id={error ? `${inputId}-error` : `${inputId}-help`}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'mt-1 text-sm',
              hasError
                ? 'text-error-600 dark:text-error-400'
                : 'text-gray-500 dark:text-gray-400'
            )}
            role={hasError ? 'alert' : undefined}
            aria-live={hasError ? 'polite' : undefined}
          >
            {error || helperText}
          </motion.p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';