import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTagSuggestions } from '../../hooks/useMemos';
import { Badge, Button, Input, Card } from '../ui';
import { cn } from '../../utils';

interface TagManagerProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  className?: string;
}

export const TagManager = ({
  selectedTags,
  onTagsChange,
  className,
}: TagManagerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: allTags = [], isLoading } = useTagSuggestions();

  // Filter tags based on search query
  const filteredTags = allTags.filter(tag =>
    tag.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedTags.includes(tag)
  );

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleClearAll = () => {
    onTagsChange([]);
  };

  return (
    <Card className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tag Filter
        </h3>
        {selectedTags.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Selected Tags ({selectedTags.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {selectedTags.map((tag) => (
                <motion.div
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Badge
                    variant="primary"
                    className="flex items-center gap-1 pr-1"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-primary-200 hover:text-white transition-colors"
                      aria-label={`Remove ${tag} tag`}
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Search */}
      <div>
        <Input
          type="text"
          placeholder="Search tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Available Tags */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Available Tags
        </h4>
        
        {isLoading ? (
          <div className="text-center py-4">
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              Loading tags...
            </div>
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="text-center py-4">
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              {searchQuery ? 'No tags found matching your search' : 'No tags available'}
            </div>
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {filteredTags.map((tag, index) => (
                  <motion.div
                    key={tag}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ 
                      duration: 0.2,
                      delay: index * 0.02 
                    }}
                  >
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => handleTagToggle(tag)}
                    >
                      <span>{tag}</span>
                      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};