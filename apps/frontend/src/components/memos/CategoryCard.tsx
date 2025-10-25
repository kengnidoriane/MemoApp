import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Category } from '@memo-app/shared/types';
import { Card, Badge, Button } from '../ui';
import { cn } from '../../utils';

interface CategoryCardProps {
  category: Category;
  isSelected?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
  showActions?: boolean;
  isDraggable?: boolean;
  showMemoCount?: boolean;
  enableDropZone?: boolean;
  isDragging?: boolean;
}

export const CategoryCard = ({
  category,
  isSelected = false,
  onClick,
  onEdit,
  onDelete,
  className,
  showActions = true,
  isDraggable = false,
  showMemoCount = true,
  enableDropZone = false,
  isDragging = false,
}: CategoryCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);

  // Drag and drop setup
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: category.id,
    disabled: !isDraggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on action buttons or drag handle
    if ((e.target as HTMLElement).closest('[data-action-button]') || 
        (e.target as HTMLElement).closest('[data-drag-handle]')) {
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

  const handleDragOver = (e: React.DragEvent) => {
    if (enableDropZone) {
      e.preventDefault();
      setIsDropTarget(true);
    }
  };

  const handleDragLeave = () => {
    setIsDropTarget(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropTarget(false);
    // Handle memo drop logic here if needed
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'transition-all duration-200',
        (isSortableDragging || isDragging) && 'opacity-50 scale-105 rotate-2 z-50',
        className
      )}
    >
      <Card
        hover={!!onClick && !isDragging}
        className={cn(
          'relative group cursor-pointer transition-all duration-200',
          isSelected && 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20',
          isDropTarget && 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20',
          enableDropZone && 'border-dashed border-2',
          (isSortableDragging || isDragging) && 'shadow-2xl'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        motionProps={{
          whileHover: onClick && !isDragging ? { y: -2, scale: 1.02 } : undefined,
          transition: { duration: 0.2 }
        }}
      >
        {/* Color indicator */}
        <div 
          className="absolute top-0 left-0 w-full h-1 rounded-t-lg" 
          style={{ backgroundColor: category.color }} 
        />

        {/* Drop zone indicator */}
        {isDropTarget && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center"
          >
            <div className="text-green-600 dark:text-green-400 text-center">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <p className="text-sm font-medium">Drop memo here</p>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Drag handle */}
            {isDraggable && (
              <button
                {...listeners}
                data-drag-handle
                className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing"
                aria-label="Drag to reorder category"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              </button>
            )}
            
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: category.color }}
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {category.name}
              </h3>
              {showMemoCount && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {category.memoCount} memo{category.memoCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          {showActions && !isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center space-x-1 ml-2"
            >
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  data-action-button
                  className="p-1.5"
                  aria-label="Edit category"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                  aria-label="Delete category"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </Button>
              )}
            </motion.div>
          )}
        </div>

      {/* Stats */}
      <div className="space-y-2">
        {category.memoCount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Memos</span>
            <Badge variant="secondary" className="text-xs">
              {category.memoCount}
            </Badge>
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Created</span>
          <span className="text-gray-500 dark:text-gray-400">
            {formatDistanceToNow(new Date(category.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3"
        >
          <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </motion.div>
      )}
    </Card>
    </div>
  );
};