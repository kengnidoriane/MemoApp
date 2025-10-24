import React, { forwardRef, type ImgHTMLAttributes } from 'react';
import { cn } from '../../utils';

interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'className'> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fallback?: string;
  className?: string;
}

const avatarSizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl',
};

export const Avatar = forwardRef<HTMLImageElement, AvatarProps>(
  (
    {
      size = 'md',
      fallback,
      alt,
      className,
      onError,
      ...props
    },
    ref
  ) => {
    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      // Hide the image and show fallback
      e.currentTarget.style.display = 'none';
      const fallbackElement = e.currentTarget.nextElementSibling as HTMLElement;
      if (fallbackElement) {
        fallbackElement.style.display = 'flex';
      }
      onError?.(e);
    };

    const initials = fallback
      ? fallback
          .split(' ')
          .map(name => name.charAt(0))
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : alt
      ? alt.charAt(0).toUpperCase()
      : '?';

    return (
      <div className={cn('relative inline-block', avatarSizes[size])}>
        <img
          ref={ref}
          alt={alt}
          className={cn(
            'rounded-full object-cover',
            avatarSizes[size],
            className
          )}
          onError={handleError}
          {...props}
        />
        
        {/* Fallback */}
        <div
          className={cn(
            'absolute inset-0 rounded-full bg-gray-300 dark:bg-gray-600',
            'flex items-center justify-center font-medium',
            'text-gray-700 dark:text-gray-300',
            avatarSizes[size],
            'hidden' // Initially hidden, shown when image fails
          )}
        >
          {initials}
        </div>
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

// Avatar Group component for displaying multiple avatars
interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  size?: AvatarProps['size'];
  className?: string;
}

export const AvatarGroup = ({ children, max = 5, size = 'md', className }: AvatarGroupProps) => {
  const childrenArray = React.Children.toArray(children);
  const visibleChildren = childrenArray.slice(0, max);
  const remainingCount = childrenArray.length - max;

  return (
    <div className={cn('flex -space-x-2', className)}>
      {visibleChildren.map((child, index) => (
        <div key={index} className="relative">
          {React.cloneElement(child as React.ReactElement<AvatarProps>, {
            size,
            className: cn(
              'border-2 border-white dark:border-gray-800',
              (child as React.ReactElement<AvatarProps>).props.className
            ),
          })}
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div
          className={cn(
            'relative rounded-full bg-gray-300 dark:bg-gray-600',
            'flex items-center justify-center font-medium',
            'text-gray-700 dark:text-gray-300',
            'border-2 border-white dark:border-gray-800',
            avatarSizes[size]
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};