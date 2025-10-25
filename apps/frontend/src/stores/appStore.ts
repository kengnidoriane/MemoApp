import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  highContrast?: boolean;
  reduceMotion?: boolean;
  screenReaderOptimized?: boolean;
  keyboardNavigation?: boolean;
  focusIndicators?: boolean;
}

interface AppState {
  theme: ThemeConfig;
  language: 'en' | 'fr';
  isOnline: boolean;
  notifications: {
    enabled: boolean;
    permission: NotificationPermission;
  };
  sidebarOpen: boolean;
}

interface AppActions {
  setTheme: (theme: Partial<ThemeConfig>) => void;
  setLanguage: (language: 'en' | 'fr') => void;
  setOnlineStatus: (isOnline: boolean) => void;
  setNotificationPermission: (permission: NotificationPermission) => void;
  toggleNotifications: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

type AppStore = AppState & AppActions;

const initialState: AppState = {
  theme: {
    mode: 'light',
    primaryColor: '#3b82f6',
    fontSize: 'medium',
  },
  language: 'en',
  isOnline: navigator.onLine,
  notifications: {
    enabled: false,
    permission: 'default',
  },
  sidebarOpen: false,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setTheme: (themeUpdate) => {
        const { theme } = get();
        set({
          theme: { ...theme, ...themeUpdate },
        });
      },
      
      setLanguage: (language) => {
        set({ language });
      },
      
      setOnlineStatus: (isOnline) => {
        set({ isOnline });
      },
      
      setNotificationPermission: (permission) => {
        set({
          notifications: {
            ...get().notifications,
            permission,
          },
        });
      },
      
      toggleNotifications: () => {
        const { notifications } = get();
        set({
          notifications: {
            ...notifications,
            enabled: !notifications.enabled,
          },
        });
      },
      
      toggleSidebar: () => {
        set({ sidebarOpen: !get().sidebarOpen });
      },
      
      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        notifications: state.notifications,
      }),
    }
  )
);