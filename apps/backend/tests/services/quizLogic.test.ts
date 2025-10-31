import { describe, it, expect, beforeEach } from '@jest/globals';

// Quiz logic functions to test
export class QuizLogic {
  static generateRecallQuestion(memo: any): any {
    return {
      id: memo.id,
      memoId: memo.id,
      type: 'recall',
      question: `What do you remember about: "${memo.title}"?`,
      correctAnswer: memo.content,
      options: undefined,
    };
  }

  static generateRecognitionQuestion(memo: any, distractors: any[]): any {
    const options = [memo.content, ...distractors.slice(0, 3)];
    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    return {
      id: memo.id,
      memoId: memo.id,
      type: 'recognition',
      question: `Which of the following best describes "${memo.title}"?`,
      correctAnswer: undefined,
      options,
    };
  }

  static evaluateRecallAnswer(answer: string, correctAnswer: string, confidence: number): boolean {
    // Simple similarity check - in real implementation, this would be more sophisticated
    const normalizedAnswer = answer.toLowerCase().trim();
    const normalizedCorrect = correctAnswer.toLowerCase().trim();
    
    // If confidence is high and answer contains key words, consider it correct
    if (confidence >= 4) {
      const keyWords = normalizedCorrect.split(' ').filter(word => word.length > 3);
      const matchedWords = keyWords.filter(word => normalizedAnswer.includes(word));
      return matchedWords.length >= Math.ceil(keyWords.length * 0.5);
    }
    
    // For lower confidence, require more exact match
    return normalizedAnswer.includes(normalizedCorrect) || 
           normalizedCorrect.includes(normalizedAnswer);
  }

  static evaluateRecognitionAnswer(selectedOption: string, correctAnswer: string): boolean {
    return selectedOption === correctAnswer;
  }

  static calculateQuizScore(answers: any[]): {
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number;
    averageResponseTime: number;
  } {
    const totalQuestions = answers.length;
    const correctAnswers = answers.filter(a => a.remembered).length;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const accuracy = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;
    
    const totalResponseTime = answers.reduce((sum, a) => sum + (a.responseTimeMs || 0), 0);
    const averageResponseTime = totalQuestions > 0 ? totalResponseTime / totalQuestions : 0;

    return {
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      accuracy,
      averageResponseTime,
    };
  }

  static analyzePerformanceByDifficulty(answers: any[], memos: any[]): Record<number, {
    total: number;
    correct: number;
    accuracy: number;
  }> {
    const performance: Record<number, { total: number; correct: number; accuracy: number }> = {};

    answers.forEach(answer => {
      const memo = memos.find(m => m.id === answer.memoId);
      if (!memo) return;

      const difficulty = memo.difficultyLevel;
      if (!performance[difficulty]) {
        performance[difficulty] = { total: 0, correct: 0, accuracy: 0 };
      }

      performance[difficulty].total++;
      if (answer.remembered) {
        performance[difficulty].correct++;
      }
    });

    // Calculate accuracy for each difficulty level
    Object.keys(performance).forEach(difficulty => {
      const level = parseInt(difficulty);
      const stats = performance[level];
      stats.accuracy = stats.total > 0 ? stats.correct / stats.total : 0;
    });

    return performance;
  }

  static identifyMemosForReview(answers: any[]): string[] {
    return answers
      .filter(answer => !answer.remembered)
      .map(answer => answer.memoId);
  }

  static selectMemosForQuiz(
    memos: any[],
    options: {
      maxQuestions?: number;
      includeCategories?: string[];
      excludeCategories?: string[];
      difficultyRange?: { min: number; max: number };
      prioritizeDue?: boolean;
    } = {}
  ): any[] {
    let filteredMemos = [...memos];

    // Filter by categories
    if (options.includeCategories?.length) {
      filteredMemos = filteredMemos.filter(memo => 
        options.includeCategories!.includes(memo.categoryId)
      );
    }

    if (options.excludeCategories?.length) {
      filteredMemos = filteredMemos.filter(memo => 
        !options.excludeCategories!.includes(memo.categoryId)
      );
    }

    // Filter by difficulty range
    if (options.difficultyRange) {
      filteredMemos = filteredMemos.filter(memo => 
        memo.difficultyLevel >= options.difficultyRange!.min &&
        memo.difficultyLevel <= options.difficultyRange!.max
      );
    }

    // Prioritize memos due for review
    if (options.prioritizeDue) {
      const now = new Date();
      filteredMemos.sort((a, b) => {
        const aDue = a.nextReviewAt ? new Date(a.nextReviewAt) <= now : true;
        const bDue = b.nextReviewAt ? new Date(b.nextReviewAt) <= now : true;
        
        if (aDue && !bDue) return -1;
        if (!aDue && bDue) return 1;
        
        // If both due or both not due, sort by last reviewed (oldest first)
        const aLastReview = a.lastReviewedAt ? new Date(a.lastReviewedAt).getTime() : 0;
        const bLastReview = b.lastReviewedAt ? new Date(b.lastReviewedAt).getTime() : 0;
        return aLastReview - bLastReview;
      });
    }

    // Limit number of questions
    const maxQuestions = options.maxQuestions || 10;
    return filteredMemos.slice(0, maxQuestions);
  }

