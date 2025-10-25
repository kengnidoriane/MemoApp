import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  XMarkIcon, 
  ExclamationTriangleIcon,
  TrashIcon,
  ShieldCheckIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import { useToast } from '../../providers/ToastProvider';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../services/authService';

interface AccountDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccountDeletionModal: React.FC<AccountDeletionModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'warning' | 'confirmation' | 'final'>('warning');
  const [confirmationText, setConfirmationText] = useState('');
  const [acknowledgeDataLoss, setAcknowledgeDataLoss] = useState(false);
  const [acknowledgeIrreversible, setAcknowledgeIrreversible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { user, clearAuth } = useAuthStore();
  const { showToast } = useToast();

  const handleClose = () => {
    if (!isDeleting) {
      setStep('warning');
      setConfirmationText('');
      setAcknowledgeDataLoss(false);
      setAcknowledgeIrreversible(false);
      onClose();
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || confirmationText !== 'DELETE MY ACCOUNT') {
      return;
    }

    setIsDeleting(true);
    
    try {
      // Call the delete account API
      await authService.deleteAccount();

      showToast({
        type: 'success',
        title: 'Account Deleted',
        message: 'Your account and all associated data have been permanently deleted.',
      });

      // Log out and redirect
      clearAuth();
      window.location.href = '/';
    } catch (error) {
      console.error('Account deletion error:', error);
      showToast({
        type: 'error',
        title: 'Deletion Failed',
        message: 'Failed to delete your account. Please try again or contact support.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const canProceedToConfirmation = acknowledgeDataLoss && acknowledgeIrreversible;
  const canDeleteAccount = confirmationText === 'DELETE MY ACCOUNT' && canProceedToConfirmation;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Account Management
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isDeleting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-5 h-5" />
          </Button>
        </div>

        {step === 'warning' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* GDPR Information */}
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <ShieldCheckIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Your Data Rights (GDPR Compliance)
                  </h3>
                  <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                    <p>
                      You have the right to request deletion of your personal data. 
                      Before proceeding, please note:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>All your memos, categories, and learning progress will be permanently deleted</li>
                      <li>Your quiz history and analytics data will be removed</li>
                      <li>This action cannot be undone</li>
                      <li>You can export your data before deletion if needed</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>

            {/* Data Export Reminder */}
            <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <DocumentTextIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                    Export Your Data First
                  </h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Consider exporting your data before deletion. You can download all your memos, 
                    categories, and learning progress in various formats.
                  </p>
                </div>
              </div>
            </Card>

            {/* Warning Message */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-red-900 dark:text-red-100 mb-2">
                    Permanent Account Deletion
                  </h3>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    This action will permanently delete your account and all associated data. 
                    This includes all memos, categories, quiz history, and learning progress. 
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            {/* Acknowledgment Checkboxes */}
            <div className="space-y-3">
              <Checkbox
                id="acknowledge-data-loss"
                checked={acknowledgeDataLoss}
                onChange={(e) => setAcknowledgeDataLoss(e.target.checked)}
                label="I understand that all my data will be permanently deleted"
              />
              <Checkbox
                id="acknowledge-irreversible"
                checked={acknowledgeIrreversible}
                onChange={(e) => setAcknowledgeIrreversible(e.target.checked)}
                label="I understand that this action cannot be undone"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep('confirmation')}
                disabled={!canProceedToConfirmation}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Continue to Deletion
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'confirmation' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <TrashIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Final Confirmation Required
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                To confirm account deletion, please type{' '}
                <span className="font-mono font-bold text-red-600 dark:text-red-400">
                  DELETE MY ACCOUNT
                </span>{' '}
                in the field below.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirmation Text
              </label>
              <Input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Type: DELETE MY ACCOUNT"
                className="font-mono"
                autoComplete="off"
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                What will be deleted:
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Your user account and profile</li>
                <li>• All memos and their content</li>
                <li>• All categories and tags</li>
                <li>• Quiz history and results</li>
                <li>• Learning progress and analytics</li>
                <li>• All personal preferences and settings</li>
              </ul>
            </div>

            <div className="flex justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setStep('warning')}>
                Back
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={!canDeleteAccount || isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting Account...
                  </>
                ) : (
                  <>
                    <TrashIcon className="w-4 h-4" />
                    Delete My Account
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </Modal>
  );
};

export default AccountDeletionModal;