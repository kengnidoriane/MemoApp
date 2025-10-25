import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuizStartScreen } from './QuizStartScreen';
import { QuizQuestion } from './QuizQuestion';
import { QuizResults } from './QuizResults';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { AlertTriangle, X } from 'lucide-react';
import { useQuizSession, useNextQuestion, useSubmitAnswer, useEndQuizSession } from '../../hooks/useQuiz';
import { useQuizStore } from '../../stores/quizStore';
import type { QuizAnswer } from '@memo-app/shared/types';

type QuizState = 'start' | 'question' | 'results' | 'loading' | 'error';

interface QuizSessionProps {
  onClose?: () => void;
}

export const QuizSession: React.FC<QuizSessionProps> = ({ onClose }) => {
  const [state, setState] = useState<QuizState>('start');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: session, isLoading: sessionLoading } = useQuizSession(sessionId || '');
  const { data: currentQuestion, isLoading: questionLoading } = useNextQuestion(sessionId || '');
  const submitAnswerMutation = useSubmitAnswer();
  const endQuizMutation = useEndQuizSession();
  
  const { 
    setCurrentSession, 
    setCurrentQuestion, 
    setResults, 
    clearSession,
    results 
  } = useQuizStore();

  // Handle quiz start
  const handleQuizStart = (newSessionId: string) => {
    setSessionId(newSessionId);
    setState('loading');
    setError(null);
  };

  // Handle session loading
  useEffect(() => {
    if (sessionId && session && !sessionLoading) {
      setCurrentSession(session);
      if (session.status === 'completed') {
        setState('results');
      } else {
        setState('question');
      }
    }
  }, [session, sessionId, sessionLoading, setCurrentSession]);

  // Handle question loading
  useEffect(() => {
    if (currentQuestion !== undefined && !questionLoading) {
      setCurrentQuestion(currentQuestion);
      if (currentQuestion === null && session?.status === 'active') {
        // No more questions, end the quiz
        handleEndQuiz();
      }
    }
  }, [currentQuestion, questionLoading, setCurrentQuestion, session]);

  // Handle answer submission
  const handleAnswerSubmit = async (answer: QuizAnswer) => {
    if (!sessionId) return;

    try {
      await submitAnswerMutation.mutateAsync({
        sessionId,
        questionId: answer.questionId,
        answer,
      });
    } catch (error) {
      console.error('Failed to submit answer:', error);
      setError('Failed to submit answer. Please try again.');
    }
  };

  // Handle quiz end
  const handleEndQuiz = async () => {
    if (!sessionId) return;

    try {
      setState('loading');
      const quizResults = await endQuizMutation.mutateAsync(sessionId);
      setResults(quizResults);
      setState('results');
    } catch (error) {
      console.error('Failed to end quiz:', error);
      setError('Failed to complete quiz. Please try again.');
      setState('error');
    }
  };

  // Handle starting new quiz
  const handleStartNewQuiz = () => {
    clearSession();
    setSessionId(null);
    setState('start');
    setError(null);
  };

  // Handle going home
  const handleGoHome = () => {
    clearSession();
    onClose?.();
  };

  // Handle manual quiz end
  const handleManualEndQuiz = () => {
    if (window.confirm('Are you sure you want to end this quiz? Your progress will be saved.')) {
      handleEndQuiz();
    }
  };

  // Error state
  if (state === 'error') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'An unexpected error occurred during the quiz.'}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={handleStartNewQuiz} variant="outline">
              Start New Quiz
            </Button>
            <Button onClick={handleGoHome}>
              Go Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Loading state
  if (state === 'loading' || sessionLoading || questionLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-8 text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {state === 'loading' ? 'Loading quiz...' : 'Preparing next question...'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we set up your quiz session.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with close button for active quiz */}
      {(state === 'question' || state === 'results') && onClose && (
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Quiz Session
              </h1>
              {session && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {session.status === 'active' ? 'In Progress' : 'Completed'}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {state === 'question' && (
                <Button
                  onClick={handleManualEndQuiz}
                  variant="outline"
                  size="sm"
                >
                  End Quiz
                </Button>
              )}
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {state === 'start' && (
          <motion.div
            key="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <QuizStartScreen onQuizStart={handleQuizStart} />
          </motion.div>
        )}

        {state === 'question' && currentQuestion && session && (
          <motion.div
            key={`question-${currentQuestion.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <QuizQuestion
              question={currentQuestion}
              questionNumber={session.currentQuestionIndex + 1}
              totalQuestions={session.totalQuestions}
              onAnswer={handleAnswerSubmit}
              isSubmitting={submitAnswerMutation.isPending}
            />
          </motion.div>
        )}

        {state === 'results' && results && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <QuizResults
              results={results}
              onStartNewQuiz={handleStartNewQuiz}
              onGoHome={handleGoHome}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      {error && (state === 'start' || state === 'question' || state === 'results' || state === 'loading') && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
              <Button
                onClick={() => setError(null)}
                variant="ghost"
                size="sm"
                className="ml-2 p-1 h-auto"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};