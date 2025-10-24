import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '../../stores/appStore';
import { Card } from '../ui/Card';
import { cn } from '../../utils';

interface ThemeSettingsProps {
  className?: string;
}

export const ThemeSettings = ({ className }: ThemeSettingsProps) => {
  const { theme, setTheme } = useAppStore();
  
  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme.mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Apply font size
    root.style.fontSize = theme.fontSize === 'small' ? '14px' : 
                         theme.fontSize === 'large' ? '18px' : '16px';
  }, [theme.mode, theme.fontSize]);

  const handleThemeChange = (mode: 'light' | 'dark') => {
    setTheme({ mode });
  };

  const handleFontSizeChange = (fontSize: 'small' | 'medium' | 'large') => {
    setTheme({ fontSize });
  };

  const themeOptions = [
    {
      value: 'light' as const,
      label: 'Light',
      icon: SunIcon,
      description: 'Clean and bright interface',
    },
    {
      value: 'dark' as const,
      label: 'Dark',
      icon: MoonIcon,
      description: 'Easy on the eyes in low light',
    },
  ];

  const fontSizeOptions = [
    {
      value: 'small' as const,
      label: 'Small',
      description: 'Compact text size',
    },
    {
      value: 'medium' as const,
      label: 'Medium',
      description: 'Default text size',
    },
    {
      value: 'large' as const,
      label: 'Large',
      description: 'Larger text for better readability',
    },
  ];

  return (
    <Card className={cn('p-6', className)}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Appearance
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Customize how MemoApp looks and feels.
        </p>
      </div>

      <div className="space-y-8">
        {/* Theme Mode Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Theme Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = theme.mode === option.value;
              
              return (
                <motion.button
                  key={option.value}
                  type="button"
                  onClick={() => handleThemeChange(option.value)}
                  className={cn(
                    'relative p-4 rounded-lg border-2 text-left transition-all duration-200',
                    'hover:border-primary-300 dark:hover:border-primary-600',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      'p-2 rounded-lg',
                      isSelected
                        ? 'bg-primary-100 text-primary-600 dark:bg-primary-800 dark:text-primary-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {option.label}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {option.description}
                      </div>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center"
                    >
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Font Size Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Font Size
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {fontSizeOptions.map((option) => {
              const isSelected = theme.fontSize === option.value;
              
              return (
                <motion.button
                  key={option.value}
                  type="button"
                  onClick={() => handleFontSizeChange(option.value)}
                  className={cn(
                    'relative p-4 rounded-lg border-2 text-left transition-all duration-200',
                    'hover:border-primary-300 dark:hover:border-primary-600',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-center">
                    <div className={cn(
                      'font-medium text-gray-900 dark:text-white mb-1',
                      option.value === 'small' && 'text-sm',
                      option.value === 'medium' && 'text-base',
                      option.value === 'large' && 'text-lg'
                    )}>
                      Aa
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {option.description}
                    </div>
                  </div>
                  
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center"
                    >
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};