  static generateQuizQuestions(
    memos: any[],
    questionTypes: ('recall' | 'recognition')[] = ['recall', 'recognition']
  ): any[] {
    const questions: any[] = [];

    memos.forEach(memo => {
      // Randomly select question type
      const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];

      if (questionType === 'recall') {
        questions.push(this.generateRecallQuestion(memo));
      } else {
        // For recognition questions, we need distractors
        const otherMemos = memos.filter(m => m.id !== memo.id);
        const distractors = otherMemos.map(m => m.content).slice(0, 3);
        questions.push(this.generateRecognitionQuestion(memo, distractors));
      }
    });

    return questions;
  }
}

describe('QuizLogic', () => {
  const mockMemos = [
    {
      id: 'memo-1',
      title: 'JavaScript Closures',
      content: 'A closure is a function that has access to variables in its outer scope',
      categoryId: 'cat-1',
      difficultyLevel: 3,
      lastReviewedAt: new Date('2023-01-01'),
      nextReviewAt: new Date('2023-01-10'),
    },
    {
      id: 'memo-2',
      title: 'React Hooks',
      content: 'Hooks are functions that let you use state and lifecycle features',
      categoryId: 'cat-1',
      difficultyLevel: 2,
      lastReviewedAt: new Date('2023-01-05'),
      nextReviewAt: new Date('2023-01-15'),
    },
    {
      id: 'memo-3',
      title: 'CSS Flexbox',
      content: 'Flexbox is a layout method for arranging items in rows or columns',
      categoryId: 'cat-2',
      difficultyLevel: 4,
      lastReviewedAt: null,
      nextReviewAt: null,
    },
  ];

  describe('generateRecallQuestion', () => {
    it('should generate a recall question with correct format', () => {
      const question = QuizLogic.generateRecallQuestion(mockMemos[0]);

      expect(question).toMatchObject({
        id: 'memo-1',
        memoId: 'memo-1',
        type: 'recall',
        question: 'What do you remember about: "JavaScript Closures"?',
        correctAnswer: 'A closure is a function that has access to variables in its outer scope',
        options: undefined,
      });
    });
  });

  describe('generateRecognitionQuestion', () => {
    it('should generate a recognition question with options', () => {
      const distractors = ['Wrong answer 1', 'Wrong answer 2', 'Wrong answer 3'];
      const question = QuizLogic.generateRecognitionQuestion(mockMemos[0], distractors);

      expect(question).toMatchObject({
        id: 'memo-1',
        memoId: 'memo-1',
        type: 'recognition',
        question: 'Which of the following best describes "JavaScript Closures"?',
        correctAnswer: undefined,
      });

      expect(question.options).toHaveLength(4);
      expect(question.options).toContain(mockMemos[0].content);
      expect(question.options).toContain('Wrong answer 1');
    });
  });

  describe('evaluateRecallAnswer', () => {
    const correctAnswer = 'A closure is a function that has access to variables in its outer scope';

    it('should accept correct answers with high confidence', () => {
      const answers = [
        'A closure is a function that has access to variables in its outer scope',
        'closure function access variables outer scope',
        'functions that access outer scope variables',
      ];

      answers.forEach(answer => {
        expect(QuizLogic.evaluateRecallAnswer(answer, correctAnswer, 5)).toBe(true);
      });
    });

    it('should reject incorrect answers', () => {
      const answers = [
        'completely wrong answer',
        'something about arrays',
        'CSS styling',
      ];

      answers.forEach(answer => {
        expect(QuizLogic.evaluateRecallAnswer(answer, correctAnswer, 3)).toBe(false);
      });
    });

    it('should be more lenient with high confidence', () => {
      const partialAnswer = 'closure function outer scope';
      
      expect(QuizLogic.evaluateRecallAnswer(partialAnswer, correctAnswer, 5)).toBe(true);
      expect(QuizLogic.evaluateRecallAnswer(partialAnswer, correctAnswer, 2)).toBe(false);
    });
  });

  describe('evaluateRecognitionAnswer', () => {
    it('should correctly evaluate recognition answers', () => {
      const correctAnswer = 'A closure is a function that has access to variables in its outer scope';
      
      expect(QuizLogic.evaluateRecognitionAnswer(correctAnswer, correctAnswer)).toBe(true);
      expect(QuizLogic.evaluateRecognitionAnswer('Wrong answer', correctAnswer)).toBe(false);
    });
  });

  describe('calculateQuizScore', () => {
    it('should calculate quiz score correctly', () => {
      const answers = [
        { memoId: 'memo-1', remembered: true, responseTimeMs: 5000 },
        { memoId: 'memo-2', remembered: false, responseTimeMs: 8000 },
        { memoId: 'memo-3', remembered: true, responseTimeMs: 3000 },
      ];

      const score = QuizLogic.calculateQuizScore(answers);

      expect(score).toEqual({
        totalQuestions: 3,
        correctAnswers: 2,
        incorrectAnswers: 1,
        accuracy: 2/3,
        averageResponseTime: (5000 + 8000 + 3000) / 3,
      });
    });

    it('should handle empty answers array', () => {
      const score = QuizLogic.calculateQuizScore([]);

      expect(score).toEqual({
        totalQuestions: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        accuracy: 0,
        averageResponseTime: 0,
      });
    });
  });

  describe('analyzePerformanceByDifficulty', () => {
    it('should analyze performance by difficulty level', () => {
      const answers = [
        { memoId: 'memo-1', remembered: true },  // difficulty 3
        { memoId: 'memo-2', remembered: true },  // difficulty 2
        { memoId: 'memo-3', remembered: false }, // difficulty 4
      ];

      const performance = QuizLogic.analyzePerformanceByDifficulty(answers, mockMemos);

      expect(performance).toEqual({
        2: { total: 1, correct: 1, accuracy: 1 },
        3: { total: 1, correct: 1, accuracy: 1 },
        4: { total: 1, correct: 0, accuracy: 0 },
      });
    });
  });

  describe('identifyMemosForReview', () => {
    it('should identify memos that need review', () => {
      const answers = [
        { memoId: 'memo-1', remembered: true },
        { memoId: 'memo-2', remembered: false },
        { memoId: 'memo-3', remembered: false },
      ];

      const memosForReview = QuizLogic.identifyMemosForReview(answers);

      expect(memosForReview).toEqual(['memo-2', 'memo-3']);
    });
  });

  describe('selectMemosForQuiz', () => {
    it('should select memos without filters', () => {
      const selected = QuizLogic.selectMemosForQuiz(mockMemos);
      expect(selected).toHaveLength(3);
    });

    it('should limit number of questions', () => {
      const selected = QuizLogic.selectMemosForQuiz(mockMemos, { maxQuestions: 2 });
      expect(selected).toHaveLength(2);
    });

    it('should filter by included categories', () => {
      const selected = QuizLogic.selectMemosForQuiz(mockMemos, {
        includeCategories: ['cat-1'],
      });
      
      expect(selected).toHaveLength(2);
      expect(selected.every(memo => memo.categoryId === 'cat-1')).toBe(true);
    });

    it('should filter by excluded categories', () => {
      const selected = QuizLogic.selectMemosForQuiz(mockMemos, {
        excludeCategories: ['cat-2'],
      });
      
      expect(selected).toHaveLength(2);
      expect(selected.every(memo => memo.categoryId !== 'cat-2')).toBe(true);
    });

    it('should filter by difficulty range', () => {
      const selected = QuizLogic.selectMemosForQuiz(mockMemos, {
        difficultyRange: { min: 2, max: 3 },
      });
      
      expect(selected).toHaveLength(2);
      expect(selected.every(memo => memo.difficultyLevel >= 2 && memo.difficultyLevel <= 3)).toBe(true);
    });

    it('should prioritize memos due for review', () => {
      // Mock current date to be after some review dates
      const mockDate = new Date('2023-01-12');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const selected = QuizLogic.selectMemosForQuiz(mockMemos, {
        prioritizeDue: true,
      });

      // memo-1 should come first (due on 2023-01-10, before current date)
      expect(selected[0].id).toBe('memo-1');

      jest.restoreAllMocks();
    });
  });

  describe('generateQuizQuestions', () => {
    it('should generate questions for all memos', () => {
      const questions = QuizLogic.generateQuizQuestions(mockMemos);
      
      expect(questions).toHaveLength(3);
      expect(questions.every(q => ['recall', 'recognition'].includes(q.type))).toBe(true);
    });

    it('should generate only recall questions when specified', () => {
      const questions = QuizLogic.generateQuizQuestions(mockMemos, ['recall']);
      
      expect(questions).toHaveLength(3);
      expect(questions.every(q => q.type === 'recall')).toBe(true);
    });

    it('should generate only recognition questions when specified', () => {
      const questions = QuizLogic.generateQuizQuestions(mockMemos, ['recognition']);
      
      expect(questions).toHaveLength(3);
      expect(questions.every(q => q.type === 'recognition')).toBe(true);
      expect(questions.every(q => q.options && q.options.length === 4)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty memo list', () => {
      const selected = QuizLogic.selectMemosForQuiz([]);
      expect(selected).toHaveLength(0);

      const questions = QuizLogic.generateQuizQuestions([]);
      expect(questions).toHaveLength(0);
    });

    it('should handle single memo', () => {
      const singleMemo = [mockMemos[0]];
      const questions = QuizLogic.generateQuizQuestions(singleMemo, ['recognition']);
      
      expect(questions).toHaveLength(1);
      // Recognition question should still work with fewer distractors
      expect(questions[0].options.length).toBeLessThanOrEqual(4);
    });

    it('should handle memos without review dates', () => {
      const memosWithoutDates = mockMemos.map(memo => ({
        ...memo,
        lastReviewedAt: null,
        nextReviewAt: null,
      }));

      const selected = QuizLogic.selectMemosForQuiz(memosWithoutDates, {
        prioritizeDue: true,
      });

      expect(selected).toHaveLength(3);
    });
  });
});