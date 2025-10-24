import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import type { Memo } from '@memo-app/shared/types';
import { Card, Badge, Button } from '../ui';
import { MemoForm } from './MemoForm';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { useCategories } from '../../hooks/useCategories';
import { useUpdateMemo, useDeleteMemo } from '../../hooks/useMemos';
import { cn } from '../../utils';

interface MemoDetailViewProps {
  memo: Memo;
  onClose?: () => void;
  onDeleted?: () => void;
  className?: string;
}

export const MemoDetailView = ({
  memo,
  onClose,
  onDeleted,
  className,
}: MemoDetailViewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const { data: categories = [] } = useCategories();
  const updateMemoMutation = useUpdateMemo();
  const deleteMemoMutation = useDeleteMemo();
  
  const category = categories.find(cat => cat.id === memo.categoryId);

  const handleUpdate = async (updates: any) => {
    try {
      await updateMemoMutation.mutateAsync({ id: memo.id, updates });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update memo:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMemoMutation.mutateAsync(memo.id);
      setShowDeleteModal(false);
      onDeleted?.();
    } catch (error) {
      console.error('Failed to delete memo:', error);
    }
  };

  if (isEditing) {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit Memo
          </h2>
          <Button
            variant="outline"
            onClick={() => setIsEditing(false)}
            disabled={updateMemoMutation.isPending}
          >
            Cancel
          </Button>
        </div>

        {/* Edit Form */}
        <MemoForm
          memo={memo}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
          isLoading={updateMemoMutation.isPending}
        />
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn('space-y-6', className)}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-1"
                  aria-label="Go back"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
              )}
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {memo.title}
              </h1>
            </div>
            
            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>
                Created {formatDistanceToNow(new Date(memo.createdAt), { addSuffix: true })}
              </span>
              {memo.updatedAt !== memo.createdAt && (
                <span>
                  Updated {formatDistanceToNow(new Date(memo.updatedAt), { addSuffix: true })}
                </span>
              )}
              {memo.reviewCount > 0 && (
                <span>
                  {memo.reviewCount} review{memo.reviewCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 ml-4">
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              disabled={updateMemoMutation.isPending}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </Button>
          </div>
        </div>

        {/* Category and Tags */}
        <div className="flex flex-wrap items-center gap-3">
          {category && (
            <Badge 
              variant="outline" 
              className="flex items-center"
              style={{ 
                borderColor: category.color,
                color: category.color 
              }}
            >
              <div
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: category.color }}
              />
              {category.name}
            </Badge>
          )}
          
          {memo.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Content */}
        <Card className="prose prose-gray dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-gray-900 dark:text-white leading-relaxed">
            {memo.content}
          </div>
        </Card>

        {/* Learning Progress */}
        {memo.reviewCount > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Learning Progress
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {memo.reviewCount}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Reviews
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {memo.difficultyLevel}/5
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Difficulty Level
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {memo.intervalDays}d
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Review Interval
                </div>
              </div>
            </div>

            {memo.lastReviewedAt && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Last reviewed: {format(new Date(memo.lastReviewedAt), 'PPp')}
                </p>
              </div>
            )}

            {memo.nextReviewAt && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Next review: {format(new Date(memo.nextReviewAt), 'PPp')}
                  <span className="ml-1">
                    ({formatDistanceToNow(new Date(memo.nextReviewAt), { addSuffix: true })})
                  </span>
                </p>
              </div>
            )}
          </Card>
        )}
      </motion.div>

      {/* Delete confirmation modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        memo={memo}
        isLoading={deleteMemoMutation.isPending}
      />
    </>
  );
};