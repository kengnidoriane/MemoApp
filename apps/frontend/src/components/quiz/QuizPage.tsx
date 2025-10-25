import React from 'react';
import { motion } from 'framer-motion';
import { QuizSession } from './QuizSession';
import { useNavigate } from 'react-router-dom';

export const QuizPage: React.FC = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/dashboard');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
    >
      <QuizSession onClose={handleClose} />
    </motion.div>
  );
};