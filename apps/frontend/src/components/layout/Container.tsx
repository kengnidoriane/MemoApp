import { ReactNode } from 'react';
import { cn } from '../../utils';

interface ContainerProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  padding?: boolean;
}

const containerSizes = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
};

export const Container = ({ 
  children, 
  size = 'lg', 
  className, 
  padding = true 
}: ContainerProps) => {
  return (
    <div className={cn(
      'mx-auto w-full',
      containerSizes[size],
      padding && 'px-4 sm:px-6 lg:px-8',
      className
    )}>
      {children}
    </div>
  );
};