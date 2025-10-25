import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCategories } from '../../hooks/useCategories';
// import { Badge } from '../ui';
import { cn } from '../../utils';

interface CategorySelectProps {
  value?: string;
  onChange: (categoryId?: string) => void;
  placeholder?: string;
  className?: string;
}

export const CategorySelect = ({
  value,
  onChange,
  placeholder = "Select a category...",
  className,
}: CategorySelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { data: categories = [], isLoading } = useCategories();

  const selectedCategory = categories.find(cat => cat.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0) {
          const category = categories[focusedIndex];
          onChange(category?.id);
          setIsOpen(false);
        } else {
          setIsOpen(!isOpen);
        }
        break;
      
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex(prev => 
            prev < categories.length - 1 ? prev + 1 : prev
          );
        }
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => prev > 0 ? prev - 1 : -1);
        }
        break;
      
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
        break;
      
      case 'Backspace':
      case 'Delete':
        if (selectedCategory) {
          onChange(undefined);
        }
        break;
    }
  };

  const handleSelect = (categoryId?: string) => {
    onChange(categoryId);
    setIsOpen(false);
    setFocusedIndex(-1);
    buttonRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Select Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full px-3 py-2 text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg',
          'focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors',
          'flex items-center justify-between',
          isOpen && 'ring-2 ring-primary-500 border-primary-500'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center">
          {selectedCategory ? (
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: selectedCategory.color }}
              />
              <span className="text-gray-900 dark:text-white">
                {selectedCategory.name}
              </span>
            </div>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">
              {placeholder}
            </span>
          )}
        </div>
        
        <svg
          className={cn(
            'w-5 h-5 text-gray-400 transition-transform duration-200',
            isOpen && 'transform rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            role="listbox"
          >
            {isLoading ? (
              <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                Loading categories...
              </div>
            ) : (
              <div className="py-1">
                {/* Clear selection option */}
                <button
                  type="button"
                  onClick={() => handleSelect(undefined)}
                  className={cn(
                    'w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                    focusedIndex === -1 && 'bg-gray-100 dark:bg-gray-700'
                  )}
                  role="option"
                  aria-selected={!selectedCategory}
                >
                  <span className="text-gray-500 dark:text-gray-400 italic">
                    No category
                  </span>
                </button>

                {/* Category options */}
                {categories.map((category, index) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleSelect(category.id)}
                    className={cn(
                      'w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                      'flex items-center',
                      index === focusedIndex && 'bg-gray-100 dark:bg-gray-700',
                      selectedCategory?.id === category.id && 'bg-primary-50 dark:bg-primary-900/20'
                    )}
                    role="option"
                    aria-selected={selectedCategory?.id === category.id}
                  >
                    <div
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-gray-900 dark:text-white">
                      {category.name}
                    </span>
                    {selectedCategory?.id === category.id && (
                      <svg
                        className="w-4 h-4 ml-auto text-primary-600 dark:text-primary-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}

                {categories.length === 0 && (
                  <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                    No categories available
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};