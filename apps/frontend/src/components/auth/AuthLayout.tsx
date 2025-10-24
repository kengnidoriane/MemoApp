import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { Card } from '../ui/Card';
import { cn } from '../../utils';

type AuthMode = 'login' | 'register' | 'forgot-password';

interface AuthLayoutProps {
  initialMode?: AuthMode;
  onSuccess?: () => void;
  className?: string;
}

export const AuthLayout = ({ 
  initialMode = 'login', 
  onSuccess,
  className 
}: AuthLayoutProps) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  const handleSuccess = () => {
    onSuccess?.();
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
  };

  const getTitle = () => {
    switch (mode) {
      case 'login':
        return 'Welcome Back';
      case 'register':
        return 'Create Account';
      case 'forgot-password':
        return 'Reset Password';
      default:
        return 'Authentication';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'login':
        return 'Sign in to your MemoApp account';
      case 'register':
        return 'Start your learning journey today';
      case 'forgot-password':
        return 'We\'ll help you get back in';
      default:
        return '';
    }
  };

  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 p-4',
      className
    )}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 shadow-xl">
          {/* Header */}
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center mb-8"
          >
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {getTitle()}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {getSubtitle()}
            </p>
          </motion.div>

          {/* Form Content */}
          <AnimatePresence mode="wait">
            {mode === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <LoginForm
                  onSuccess={handleSuccess}
                  onForgotPassword={() => handleModeChange('forgot-password')}
                />
              </motion.div>
            )}

            {mode === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <RegisterForm onSuccess={handleSuccess} />
              </motion.div>
            )}

            {mode === 'forgot-password' && (
              <motion.div
                key="forgot-password"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <ForgotPasswordForm onBack={() => handleModeChange('login')} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mode Toggle */}
          {mode !== 'forgot-password' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-8 text-center"
            >
              <p className="text-gray-600 dark:text-gray-400">
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                {' '}
                <button
                  onClick={() => handleModeChange(mode === 'login' ? 'register' : 'login')}
                  className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </motion.div>
          )}
        </Card>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2024 MemoApp. All rights reserved.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};