// Responsive utility functions

export const breakpoints = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

// Check if current viewport matches a breakpoint
export const matchesBreakpoint = (breakpoint: Breakpoint): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= breakpoints[breakpoint];
};

// Get current breakpoint
export const getCurrentBreakpoint = (): Breakpoint => {
  if (typeof window === 'undefined') return 'sm';
  
  const width = window.innerWidth;
  
  if (width >= breakpoints['2xl']) return '2xl';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'xs';
};

// Check if device is mobile
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < breakpoints.md;
};

// Check if device is tablet
export const isTabletDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= breakpoints.md && window.innerWidth < breakpoints.lg;
};

// Check if device is desktop
export const isDesktopDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= breakpoints.lg;
};

// Check if device supports touch
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Check if user prefers reduced motion
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Check if user prefers high contrast
export const prefersHighContrast = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
};

// Get safe area insets for mobile devices
export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const style = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
  };
};

// Responsive class name generator
export const responsive = (classes: Partial<Record<Breakpoint | 'default', string>>): string => {
  const classNames: string[] = [];
  
  if (classes.default) {
    classNames.push(classes.default);
  }
  
  Object.entries(classes).forEach(([breakpoint, className]) => {
    if (breakpoint !== 'default' && className) {
      classNames.push(`${breakpoint}:${className}`);
    }
  });
  
  return classNames.join(' ');
};

// Generate responsive grid classes
export const responsiveGrid = (cols: Partial<Record<Breakpoint | 'default', number>>): string => {
  const gridClasses: string[] = [];
  
  if (cols.default) {
    gridClasses.push(`grid-cols-${cols.default}`);
  }
  
  Object.entries(cols).forEach(([breakpoint, colCount]) => {
    if (breakpoint !== 'default' && colCount) {
      gridClasses.push(`${breakpoint}:grid-cols-${colCount}`);
    }
  });
  
  return gridClasses.join(' ');
};