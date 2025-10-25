import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Navigation
  { keys: ['?'], description: 'Show keyboard shortcuts', category: 'Navigation' },
  { keys: ['/'], description: 'Focus search', category: 'Navigation' },
  { keys: ['Escape'], description: 'Close modal or dropdown', category: 'Navigation' },
  { keys: ['Tab'], description: 'Navigate forward', category: 'Navigation' },
  { keys: ['Shift', 'Tab'], description: 'Navigate backward', category: 'Navigation' },
  
  // Memos
  { keys: ['n'], description: 'Create new memo', category: 'Memos' },
  { keys: ['e'], description: 'Edit selected memo', category: 'Memos' },
  { keys: ['Delete'], description: 'Delete selected memo', category: 'Memos' },
  { keys: ['↑', '↓'], description: 'Navigate memo list', category: 'Memos' },
  { keys: ['Enter'], description: 'Open selected memo', category: 'Memos' },
  
  // Quiz
  { keys: ['Space'], description: 'Start quiz or reveal answer', category: 'Quiz' },
  { keys: ['1'], description: 'Mark as remembered', category: 'Quiz' },
  { keys: ['2'], description: 'Mark as forgotten', category: 'Quiz' },
  
  // General
  { keys: ['Ctrl', 's'], description: 'Save current item', category: 'General' },
  { keys: ['Ctrl', 'z'], description: 'Undo last action', category: 'General' },
  { keys: ['F1'], description: 'Show help', category: 'General' },
];

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcuts = ({ isOpen, onClose }: KeyboardShortcutsProps) => {
  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  const renderKeys = (keys: string[]) => (
    <div className="flex items-center space-x-1">
      {keys.map((key, index) => (
        <span key={index} className="flex items-center">
          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
            {key}
          </kbd>
          {index < keys.length - 1 && (
            <span className="mx-1 text-gray-400">+</span>
          )}
        </span>
      ))}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      size="lg"
    >
      <div className="max-h-96 overflow-y-auto">
        <div className="space-y-6">
          {categories.map((category) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts
                  .filter(shortcut => shortcut.category === category)
                  .map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {shortcut.description}
                      </span>
                      {renderKeys(shortcut.keys)}
                    </div>
                  ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Press <kbd className="px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">?</kbd> anytime to show these shortcuts
        </p>
      </div>
    </Modal>
  );
};

// Hook to manage keyboard shortcuts modal
export const useKeyboardShortcuts = () => {
  const [isOpen, setIsOpen] = useState(false);

  const showShortcuts = () => setIsOpen(true);
  const hideShortcuts = () => setIsOpen(false);

  return {
    isOpen,
    showShortcuts,
    hideShortcuts,
    KeyboardShortcutsModal: ({ ...props }) => (
      <KeyboardShortcuts
        isOpen={isOpen}
        onClose={hideShortcuts}
        {...props}
      />
    ),
  };
};