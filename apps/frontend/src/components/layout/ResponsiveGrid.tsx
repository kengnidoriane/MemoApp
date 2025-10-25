import { ReactNode } from 'react';
import { cn } from '../../utils';

interface ResponsiveGridProps {
  children: ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

export const ResponsiveGrid = ({ 
  children, 
  cols = { default: 1, sm: 2, lg: 3 },
  gap = 6,
  className 
}: ResponsiveGridProps) => {
  const gridClasses = cn(
    'grid',
    // Default columns
    cols.default === 1 && 'grid-cols-1',
    cols.default === 2 && 'grid-cols-2',
    cols.default === 3 && 'grid-cols-3',
    cols.default === 4 && 'grid-cols-4',
    
    // Small screens
    cols.sm === 1 && 'sm:grid-cols-1',
    cols.sm === 2 && 'sm:grid-cols-2',
    cols.sm === 3 && 'sm:grid-cols-3',
    cols.sm === 4 && 'sm:grid-cols-4',
    
    // Medium screens
    cols.md === 1 && 'md:grid-cols-1',
    cols.md === 2 && 'md:grid-cols-2',
    cols.md === 3 && 'md:grid-cols-3',
    cols.md === 4 && 'md:grid-cols-4',
    
    // Large screens
    cols.lg === 1 && 'lg:grid-cols-1',
    cols.lg === 2 && 'lg:grid-cols-2',
    cols.lg === 3 && 'lg:grid-cols-3',
    cols.lg === 4 && 'lg:grid-cols-4',
    
    // Extra large screens
    cols.xl === 1 && 'xl:grid-cols-1',
    cols.xl === 2 && 'xl:grid-cols-2',
    cols.xl === 3 && 'xl:grid-cols-3',
    cols.xl === 4 && 'xl:grid-cols-4',
    
    // Gap
    gap === 2 && 'gap-2',
    gap === 4 && 'gap-4',
    gap === 6 && 'gap-6',
    gap === 8 && 'gap-8',
    
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};