import { ReactNode } from 'react';
import { Navigation } from './Navigation';
import { cn } from '../../utils';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export const Layout = ({ children, className }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      {/* Main content area */}
      <div className="lg:pl-64">
        <main className={cn('flex-1', className)}>
          {children}
        </main>
      </div>
    </div>
  );
};