import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Trophy, Target, Clock, TrendingUp, RotateCcw, Home } from 'lucide-react';
import type { QuizResults as QuizResultsType } from '@memo-app/shared/types';

interface QuizResultsProps {
  results: QuizResultsType;
  onStartNewQuiz: () => void;
  onGoHome: () => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({
  results,
  onStartNewQuiz,
  onGoHome,
}) => {
  const getScoreColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-600 dark:text-green-400';
    if (accuracy >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreMessage = (accuracy: number) => {
    if (accuracy >= 90) return 'Excellent! Outstanding performance!';
    if (accuracy >= 80) return 'Great job! You\'re doing well!';
    if (accuracy >= 70) return 'Good work! Keep it up!';
    if (accuracy >= 60) return 'Not bad! Room for improvement.';
    return 'Keep practicing! You\'ll get better!';
  };

  const formatTime = (ms: number) => {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4"
        >
          <Trophy className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Quiz Complete!
        </h1>
        <p className={`text-xl font-semibold ${getScoreColor(results.accuracy)}`}>
          {getScoreMessage(results.accuracy)}
        </p>
      </div>

      {/* Main Results Card */}
      <Card className="p-8 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-2">
              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Accuracy
              </span>
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(results.accuracy)}`}>
              {Math.round(results.accuracy)}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {results.correctAnswers} of {results.totalQuestions} correct
            </div>
          </motion.div>

          {/* Questions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Questions
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {results.totalQuestions}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total answered
            </div>
          </motion.div>

          {/* Average Time */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg. Time
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatTime(results.averageResponseTime)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Per question
            </div>
          </motion.div>

          {/* Improvement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                To Review
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {results.memosToReview.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Memos need review
            </div>
          </motion.div>
        </div>

        {/* Performance by Difficulty */}
        {Object.keys(results.performanceByDifficulty).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="border-t border-gray-200 dark:border-gray-700 pt-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Performance by Difficulty
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(results.performanceByDifficulty).map(([difficulty, stats]) => (
                <div
                  key={difficulty}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center"
                >
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Level {difficulty}
                  </div>
                  <div className={`text-xl font-bold ${getScoreColor(stats.accuracy)}`}>
                    {Math.round(stats.accuracy)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {stats.correct}/{stats.total}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </Card>

      {/* Insights Card */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Learning Insights
        </h3>
        <div className="space-y-3">
          {results.memosToReview.length > 0 && (
            <div className="flex items-start">
              <Badge variant="secondary" className="mr-3 mt-0.5">
                Review
              </Badge>
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {results.memosToReview.length} memo{results.memosToReview.length !== 1 ? 's' : ''} 
                  {results.memosToReview.length === 1 ? ' needs' : ' need'} additional review. 
                  These will appear more frequently in future quizzes and reminders.
                </p>
              </div>
            </div>
          )}
          
          {results.accuracy >= 80 && (
            <div className="flex items-start">
              <Badge variant="secondary" className="mr-3 mt-0.5 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                Strong
              </Badge>
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Great retention! Your spaced repetition intervals will be increased for well-remembered memos.
                </p>
              </div>
            </div>
          )}

          {results.averageResponseTime < 5000 && (
            <div className="flex items-start">
              <Badge variant="secondary" className="mr-3 mt-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                Quick
              </Badge>
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Fast response times indicate strong recall confidence. Keep up the good work!
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <Button
          onClick={onStartNewQuiz}
          size="lg"
          className="min-w-[160px]"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Start New Quiz
        </Button>
        <Button
          onClick={onGoHome}
          variant="outline"
          size="lg"
          className="min-w-[160px]"
        >
          <Home className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </motion.div>
    </motion.div>
  );
};