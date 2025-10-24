// Re-export shared types for frontend use
export * from '@memo-app/shared/types';

// Frontend-specific types
export interface RouteConfig {
  path: string;
  element: React.ComponentType;
  protected?: boolean;
}

export interface NavigationItem {
  label: string;
  path: string;
  icon?: React.ComponentType;
}

export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
}

export interface AppState {
  isLoading: boolean;
  error: string | null;
  theme: ThemeConfig;
}