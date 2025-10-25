import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  EyeIcon, 
  SpeakerWaveIcon, 
  KeyboardIcon,
  AdjustmentsHorizontalIcon 
} from '@heroicons/react/24/outline';
import { useAppStore } from '../../stores/appStore';
import { Card } from '../ui/Card';
import { Switch } from '../ui/Switch';
import { cn } from '../../utils';

interface AccessibilitySettingsProps {
  className?: string;
}

export const AccessibilitySettings = ({ className }: AccessibilitySettingsProps) => {
  const { theme, setTheme } = useAppStore();

  // Extended theme state for accessibility
  const accessibilitySettings = {
    highContrast: theme.highContrast || false,
    reduceMotion: theme.reduceMotion || false,
    screenReaderOptimized: theme.screenReaderOptimized || false,
    keyboardNavigation: theme.keyboardNavigation !== false, // Default to true
    focusIndicators: theme.focusIndicators !== false, // Default to true
  };

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast mode
    if (accessibilitySettings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Reduced motion
    if (accessibilitySettings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // Screen reader optimizations
    if (accessibilitySettings.screenReaderOptimized) {
      root.classList.add('screen-reader-optimized');
    } else {
      root.classList.remove('screen-reader-optimized');
    }
    
    // Enhanced focus indicators
    if (accessibilitySettings.focusIndicators) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }
  }, [accessibilitySettings]);

  const handleSettingChange = (setting: string, value: boolean) => {
    setTheme({ [setting]: value });
  };

  const accessibilityOptions = [
    {
      key: 'highContrast',
      label: 'High Contrast Mode',
      description: 'Increase contrast for better visibility',
      icon: EyeIcon,
      value: accessibilitySettings.highContrast,
    },
    {
      key: 'reduceMotion',
      label: 'Reduce Motion',
      description: 'Minimize animations and transitions',
      icon: AdjustmentsHorizontalIcon,
      value: accessibilitySettings.reduceMotion,
    },
    {
      key: 'screenReaderOptimized',
      label: 'Screen Reader Optimization',
      description: 'Enhanced compatibility with screen readers',
      icon: SpeakerWaveIcon,
      value: accessibilitySettings.screenReaderOptimized,
    },
    {
      key: 'keyboardNavigation',
      label: 'Enhanced Keyboard Navigation',
      description: 'Improved keyboard shortcuts and navigation',
      icon: KeyboardIcon,
      value: accessibilitySettings.keyboardNavigation,
    },
    {
      key: 'focusIndicators',
      label: 'Enhanced Focus Indicators',
      description: 'More visible focus outlines and indicators',
      icon: EyeIcon,
      value: accessibilitySettings.focusIndicators,
    },
  ];

  return (
    <Card className={cn('p-6', className)}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Accessibility
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Customize accessibility features to improve your experience.
        </p>
      </div>

      <div className="space-y-4">
        {accessibilityOptions.map((option, index) => {
          const Icon = option.icon;
          
          return (
            <motion.div
              key={option.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'flex items-center justify-between p-4 rounded-lg border transition-all duration-200',
                'hover:border-primary-300 dark:hover:border-primary-600',
                'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
              )}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
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
              
              <Switch
                checked={option.value}
                onChange={(checked) => handleSettingChange(option.key, checked)}
                aria-label={`Toggle ${option.label}`}
              />
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="p-1 bg-blue-100 dark:bg-blue-800 rounded-full">
              <SpeakerWaveIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              Screen Reader Support
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              This app is optimized for screen readers including NVDA, JAWS, and VoiceOver. 
              Press <kbd className="px-1 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">?</kbd> for keyboard shortcuts.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};