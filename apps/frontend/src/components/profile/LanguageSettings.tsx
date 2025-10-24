import { motion } from 'framer-motion';
import { LanguageIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '../../stores/appStore';
import { Card } from '../ui/Card';
import { cn } from '../../utils';

interface LanguageSettingsProps {
  className?: string;
}

export const LanguageSettings = ({ className }: LanguageSettingsProps) => {
  const { language, setLanguage } = useAppStore();

  const languageOptions = [
    {
      value: 'en' as const,
      label: 'English',
      nativeLabel: 'English',
      flag: '🇺🇸',
    },
    {
      value: 'fr' as const,
      label: 'French',
      nativeLabel: 'Français',
      flag: '🇫🇷',
    },
  ];

  const handleLanguageChange = (newLanguage: 'en' | 'fr') => {
    setLanguage(newLanguage);
    
    // Show feedback to user
    const message = newLanguage === 'en' 
      ? 'Language changed to English' 
      : 'Langue changée en français';
    
    // You could integrate with a toast notification system here
    console.log(message);
  };

  return (
    <Card className={cn('p-6', className)}>
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <LanguageIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Language
          </h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Choose your preferred language for the interface.
        </p>
      </div>

      <div className="space-y-3">
        {languageOptions.map((option) => {
          const isSelected = language === option.value;
          
          return (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => handleLanguageChange(option.value)}
              className={cn(
                'w-full p-4 rounded-lg border-2 text-left transition-all duration-200',
                'hover:border-primary-300 dark:hover:border-primary-600',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              )}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl" role="img" aria-label={option.label}>
                    {option.flag}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {option.nativeLabel}
                    </div>
                  </div>
                </div>
                
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center"
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
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Language Change Feedback */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800"
      >
        <p className="text-sm text-blue-600 dark:text-blue-400">
          {language === 'en' 
            ? 'Language changes take effect immediately throughout the application.'
            : 'Les changements de langue prennent effet immédiatement dans toute l\'application.'
          }
        </p>
      </motion.div>
    </Card>
  );
};