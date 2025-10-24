import { forwardRef, type HTMLAttributes } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils';

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  className?: string;
  motionProps?: HTMLMotionProps<'div'>;
}

const cardVariants = {
  default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm',
  elevated: 'bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700',
  outlined: 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700',
};

const cardPadding = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hover = false,
      className,
      children,
      motionProps,
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          // Base styles
          'rounded-lg transition-all duration-200',
          // Variant styles
          cardVariants[variant],
          // Padding styles
          cardPadding[padding],
          // Hover styles
          hover && 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
          className
        )}
        whileHover={hover ? { y: -2, scale: 1.01 } : undefined}
        {...motionProps}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

// Card sub-components
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const CardHeader = ({ className, children, ...props }: CardHeaderProps) => (
  <div className={cn('mb-4', className)} {...props}>
    {children}
  </div>
);

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const CardTitle = ({ className, as: Component = 'h3', children, ...props }: CardTitleProps) => (
  <Component
    className={cn('text-lg font-semibold text-gray-900 dark:text-white', className)}
    {...props}
  >
    {children}
  </Component>
);

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const CardContent = ({ className, children, ...props }: CardContentProps) => (
  <div className={cn('text-gray-600 dark:text-gray-300', className)} {...props}>
    {children}
  </div>
);

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const CardFooter = ({ className, children, ...props }: CardFooterProps) => (
  <div className={cn('mt-4 pt-4 border-t border-gray-200 dark:border-gray-700', className)} {...props}>
    {children}
  </div>
);