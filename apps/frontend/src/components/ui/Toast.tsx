import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils';

interface ToastProps {
  id: string;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: (id: string) => void;
}

const toastVariants = {
  success: {
    bg: 'bg-success-50 dark:bg-success-900',
    border: 'border-success-200 dark:border-success-700',
    icon: 'text-success-600 dark:text-success-400',
    text: 'text-success-800 dark:text-success-200',
  },
  error: {
    bg: 'bg-error-50 dark:bg-error-900',
    border: 'border-error-200 dark:border-error-700',
    icon: 'text-error-600 dark:text-error-400',
    text: 'text-error-800 dark:text-error-200',
  },
  warning: {
    bg: 'bg-warning-50 dark:bg-warning-900',
    border: 'border-warning-200 dark:border-warning-700',
    icon: 'text-warning-600 dark:text-warning-400',
    text: 'text-warning-800 dark:text-warning-200',
  },
  info: {
    bg: 'bg-info-50 dark:bg-info-900',
    border: 'border-info-200 dark:border-info-700',
    icon: 'text-info-600 dark:text-info-400',
    text: 'text-info-800 dark:text-info-200',
  },
};

const icons = {
  success: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

export const Toast = ({
  id,
  title,
  message,
  type = 'info',
  duration = 5000,
  onClose,
}: ToastProps) => {
  const variant = toastVariants[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.3 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
      className={cn(
        'max-w-sm w-full shadow-lg rounded-lg pointer-events-auto border',
        variant.bg,
        variant.border
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className={cn('flex-shrink-0', variant.icon)}>
            {icons[type]}
          </div>
          
          <div className="ml-3 w-0 flex-1">
            {title && (
              <p className={cn('text-sm font-medium', variant.text)}>
                {title}
              </p>
            )}
            <p className={cn('text-sm', title ? 'mt-1' : '', variant.text)}>
              {message}
            </p>
          </div>
          
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className={cn(
                'rounded-md inline-flex focus:outline-none focus:ring-2 focus:ring-offset-2',
                variant.text,
                'hover:opacity-75'
              )}
              onClick={() => onClose(id)}
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Toast Container
interface ToastContainerProps {
  toasts: ToastProps[];
}

export const ToastContainer = ({ toasts }: ToastContainerProps) => {
  return (
    <div className="fixed top-0 right-0 z-50 p-6 space-y-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </AnimatePresence>
    </div>
  );
};