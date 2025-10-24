import { forwardRef, type InputHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils';

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className' | 'size'> {
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  containerClassName?: string;
}

const switchSizes = {
  sm: {
    track: 'w-8 h-4',
    thumb: 'w-3 h-3',
    translate: 'translate-x-4',
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'w-5 h-5',
    translate: 'translate-x-5',
  },
  lg: {
    track: 'w-14 h-7',
    thumb: 'w-6 h-6',
    translate: 'translate-x-7',
  },
};

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      label,
      description,
      size = 'md',
      className,
      containerClassName,
      checked,
      id,
      ...props
    },
    ref
  ) => {
    const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;
    const sizeConfig = switchSizes[size];

    return (
      <div className={cn('flex items-center justify-between', containerClassName)}>
        {(label || description) && (
          <div className="flex-1 mr-4">
            {label && (
              <label
                htmlFor={switchId}
                className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                {label}
              </label>
            )}
            
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
        )}
        
        <div className="relative">
          <input
            ref={ref}
            id={switchId}
            type="checkbox"
            checked={checked}
            className="sr-only"
            {...props}
          />
          
          <motion.div
            className={cn(
              'relative inline-flex items-center rounded-full transition-colors duration-200 cursor-pointer',
              'focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500',
              sizeConfig.track,
              checked
                ? 'bg-primary-600'
                : 'bg-gray-200 dark:bg-gray-700',
              props.disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
            onClick={() => {
              if (!props.disabled && ref && 'current' in ref && ref.current) {
                ref.current.click();
              }
            }}
          >
            <motion.div
              className={cn(
                'inline-block rounded-full bg-white shadow transform transition-transform duration-200',
                sizeConfig.thumb,
                checked ? sizeConfig.translate : 'translate-x-0.5'
              )}
              animate={{
                x: checked ? sizeConfig.translate.replace('translate-x-', '') : '2px',
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </motion.div>
        </div>
      </div>
    );
  }
);

Switch.displayName = 'Switch';