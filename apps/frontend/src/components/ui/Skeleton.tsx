import { cn } from '../../utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton = ({
  className,
  variant = 'rectangular',
  width,
  height,
  lines = 1,
}: SkeletonProps) => {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              'h-4 rounded',
              index === lines - 1 ? 'w-3/4' : 'w-full'
            )}
            style={{ width, height }}
          />
        ))}
      </div>
    );
  }

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded',
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        variant === 'text' && 'w-full',
        variant === 'circular' && 'w-10 h-10',
        variant === 'rectangular' && 'w-full h-20',
        className
      )}
      style={{ width, height }}
    />
  );
};

// Skeleton components for common patterns
export const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn('p-6 border border-gray-200 dark:border-gray-700 rounded-lg', className)}>
    <div className="flex items-center space-x-4 mb-4">
      <Skeleton variant="circular" className="w-12 h-12" />
      <div className="flex-1">
        <Skeleton variant="text" className="h-4 w-1/2 mb-2" />
        <Skeleton variant="text" className="h-3 w-1/3" />
      </div>
    </div>
    <Skeleton variant="text" lines={3} />
  </div>
);

export const SkeletonList = ({ 
  items = 3, 
  className 
}: { 
  items?: number; 
  className?: string; 
}) => (
  <div className={cn('space-y-4', className)}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4">
        <Skeleton variant="circular" className="w-10 h-10" />
        <div className="flex-1">
          <Skeleton variant="text" className="h-4 w-3/4 mb-2" />
          <Skeleton variant="text" className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonTable = ({ 
  rows = 5, 
  columns = 4, 
  className 
}: { 
  rows?: number; 
  columns?: number; 
  className?: string; 
}) => (
  <div className={cn('space-y-4', className)}>
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={index} variant="text" className="h-4" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} variant="text" className="h-4" />
        ))}
      </div>
    ))}
  </div>
);