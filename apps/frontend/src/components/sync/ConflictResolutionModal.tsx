import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSyncStore } from '../../stores/syncStore';
import { syncManager } from '../../lib/syncManager';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { Memo, Category } from '@memo-app/shared/types';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConflictItem {
  id: string;
  type: 'memo' | 'category';
  localVersion: Memo | Category;
  serverVersion: Memo | Category;
  timestamp: Date;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { conflicts, removeConflict } = useSyncStore();
  const [selectedConflict, setSelectedConflict] = useState<ConflictItem | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const handleResolveConflict = async (
    conflictId: string,
    resolution: 'local' | 'server' | 'merge',
    mergedData?: any
  ) => {
    setIsResolving(true);
    
    try {
      await syncManager.resolveConflict(conflictId, resolution, mergedData);
      removeConflict(conflictId);
      
      // If this was the selected conflict, clear selection
      if (selectedConflict?.id === conflictId) {
        setSelectedConflict(null);
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const renderConflictPreview = (item: Memo | Category, type: 'memo' | 'category') => {
    if (type === 'memo') {
      const memo = item as Memo;
      return (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 dark:text-white">{memo.title}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
            {memo.content}
          </p>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>Updated: {formatDate(memo.updatedAt)}</span>
            {memo.tags.length > 0 && (
              <div className="flex items-center space-x-1">
                <span>Tags:</span>
                {memo.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" size="sm">
                    {tag}
                  </Badge>
                ))}
                {memo.tags.length > 3 && (
                  <span className="text-gray-400">+{memo.tags.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>
      );
    } else {
      const category = item as Category;
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: category.color }}
            />
            <h4 className="font-medium text-gray-900 dark:text-white">{category.name}</h4>
          </div>
          <div className="text-xs text-gray-500">
            <span>Updated: {formatDate(category.updatedAt)}</span>
            <span className="ml-4">Memos: {category.memoCount}</span>
          </div>
        </div>
      );
    }
  };

  const renderConflictDetail = (conflict: ConflictItem) => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Resolve Conflict: {conflict.type === 'memo' ? 'Memo' : 'Category'}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedConflict(null)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Local Version */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-blue-600 dark:text-blue-400">
                Your Version (Local)
              </h4>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                Local
              </Badge>
            </div>
            {renderConflictPreview(conflict.localVersion, conflict.type)}
            <div className="mt-4">
              <Button
                onClick={() => handleResolveConflict(conflict.id, 'local')}
                disabled={isResolving}
                className="w-full"
                variant="outline"
              >
                Keep Local Version
              </Button>
            </div>
          </Card>

          {/* Server Version */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-green-600 dark:text-green-400">
                Server Version (Remote)
              </h4>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Server
              </Badge>
            </div>
            {renderConflictPreview(conflict.serverVersion, conflict.type)}
            <div className="mt-4">
              <Button
                onClick={() => handleResolveConflict(conflict.id, 'server')}
                disabled={isResolving}
                className="w-full"
                variant="outline"
              >
                Keep Server Version
              </Button>
            </div>
          </Card>
        </div>

        {/* Merge Option (for memos) */}
        {conflict.type === 'memo' && (
          <Card className="p-4 border-purple-200 dark:border-purple-800">
            <h4 className="font-medium text-purple-600 dark:text-purple-400 mb-3">
              Manual Merge
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              You can manually combine both versions. This will open the memo editor 
              with both versions for you to merge.
            </p>
            <Button
              onClick={() => {
                // TODO: Implement merge editor
                console.log('Open merge editor for:', conflict.id);
              }}
              disabled={isResolving}
              variant="outline"
              className="text-purple-600 border-purple-600 hover:bg-purple-50"
            >
              Open Merge Editor
            </Button>
          </Card>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500">
            Conflict detected: {formatDate(conflict.timestamp)}
          </div>
          <Button
            onClick={() => setSelectedConflict(null)}
            variant="ghost"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  if (conflicts.length === 0) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        <AnimatePresence mode="wait">
          {selectedConflict ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderConflictDetail(selectedConflict)}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Sync Conflicts ({conflicts.length})
                </h2>
                <Button variant="ghost" onClick={onClose}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              <div className="space-y-4">
                {conflicts.map((conflict) => (
                  <Card 
                    key={conflict.id} 
                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setSelectedConflict(conflict)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {conflict.type === 'memo' ? (
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a.997.997 0 01-1.414 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {conflict.type === 'memo' 
                              ? (conflict.localVersion as Memo).title 
                              : (conflict.localVersion as Category).name
                            }
                          </h3>
                          <p className="text-sm text-gray-500">
                            {conflict.type === 'memo' ? 'Memo' : 'Category'} • 
                            Conflict detected {formatDate(conflict.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="destructive" size="sm">
                          Conflict
                        </Badge>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                      Resolve conflicts to continue syncing
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      These items have been modified both locally and on the server. 
                      Choose which version to keep or merge them manually.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
};