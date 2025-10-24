import { type HTMLAttributes } from 'react';
import { cn } from '../../utils';

interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'className'> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const badgeVariants = {
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300',
  success: 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300',
  warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-300',
  error: 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-300',
  info: 'bg-info-100 text-info-800 dark:bg-info-900 dark:text-info-300',
};

const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export const Badge = ({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}: BadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};