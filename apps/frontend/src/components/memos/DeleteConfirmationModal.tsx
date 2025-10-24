import { motion } from 'framer-motion';
import type { Memo } from '@memo-app/shared/types';
import { Modal, Button } from '../ui';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  memo?: Memo | null;
  isLoading?: boolean;
  title?: string;
  message?: React.ReactNode;
}

export const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  memo,
  isLoading = false,
  title = "Delete Memo",
  message,
}: DeleteConfirmationModalProps) => {
  // If no memo and no custom message, don't render
  if (!memo && !message) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
    >
      <div className="space-y-4">
        {/* Warning icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="flex justify-center"
        >
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </motion.div>

        {/* Content */}
        <div className="text-center">
          {message ? (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {message}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This action cannot be undone.
              </p>
            </div>
          ) : memo ? (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Are you sure you want to delete this memo?
              </h3>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  "{memo.title}"
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {memo.content.length > 100 
                    ? memo.content.substring(0, 100) + '...'
                    : memo.content
                  }
                </p>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This action cannot be undone. The memo and all its review history will be permanently deleted.
              </p>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          <Button
            variant="destructive"
            onClick={onConfirm}
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : `Delete ${title.replace('Delete ', '')}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};