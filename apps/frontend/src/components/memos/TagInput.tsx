import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTagSuggestions } from '../../hooks/useMemos';
import { Badge } from '../ui';
import { cn } from '../../utils';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
  showPopularTags?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  showTagCount?: boolean;
  allowCustomTags?: boolean;
}

export const TagInput = ({
  value = [],
  onChange,
  placeholder = "Add tags...",
  maxTags = 20,
  className,
  showPopularTags = true,
  disabled = false,
  autoFocus = false,
  // showTagCount = true,
  allowCustomTags = true,
}: TagInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: suggestions = [], isLoading } = useTagSuggestions(
    inputValue.length > 0 ? inputValue : undefined
  );

  // Auto-focus input when component mounts
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Filter suggestions to exclude already selected tags
  const filteredSuggestions = suggestions.filter(
    (suggestion) => !value.includes(suggestion) && 
    suggestion.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Get popular tags (most used tags) when no input
  const popularTags = showPopularTags && !inputValue ? 
    suggestions.slice(0, 8).filter(tag => !value.includes(tag)) : [];

  const displaySuggestions = inputValue ? filteredSuggestions : popularTags;

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

  const addTag = useCallback((tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !value.includes(trimmedTag) && value.length < maxTags) {
      setIsAnimating(true);
      onChange([...value, trimmedTag]);
      setInputValue('');
      setIsOpen(false);
      setFocusedIndex(-1);
      
      // Reset animation state after animation completes
      setTimeout(() => setIsAnimating(false), 300);
      
      // Focus input after a short delay to allow animation
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [value, maxTags, onChange]);

  const removeTag = useCallback((tagToRemove: string) => {
    setIsAnimating(true);
    onChange(value.filter(tag => tag !== tagToRemove));
    
    // Reset animation state after animation completes
    setTimeout(() => setIsAnimating(false), 300);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [value, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && displaySuggestions[focusedIndex]) {
          addTag(displaySuggestions[focusedIndex]);
        } else if (inputValue.trim() && allowCustomTags) {
          addTag(inputValue);
        }
        break;
      
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < displaySuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      
      case 'Backspace':
        if (!inputValue && value.length > 0) {
          removeTag(value[value.length - 1]);
        }
        break;
      
      case ',':
      case 'Tab':
        e.preventDefault();
        if (inputValue.trim() && allowCustomTags) {
          addTag(inputValue);
        }
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    setFocusedIndex(-1);
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Tag Input Container */}
      <div className={cn(
        'min-h-[42px] p-2 border rounded-lg transition-all duration-200',
        disabled 
          ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 cursor-not-allowed'
          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 hover:border-gray-400 dark:hover:border-gray-500',
        isAnimating && 'ring-2 ring-primary-200 dark:ring-primary-800'
      )}>
        <div className="flex flex-wrap gap-2">
          {/* Existing Tags */}
          <AnimatePresence>
            {value.map((tag, index) => (
              <motion.div
                key={tag}
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -10 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ 
                  duration: 0.2,
                  delay: index * 0.02,
                  type: "spring",
                  stiffness: 300,
                  damping: 20
                }}
              >
                <Badge
                  variant="primary"
                  className={cn(
                    'flex items-center gap-1 pr-1 transition-all duration-200',
                    !disabled && 'hover:bg-primary-700'
                  )}
                >
                  <span>{tag}</span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-primary-200 hover:text-white transition-colors rounded-full p-0.5 hover:bg-primary-600"
                      aria-label={`Remove ${tag} tag`}
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </Badge>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            placeholder={value.length === 0 ? placeholder : ''}
            disabled={disabled || value.length >= maxTags}
            className={cn(
              'flex-1 min-w-[120px] bg-transparent border-none outline-none placeholder-gray-500 dark:placeholder-gray-400',
              disabled 
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-900 dark:text-white'
            )}
          />
        </div>
      </div>

      {/* Tag Limit Indicator */}
      <div className="flex items-center justify-between mt-1">
        {value.length > 0 && (
          <div className={cn(
            'text-xs',
            value.length >= maxTags 
              ? 'text-amber-600 dark:text-amber-400' 
              : 'text-gray-500 dark:text-gray-400'
          )}>
            {value.length}/{maxTags} tags
            {value.length >= maxTags && ' (maximum reached)'}
          </div>
        )}
        
        {!inputValue && showPopularTags && popularTags.length > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Click to add popular tags
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && !disabled && (displaySuggestions.length > 0 || isLoading || inputValue.trim()) && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto"
          >
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="inline-flex items-center text-gray-500 dark:text-gray-400">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Loading suggestions...
                </div>
              </div>
            ) : (
              <div className="py-1">
                {/* Section header for popular tags */}
                {!inputValue && popularTags.length > 0 && (
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                    Popular Tags
                  </div>
                )}

                {/* Section header for search results */}
                {inputValue && filteredSuggestions.length > 0 && (
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                    Suggestions for "{inputValue}"
                  </div>
                )}

                {/* Suggestion items */}
                {displaySuggestions.map((suggestion, index) => (
                  <motion.button
                    key={suggestion}
                    type="button"
                    onClick={() => addTag(suggestion)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={cn(
                      'w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between',
                      index === focusedIndex && 'bg-gray-100 dark:bg-gray-700'
                    )}
                  >
                    <span className="text-gray-900 dark:text-white">{suggestion}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </motion.button>
                ))}
                
                {/* Add current input as new tag option */}
                {inputValue.trim() && !displaySuggestions.includes(inputValue.trim()) && (
                  <motion.button
                    type="button"
                    onClick={() => addTag(inputValue)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: displaySuggestions.length * 0.02 }}
                    className={cn(
                      'w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-700 flex items-center justify-between',
                      focusedIndex === displaySuggestions.length && 'bg-gray-100 dark:bg-gray-700'
                    )}
                  >
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Create "</span>
                      <span className="text-gray-900 dark:text-white font-medium">{inputValue.trim()}</span>
                      <span className="text-gray-600 dark:text-gray-400">"</span>
                    </div>
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </motion.button>
                )}

                {/* No results message */}
                {!isLoading && displaySuggestions.length === 0 && !inputValue.trim() && (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No popular tags available
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