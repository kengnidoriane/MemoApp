import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import type { Memo } from '@memo-app/shared/types';
import { Card, Badge, Button } from '../ui';
import { useCategories } from '../../hooks/useCategories';
import { useResponsive, useTouch } from '../../hooks';
import { highlightSearchTerm } from './SearchResults';
import { cn } from '../../utils';

interface MemoCardProps {
  memo: Memo;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
  showActions?: boolean;
  searchTerm?: string;
}

export const MemoCard = ({
  memo,
  onClick,
  onEdit,
  onDelete,
  className,
  showActions = true,
  searchTerm,
}: MemoCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { data: categories = [] } = useCategories();
  const { isMobile } = useResponsive();
  const isTouch = useTouch();
  
  const category = categories.find(cat => cat.id === memo.categoryId);
  
  // Truncate content for preview
  const previewContent = memo.content.length > 150 
    ? memo.content.substring(0, 150) + '...'
    : memo.content;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on action buttons
    if ((e.target as HTMLElement).closest('[data-action-button]')) {
      return;
    }
    onClick?.();
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <Card
      hover={!!onClick}
      className={cn('relative group', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      motionProps={{
        whileHover: onClick ? { y: -2, scale: 1.01 } : undefined,
        transition: { duration: 0.2 }
      }}
    >
      {/* Category indicator */}
      {category && (
        <div className="absolute top-0 left-0 w-full h-1 rounded-t-lg" style={{ backgroundColor: category.color }} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {searchTerm ? highlightSearchTerm(memo.title, searchTerm) : memo.title}
          </h3>
          <div className="flex items-center mt-1 space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <span>
              {formatDistanceToNow(new Date(memo.updatedAt), { addSuffix: true })}
            </span>
            {memo.reviewCount > 0 && (
              <>
                <span>•</span>
                <span>{memo.reviewCount} reviews</span>
              </>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {showActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: (isHovered || isMobile || isTouch) ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center space-x-1 ml-2"
          >
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                data-action-button
                className={cn(
                  'p-1.5',
                  (isMobile || isTouch) && 'min-h-touch min-w-touch p-3'
                )}
                aria-label="Edit memo"
              >
                <svg className={cn('w-4 h-4', (isMobile || isTouch) && 'w-5 h-5')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
            )}
            
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                data-action-button
                className={cn(
                  'p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20',
                  (isMobile || isTouch) && 'min-h-touch min-w-touch p-3'
                )}
                aria-label="Delete memo"
              >
                <svg className={cn('w-4 h-4', (isMobile || isTouch) && 'w-5 h-5')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            )}
          </motion.div>
        )}
      </div>

      {/* Content preview */}
      <div className="mb-4">
        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
          {searchTerm ? highlightSearchTerm(previewContent, searchTerm) : previewContent}
        </p>
      </div>

      {/* Footer */}
      <div className={cn(
        'flex items-center justify-between',
        isMobile && 'flex-col items-start space-y-2'
      )}>
        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {memo.tags.slice(0, isMobile ? 2 : 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {memo.tags.length > (isMobile ? 2 : 3) && (
            <Badge variant="secondary" className="text-xs">
              +{memo.tags.length - (isMobile ? 2 : 3)} more
            </Badge>
          )}
        </div>

        {/* Category badge */}
        {category && (
          <Badge 
            variant="outline" 
            className="text-xs"
            style={{ 
              borderColor: category.color,
              color: category.color 
            }}
          >
            {category.name}
          </Badge>
        )}
      </div>

      {/* Next review indicator */}
      {memo.nextReviewAt && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span>
              Next review: {formatDistanceToNow(new Date(memo.nextReviewAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};