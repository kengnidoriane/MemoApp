import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Memo } from '@memo-app/shared/types';
import type { MemoSearchParams } from '../../services/memoService';
import { MemoList } from './MemoList';
import { MemoForm } from './MemoForm';
import { MemoDetailView } from './MemoDetailView';
import { MemoFilters } from './MemoFilters';
import { SearchResults } from './SearchResults';
import { Button } from '../ui';
import { useCreateMemo, useMemos } from '../../hooks/useMemos';
import { cn } from '../../utils';

type ViewMode = 'list' | 'create' | 'detail' | 'edit';

interface MemoPageProps {
  className?: string;
}

export const MemoPage = ({ className }: MemoPageProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [filters, setFilters] = useState<MemoSearchParams>({
    page: 1,
    limit: 20,
  });
  
  const createMemoMutation = useCreateMemo();
  const { data: memoData } = useMemos(filters);

  const handleCreateMemo = async (data: any) => {
    try {
      const newMemo = await createMemoMutation.mutateAsync(data);
      setSelectedMemo(newMemo);
      setViewMode('detail');
    } catch (error) {
      console.error('Failed to create memo:', error);
    }
  };

  const handleMemoClick = (memo: Memo) => {
    setSelectedMemo(memo);
    setViewMode('detail');
  };

  const handleMemoEdit = (memo: Memo) => {
    setSelectedMemo(memo);
    setViewMode('edit');
  };

  const handleBackToList = () => {
    setSelectedMemo(null);
    setViewMode('list');
  };

  const handleMemoDeleted = () => {
    setSelectedMemo(null);
    setViewMode('list');
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {viewMode === 'create' ? 'Create New Memo' :
             viewMode === 'detail' ? 'Memo Details' :
             viewMode === 'edit' ? 'Edit Memo' :
             'My Memos'}
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {viewMode === 'create' ? 'Add a new memo to your collection' :
             viewMode === 'detail' || viewMode === 'edit' ? 'View and manage your memo' :
             'Manage your personal knowledge collection'}
          </p>
        </div>

        {viewMode === 'list' && (
          <Button
            onClick={() => setViewMode('create')}
            className="flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Memo
          </Button>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <MemoFilters
              filters={filters}
              onFiltersChange={setFilters}
              isLoading={false}
              totalResults={memoData?.total}
            />
            {filters.search && memoData && (
              <SearchResults
                query={filters.search}
                totalResults={memoData.total}
                onClearSearch={() => setFilters({ ...filters, search: undefined, page: 1 })}
              />
            )}
            <MemoList
              filters={filters}
              onMemoClick={handleMemoClick}
              onMemoEdit={handleMemoEdit}
            />
          </motion.div>
        )}

        {viewMode === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <MemoForm
              onSubmit={handleCreateMemo}
              onCancel={handleBackToList}
              isLoading={createMemoMutation.isPending}
            />
          </motion.div>
        )}

        {(viewMode === 'detail' || viewMode === 'edit') && selectedMemo && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <MemoDetailView
              memo={selectedMemo}
              onClose={handleBackToList}
              onDeleted={handleMemoDeleted}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};