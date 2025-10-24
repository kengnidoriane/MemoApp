import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemos, useDeleteMemo } from '../../hooks/useMemos';
import type { MemoSearchParams } from '../../services/memoService';
import type { Memo } from '@memo-app/shared/types';
import { MemoCard } from './MemoCard';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { EmptyState } from './EmptyState';
import { MemoListSkeleton } from './MemoCardSkeleton';
import { cn } from '../../utils';

interface MemoListProps {
  filters?: MemoSearchParams;
  onMemoClick?: (memo: Memo) => void;
  onMemoEdit?: (memo: Memo) => void;
  className?: string;
  showActions?: boolean;
}

export const MemoList = ({
  filters,
  onMemoClick,
  onMemoEdit,
  className,
  showActions = true,
}: MemoListProps) => {
  const [memoToDelete, setMemoToDelete] = useState<Memo | null>(null);
  
  const { data, isLoading, error } = useMemos(filters);
  const deleteMemoMutation = useDeleteMemo();

  const handleDeleteConfirm = async () => {
    if (!memoToDelete) return;
    
    try {
      await deleteMemoMutation.mutateAsync(memoToDelete.id);
      setMemoToDelete(null);
    } catch (error) {
      console.error('Failed to delete memo:', error);
    }
  };

  if (isLoading) {
    return <MemoListSkeleton className={className} />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400 mb-2">
          Failed to load memos
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Please try again later
        </p>
      </div>
    );
  }

  if (!data?.items || data.items.length === 0) {
    const hasSearch = !!filters?.search;
    const hasFilters = !!(filters?.categoryId || filters?.tags?.length || filters?.dateFrom || filters?.dateTo);
    const hasAnyFilters = hasSearch || hasFilters;
    
    return (
      <EmptyState
        title={
          hasSearch ? "No search results" :
          hasFilters ? "No memos match your filters" :
          "No memos yet"
        }
        description={
          hasSearch ? `No memos found matching "${filters.search}". Try different keywords or check your spelling.` :
          hasFilters ? "Try adjusting your category, tags, or date filters to find what you're looking for." :
          "Create your first memo to start building your knowledge collection. Add thoughts, ideas, or anything you want to remember."
        }
        variant={
          hasSearch ? 'search' :
          hasFilters ? 'filter' :
          'default'
        }
        action={
          !hasAnyFilters ? {
            label: "Create Your First Memo",
            onClick: () => {
              // This would typically be handled by the parent component
              console.log('Create memo clicked');
            }
          } : undefined
        }
        className={className}
      />
    );
  }

  return (
    <>
      <div className={cn('space-y-4', className)}>
        <AnimatePresence>
          {data.items.map((memo: Memo, index: number) => (
            <motion.div
              key={memo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                duration: 0.3,
                delay: index * 0.05 // Stagger animation
              }}
            >
              <MemoCard
                memo={memo}
                onClick={() => onMemoClick?.(memo)}
                onEdit={() => onMemoEdit?.(memo)}
                onDelete={() => setMemoToDelete(memo)}
                showActions={showActions}
                searchTerm={filters?.search}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination info */}
      {data.totalPages > 1 && (
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Showing {data.items.length} of {data.total} memos
          {data.page < data.totalPages && (
            <span> • Page {data.page} of {data.totalPages}</span>
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      <DeleteConfirmationModal
        isOpen={!!memoToDelete}
        onClose={() => setMemoToDelete(null)}
        onConfirm={handleDeleteConfirm}
        memo={memoToDelete}
        isLoading={deleteMemoMutation.isPending}
      />
    </>
  );
};