import { forwardRef, type SelectHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      placeholder,
      className,
      containerClassName,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          <motion.select
            ref={ref}
            id={selectId}
            className={cn(
              // Base styles
              'block w-full rounded-lg border shadow-sm transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'px-3 py-2 pr-10',
              'appearance-none cursor-pointer',
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
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </motion.select>
          
          {/* Dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        
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

Select.displayName = 'Select';