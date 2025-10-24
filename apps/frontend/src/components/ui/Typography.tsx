import { forwardRef, type HTMLAttributes, type ElementType } from 'react';
import { cn } from '../../utils';

interface TypographyProps extends HTMLAttributes<HTMLElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'body-large' | 'body-small' | 'caption' | 'overline';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'inherit';
  align?: 'left' | 'center' | 'right' | 'justify';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  as?: ElementType;
  className?: string;
}

const variantStyles = {
  h1: 'text-4xl font-bold leading-tight',
  h2: 'text-3xl font-bold leading-tight',
  h3: 'text-2xl font-semibold leading-tight',
  h4: 'text-xl font-semibold leading-tight',
  h5: 'text-lg font-medium leading-tight',
  h6: 'text-base font-medium leading-tight',
  'body-large': 'text-lg leading-relaxed',
  body: 'text-base leading-relaxed',
  'body-small': 'text-sm leading-relaxed',
  caption: 'text-xs leading-normal',
  overline: 'text-xs font-medium uppercase tracking-wider leading-normal',
};

const colorStyles = {
  primary: 'text-gray-900 dark:text-white',
  secondary: 'text-gray-600 dark:text-gray-300',
  success: 'text-success-600 dark:text-success-400',
  warning: 'text-warning-600 dark:text-warning-400',
  error: 'text-error-600 dark:text-error-400',
  info: 'text-info-600 dark:text-info-400',
  inherit: 'text-inherit',
};

const alignStyles = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
};

const weightStyles = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const defaultElements = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  'body-large': 'p',
  body: 'p',
  'body-small': 'p',
  caption: 'span',
  overline: 'span',
} as const;

export const Typography = forwardRef<HTMLElement, TypographyProps>(
  (
    {
      variant = 'body',
      color = 'primary',
      align = 'left',
      weight,
      as,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const Component = (as || defaultElements[variant]) as ElementType;

    return (
      <Component
        ref={ref}
        className={cn(
          variantStyles[variant],
          colorStyles[color],
          alignStyles[align],
          weight && weightStyles[weight],
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Typography.displayName = 'Typography';

// Convenience components
export const Heading = forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'> & { level: 1 | 2 | 3 | 4 | 5 | 6 }>(
  ({ level, ...props }, ref) => (
    <Typography
      ref={ref}
      variant={`h${level}` as TypographyProps['variant']}
      {...props}
    />
  )
);

Heading.displayName = 'Heading';

export const Text = forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'variant'> & { size?: 'small' | 'base' | 'large' }>(
  ({ size = 'base', ...props }, ref) => {
    const variant = size === 'small' ? 'body-small' : size === 'large' ? 'body-large' : 'body';
    return (
      <Typography
        ref={ref}
        variant={variant}
        {...props}
      />
    );
  }
);

Text.displayName = 'Text';