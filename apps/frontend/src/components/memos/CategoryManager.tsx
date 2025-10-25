import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../../hooks/useCategories';
// import { useMemos } from '../../hooks/useMemos';
import type { Category } from '@memo-app/shared/types';
import { CategoryForm } from './CategoryForm';
import { CategoryCard } from './CategoryCard';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { Button, Card, Spinner, Badge } from '../ui';
import { cn } from '../../utils';

interface CategoryManagerProps {
  onCategorySelect?: (category: Category) => void;
  selectedCategoryId?: string;
  className?: string;
  enableDragAndDrop?: boolean;
  showMemoCount?: boolean;
  allowCategoryReorder?: boolean;
}

type ViewMode = 'list' | 'create' | 'edit';

export const CategoryManager = ({
  onCategorySelect,
  selectedCategoryId,
  className,
  enableDragAndDrop = false,
  showMemoCount = true,
  allowCategoryReorder = false,
}: CategoryManagerProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [draggedCategory, setDraggedCategory] = useState<Category | null>(null);
  const [localCategories, setLocalCategories] = useState<Category[]>([]);

  const { data: categories = [], isLoading, error } = useCategories();
  // const { updateMemoCategory } = useMemos();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  // Use local categories for drag and drop, fallback to server data
  const displayCategories = allowCategoryReorder && localCategories.length > 0 
    ? localCategories 
    : categories;

  // Initialize local categories when server data changes
  useState(() => {
    if (categories.length > 0 && localCategories.length === 0) {
      setLocalCategories(categories);
    }
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleCreateCategory = async (data: any) => {
    try {
      const newCategory = await createCategoryMutation.mutateAsync(data);
      setViewMode('list');
      
      // Update local categories if using drag and drop
      if (allowCategoryReorder) {
        setLocalCategories(prev => [...prev, newCategory]);
      }
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const handleUpdateCategory = async (data: any) => {
    if (!editingCategory) return;
    
    try {
      const updatedCategory = await updateCategoryMutation.mutateAsync({ 
        id: editingCategory.id, 
        updates: data 
      });
      setEditingCategory(null);
      setViewMode('list');
      
      // Update local categories if using drag and drop
      if (allowCategoryReorder) {
        setLocalCategories(prev => 
          prev.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat)
        );
      }
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      await deleteCategoryMutation.mutateAsync(categoryToDelete.id);
      setCategoryToDelete(null);
      
      // Update local categories if using drag and drop
      if (allowCategoryReorder) {
        setLocalCategories(prev => 
          prev.filter(cat => cat.id !== categoryToDelete.id)
        );
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setViewMode('edit');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setEditingCategory(null);
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const category = displayCategories.find(cat => cat.id === active.id);
    setDraggedCategory(category || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedCategory(null);

    if (!over || active.id === over.id) return;

    if (allowCategoryReorder) {
      // Reorder categories
      const oldIndex = displayCategories.findIndex(cat => cat.id === active.id);
      const newIndex = displayCategories.findIndex(cat => cat.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setLocalCategories(arrayMove(displayCategories, oldIndex, newIndex));
      }
    } else if (enableDragAndDrop) {
      // Move memo to different category (if implementing memo drag and drop)
      // const targetCategoryId = over.id as string;
      // const memoId = active.id as string;
      
      // This would be implemented when adding memo drag and drop functionality
      // updateMemoCategory.mutate({ memoId, categoryId: targetCategoryId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading categories...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 dark:text-red-400 mb-2">
          Failed to load categories
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Please try again later
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={cn('space-y-6', className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {viewMode === 'create' ? 'Create Category' :
               viewMode === 'edit' ? 'Edit Category' :
               'Categories'}
            </h2>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {viewMode === 'create' ? 'Add a new category to organize your memos' :
               viewMode === 'edit' ? 'Update category details' :
               enableDragAndDrop ? 'Drag memos between categories to organize them' :
               'Organize your memos with categories'}
            </p>
          </div>

          {viewMode === 'list' && (
            <div className="flex items-center space-x-3">
              {allowCategoryReorder && displayCategories.length > 1 && (
                <Badge variant="secondary" className="text-xs">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  Drag to reorder
                </Badge>
              )}
              
              <Button
                onClick={() => setViewMode('create')}
                className="flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Category
              </Button>
            </div>
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
            >
              {displayCategories.length === 0 ? (
                <Card className="text-center py-12">
                  <div className="text-gray-500 dark:text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No categories yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Create your first category to organize your memos
                    </p>
                    <Button onClick={() => setViewMode('create')}>
                      Create Category
                    </Button>
                  </div>
                </Card>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={displayCategories.map(cat => cat.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {displayCategories.map((category, index) => (
                        <motion.div
                          key={category.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            duration: 0.3,
                            delay: index * 0.05 
                          }}
                        >
                          <CategoryCard
                            category={category}
                            isSelected={selectedCategoryId === category.id}
                            onClick={() => onCategorySelect?.(category)}
                            onEdit={() => handleEditCategory(category)}
                            onDelete={() => setCategoryToDelete(category)}
                            isDraggable={allowCategoryReorder}
                            showMemoCount={showMemoCount}
                            enableDropZone={enableDragAndDrop}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </SortableContext>

                  {/* Drag Overlay */}
                  <DragOverlay>
                    {draggedCategory && (
                      <div className="transform rotate-3 opacity-90">
                        <CategoryCard
                          category={draggedCategory}
                          isSelected={false}
                          showMemoCount={showMemoCount}
                          isDragging
                        />
                      </div>
                    )}
                  </DragOverlay>
                </DndContext>
              )}
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
              <CategoryForm
                onSubmit={handleCreateCategory}
                onCancel={handleBackToList}
                isLoading={createCategoryMutation.isPending}
              />
            </motion.div>
          )}

          {viewMode === 'edit' && editingCategory && (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <CategoryForm
                category={editingCategory}
                onSubmit={handleUpdateCategory}
                onCancel={handleBackToList}
                isLoading={updateCategoryMutation.isPending}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete confirmation modal */}
      <DeleteConfirmationModal
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDeleteCategory}
        memo={null} // We'll create a separate modal for categories
        isLoading={deleteCategoryMutation.isPending}
        title="Delete Category"
        message={
          categoryToDelete ? (
            <>
              Are you sure you want to delete the category "{categoryToDelete.name}"?
              {categoryToDelete.memoCount > 0 && (
                <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    This category contains {categoryToDelete.memoCount} memo{categoryToDelete.memoCount !== 1 ? 's' : ''}. 
                    These memos will become uncategorized.
                  </p>
                </div>
              )}
            </>
          ) : null
        }
      />
    </>
  );
};