import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';

import { Spinner } from '../ui/Spinner';
import { useStartQuizSession } from '../../hooks/useQuiz';
import { useCategories } from '../../hooks/useCategories';
import { useMemos } from '../../hooks/useMemos';
import type { QuizOptions } from '@memo-app/shared/types';

interface QuizStartScreenProps {
  onQuizStart: (sessionId: string) => void;
}

export const QuizStartScreen: React.FC<QuizStartScreenProps> = ({ onQuizStart }) => {
  const [options, setOptions] = useState<QuizOptions>({
    maxQuestions: 10,
    questionTypes: ['recall', 'recognition'],
    difficultyRange: { min: 1, max: 5 },
  });

  const { data: categories = [] } = useCategories();
  const { data: memosData } = useMemos();
  const startQuizMutation = useStartQuizSession();

  const handleStartQuiz = async () => {
    try {
      const session = await startQuizMutation.mutateAsync(options);
      onQuizStart(session.id);
    } catch (error) {
      console.error('Failed to start quiz:', error);
    }
  };

  const handleMaxQuestionsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOptions(prev => ({
      ...prev,
      maxQuestions: parseInt(e.target.value) || 10,
    }));
  };

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    setOptions(prev => {
      const includeCategories = prev.includeCategories || [];
      if (checked) {
        return {
          ...prev,
          includeCategories: [...includeCategories, categoryId],
        };
      } else {
        return {
          ...prev,
          includeCategories: includeCategories.filter(id => id !== categoryId),
        };
      }
    });
  };

  const handleQuestionTypeToggle = (type: 'recall' | 'recognition', checked: boolean) => {
    setOptions(prev => {
      const questionTypes = prev.questionTypes || [];
      if (checked) {
        return {
          ...prev,
          questionTypes: [...questionTypes, type],
        };
      } else {
        return {
          ...prev,
          questionTypes: questionTypes.filter(t => t !== type),
        };
      }
    });
  };

  // Handle memo data - could be array or paginated response
  const memos = Array.isArray(memosData) ? memosData : memosData?.items || [];
  const availableMemoCount = memos.length;
  const maxPossibleQuestions = Math.min(options.maxQuestions || 10, availableMemoCount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto p-6"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Start Quiz Session
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test your knowledge and improve retention with spaced repetition
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {/* Quiz Options */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quiz Options
          </h3>
          
          <div className="space-y-4">
            {/* Number of Questions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Questions
              </label>
              <Select
                value={options.maxQuestions?.toString() || '10'}
                onChange={handleMaxQuestionsChange}
                options={[
                  { value: '5', label: '5 questions' },
                  { value: '10', label: '10 questions' },
                  { value: '15', label: '15 questions' },
                  { value: '20', label: '20 questions' },
                  { value: '25', label: '25 questions' },
                ]}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Maximum {maxPossibleQuestions} questions available from your memos
              </p>
            </div>

            {/* Question Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Question Types
              </label>
              <div className="space-y-2">
                <Checkbox
                  id="recall"
                  checked={options.questionTypes?.includes('recall') || false}
                  onChange={(e) => handleQuestionTypeToggle('recall', e.target.checked)}
                  label="Recall (Show title, remember content)"
                />
                <Checkbox
                  id="recognition"
                  checked={options.questionTypes?.includes('recognition') || false}
                  onChange={(e) => handleQuestionTypeToggle('recognition', e.target.checked)}
                  label="Recognition (Multiple choice questions)"
                />
              </div>
            </div>

            {/* Categories Filter */}
            {categories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Include Categories (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Checkbox
                      key={category.id}
                      id={`category-${category.id}`}
                      checked={options.includeCategories?.includes(category.id) || false}
                      onChange={(e) => handleCategoryToggle(category.id, e.target.checked)}
                      label={category.name}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Leave unchecked to include all categories
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quiz Stats Preview */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Quiz Preview
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Available memos:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {availableMemoCount}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Quiz length:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {maxPossibleQuestions} questions
              </span>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleStartQuiz}
            disabled={startQuizMutation.isPending || availableMemoCount === 0 || (options.questionTypes?.length || 0) === 0}
            size="lg"
            className="min-w-[200px]"
          >
            {startQuizMutation.isPending ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Starting Quiz...
              </>
            ) : (
              'Start Quiz'
            )}
          </Button>
        </div>

        {availableMemoCount === 0 && (
          <p className="text-center text-sm text-amber-600 dark:text-amber-400">
            You need at least one memo to start a quiz. Create some memos first!
          </p>
        )}

        {(options.questionTypes?.length || 0) === 0 && availableMemoCount > 0 && (
          <p className="text-center text-sm text-amber-600 dark:text-amber-400">
            Please select at least one question type to continue.
          </p>
        )}
      </Card>
    </motion.div>
  );
};