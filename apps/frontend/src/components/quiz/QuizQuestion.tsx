import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import type { QuizQuestion as QuizQuestionType, QuizAnswer } from '@memo-app/shared/types';

interface QuizQuestionProps {
  question: QuizQuestionType;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: QuizAnswer) => void;
  isSubmitting: boolean;
}

export const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  isSubmitting,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [confidence, setConfidence] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [startTime] = useState(Date.now());

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer('');
    setShowAnswer(false);
    setConfidence(3);
  }, [question.id]);

  const handleRevealAnswer = () => {
    setShowAnswer(true);
  };

  const handleSubmitAnswer = (remembered: boolean) => {
    const responseTime = Date.now() - startTime;
    
    const answer: QuizAnswer = {
      questionId: question.id,
      answer: question.type === 'recognition' ? selectedAnswer : remembered ? 'correct' : 'incorrect',
      responseTimeMs: responseTime,
      confidence,
    };

    onAnswer(answer);
  };

  const handleRecognitionAnswer = (option: string) => {
    setSelectedAnswer(option);
    const responseTime = Date.now() - startTime;
    
    const answer: QuizAnswer = {
      questionId: question.id,
      answer: option,
      responseTimeMs: responseTime,
      confidence,
    };

    onAnswer(answer);
  };

  const confidenceLabels = {
    1: 'Very Unsure',
    2: 'Unsure',
    3: 'Neutral',
    4: 'Confident',
    5: 'Very Confident',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-4xl mx-auto p-6"
    >
      {/* Progress Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary">
            Question {questionNumber} of {totalQuestions}
          </Badge>
          <Badge variant="outline">
            {question.type === 'recall' ? 'Recall' : 'Recognition'}
          </Badge>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            className="bg-blue-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <Card className="p-8">
        {/* Question Content */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {question.question}
          </h2>
          
          {question.type === 'recall' && !showAnswer && (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Try to recall the content of this memo, then reveal the answer to check yourself.
              </p>
              <Button onClick={handleRevealAnswer} variant="outline">
                Reveal Answer
              </Button>
            </div>
          )}

          {question.type === 'recall' && showAnswer && question.correctAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Correct Answer:
              </h3>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {question.correctAnswer}
                </p>
              </div>
            </motion.div>
          )}

          {question.type === 'recognition' && question.options && (
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRecognitionAnswer(option)}
                  disabled={isSubmitting}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                    selectedAnswer === option
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      selectedAnswer === option
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {selectedAnswer === option && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                      )}
                    </div>
                    <span className="text-gray-900 dark:text-white">{option}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Confidence Selector */}
        {(question.type === 'recall' && showAnswer) && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              How confident are you in your answer?
            </label>
            <div className="flex space-x-2">
              {([1, 2, 3, 4, 5] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setConfidence(level)}
                  className={`flex-1 p-3 text-sm rounded-lg border-2 transition-colors ${
                    confidence === level
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="font-medium">{level}</div>
                  <div className="text-xs">{confidenceLabels[level]}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Answer Buttons for Recall Questions */}
        {question.type === 'recall' && showAnswer && (
          <div className="flex space-x-4 justify-center">
            <Button
              onClick={() => handleSubmitAnswer(false)}
              disabled={isSubmitting}
              variant="outline"
              size="lg"
              className="min-w-[120px] border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              {isSubmitting ? <Spinner size="sm" className="mr-2" /> : null}
              I Forgot
            </Button>
            <Button
              onClick={() => handleSubmitAnswer(true)}
              disabled={isSubmitting}
              size="lg"
              className="min-w-[120px] bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? <Spinner size="sm" className="mr-2" /> : null}
              I Remembered
            </Button>
          </div>
        )}

        {/* Loading State for Recognition Questions */}
        {question.type === 'recognition' && isSubmitting && (
          <div className="flex justify-center">
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <Spinner size="sm" className="mr-2" />
              Submitting answer...
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};