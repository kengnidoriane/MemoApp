import { test, expect } from '@playwright/test';

test.describe('Quiz Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test User',
          },
        }),
      });
    });

    // Mock memos for quiz
    await page.route('**/api/memos*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          memos: [
            {
              id: 'memo-1',
              title: 'JavaScript Closures',
              content: 'A closure is a function that has access to variables in its outer scope',
              tags: ['javascript', 'programming'],
              difficultyLevel: 3,
            },
            {
              id: 'memo-2',
              title: 'React Hooks',
              content: 'Hooks are functions that let you use state and lifecycle features',
              tags: ['react', 'programming'],
              difficultyLevel: 2,
            },
          ],
          pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
        }),
      });
    });

    await page.goto('/quiz');
  });

  test('should display quiz start screen', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /start quiz/i })).toBeVisible();
    await expect(page.getByText(/test your knowledge/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /start quiz/i })).toBeVisible();
  });

  test('should configure quiz options', async ({ page }) => {
    // Configure quiz options
    await page.getByLabel(/number of questions/i).fill('5');
    await page.getByLabel(/include categories/i).selectOption(['cat-1']);
    await page.getByLabel(/difficulty range/i).selectOption('2-4');
    await page.getByLabel(/question types/i).check();

    // Start quiz
    await page.getByRole('button', { name: /start quiz/i }).click();

    // Should start quiz with configured options
    await expect(page.getByText(/question 1 of 5/i)).toBeVisible();
  });

  test('should start quiz session', async ({ page }) => {
    // Mock quiz session creation
    await page.route('**/api/quiz/start', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'session-1',
          userId: 'user-1',
          totalQuestions: 3,
          correctAnswers: 0,
          status: 'active',
          currentQuestionIndex: 0,
          questions: [
            {
              id: 'memo-1',
              memoId: 'memo-1',
              type: 'recall',
              question: 'What do you remember about: "JavaScript Closures"?',
              correctAnswer: 'A closure is a function that has access to variables in its outer scope',
            },
            {
              id: 'memo-2',
              memoId: 'memo-2',
              type: 'recognition',
              question: 'Which of the following best describes React Hooks?',
              options: [
                'Functions that let you use state and lifecycle features',
                'Class components with state',
                'CSS styling functions',
                'Database query functions',
              ],
            },
          ],
        }),
      });
    });

    await page.getByRole('button', { name: /start quiz/i }).click();

    // Should display first question
    await expect(page.getByText(/question 1 of 3/i)).toBeVisible();
    await expect(page.getByText(/what do you remember about/i)).toBeVisible();
    await expect(page.getByText(/javascript closures/i)).toBeVisible();
  });

  test('should handle recall question', async ({ page }) => {
    // Mock quiz session
    await page.route('**/api/quiz/start', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'session-1',
          totalQuestions: 1,
          currentQuestionIndex: 0,
          questions: [
            {
              id: 'memo-1',
              type: 'recall',
              question: 'What do you remember about: "JavaScript Closures"?',
              correctAnswer: 'A closure is a function that has access to variables in its outer scope',
            },
          ],
        }),
      });
    });

    // Mock answer submission
    await page.route('**/api/quiz/session-1/answer', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.getByRole('button', { name: /start quiz/i }).click();

    // Answer recall question
    await page.getByPlaceholder(/type what you remember/i).fill('Closures have access to outer scope variables');
    await page.getByRole('slider', { name: /confidence/i }).fill('4');
    await page.getByRole('button', { name: /submit answer/i }).click();

    // Should show feedback
    await expect(page.getByText(/answer submitted/i)).toBeVisible();
  });

  test('should handle recognition question', async ({ page }) => {
    // Mock quiz session with recognition question
    await page.route('**/api/quiz/start', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'session-1',
          totalQuestions: 1,
          currentQuestionIndex: 0,
          questions: [
            {
              id: 'memo-2',
              type: 'recognition',
              question: 'Which of the following best describes React Hooks?',
              options: [
                'Functions that let you use state and lifecycle features',
                'Class components with state',
                'CSS styling functions',
                'Database query functions',
              ],
            },
          ],
        }),
      });
    });

    await page.getByRole('button', { name: /start quiz/i }).click();

    // Select answer
    await page.getByRole('radio', { name: /functions that let you use state/i }).check();
    await page.getByRole('button', { name: /submit answer/i }).click();

    // Should show feedback
    await expect(page.getByText(/correct/i)).toBeVisible();
  });

  test('should navigate between questions', async ({ page }) => {
    // Mock multi-question quiz
    await page.route('**/api/quiz/start', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'session-1',
          totalQuestions: 3,
          currentQuestionIndex: 0,
          questions: [
            {
              id: 'memo-1',
              type: 'recall',
              question: 'Question 1',
              correctAnswer: 'Answer 1',
            },
            {
              id: 'memo-2',
              type: 'recall',
              question: 'Question 2',
              correctAnswer: 'Answer 2',
            },
            {
              id: 'memo-3',
              type: 'recall',
              question: 'Question 3',
              correctAnswer: 'Answer 3',
            },
          ],
        }),
      });
    });

    await page.getByRole('button', { name: /start quiz/i }).click();

    // Should show first question
    await expect(page.getByText(/question 1 of 3/i)).toBeVisible();
    await expect(page.getByText('Question 1')).toBeVisible();

    // Answer and go to next question
    await page.getByPlaceholder(/type what you remember/i).fill('My answer');
    await page.getByRole('button', { name: /next question/i }).click();

    // Should show second question
    await expect(page.getByText(/question 2 of 3/i)).toBeVisible();
    await expect(page.getByText('Question 2')).toBeVisible();

    // Go back to previous question
    await page.getByRole('button', { name: /previous question/i }).click();

    // Should show first question again
    await expect(page.getByText(/question 1 of 3/i)).toBeVisible();
    await expect(page.getByText('Question 1')).toBeVisible();
  });

  test('should complete quiz and show results', async ({ page }) => {
    // Mock quiz session
    await page.route('**/api/quiz/start', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'session-1',
          totalQuestions: 2,
          currentQuestionIndex: 0,
          questions: [
            {
              id: 'memo-1',
              type: 'recall',
              question: 'Question 1',
              correctAnswer: 'Answer 1',
            },
            {
              id: 'memo-2',
              type: 'recall',
              question: 'Question 2',
              correctAnswer: 'Answer 2',
            },
          ],
        }),
      });
    });

    // Mock quiz completion
    await page.route('**/api/quiz/session-1/complete', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionId: 'session-1',
          totalQuestions: 2,
          correctAnswers: 1,
          incorrectAnswers: 1,
          accuracy: 0.5,
          averageResponseTime: 15000,
          memosToReview: ['memo-2'],
          performanceByDifficulty: {
            2: { total: 1, correct: 1, accuracy: 1 },
            3: { total: 1, correct: 0, accuracy: 0 },
          },
        }),
      });
    });

    await page.getByRole('button', { name: /start quiz/i }).click();

    // Answer first question
    await page.getByPlaceholder(/type what you remember/i).fill('My answer 1');
    await page.getByRole('button', { name: /next question/i }).click();

    // Answer second question
    await page.getByPlaceholder(/type what you remember/i).fill('My answer 2');
    await page.getByRole('button', { name: /finish quiz/i }).click();

    // Should show results
    await expect(page.getByRole('heading', { name: /quiz results/i })).toBeVisible();
    await expect(page.getByText(/50% accuracy/i)).toBeVisible();
    await expect(page.getByText(/1 out of 2 correct/i)).toBeVisible();
    await expect(page.getByText(/average response time: 15s/i)).toBeVisible();
  });

  test('should show performance breakdown', async ({ page }) => {
    // Mock quiz completion with detailed results
    await page.route('**/api/quiz/session-1/complete', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionId: 'session-1',
          totalQuestions: 4,
          correctAnswers: 3,
          incorrectAnswers: 1,
          accuracy: 0.75,
          performanceByDifficulty: {
            1: { total: 1, correct: 1, accuracy: 1 },
            2: { total: 1, correct: 1, accuracy: 1 },
            3: { total: 1, correct: 1, accuracy: 1 },
            4: { total: 1, correct: 0, accuracy: 0 },
          },
          memosToReview: ['memo-4'],
        }),
      });
    });

    // Start and complete quiz (simplified)
    await page.route('**/api/quiz/start', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'session-1',
          totalQuestions: 1,
          currentQuestionIndex: 0,
          questions: [{ id: 'memo-1', type: 'recall', question: 'Test' }],
        }),
      });
    });

    await page.getByRole('button', { name: /start quiz/i }).click();
    await page.getByPlaceholder(/type what you remember/i).fill('Answer');
    await page.getByRole('button', { name: /finish quiz/i }).click();

    // Should show performance breakdown
    await expect(page.getByText(/performance by difficulty/i)).toBeVisible();
    await expect(page.getByText(/easy: 100%/i)).toBeVisible();
    await expect(page.getByText(/medium: 100%/i)).toBeVisible();
    await expect(page.getByText(/hard: 100%/i)).toBeVisible();
    await expect(page.getByText(/very hard: 0%/i)).toBeVisible();
  });

  test('should suggest memos for review', async ({ page }) => {
    // Mock quiz completion with review suggestions
    await page.route('**/api/quiz/session-1/complete', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionId: 'session-1',
          totalQuestions: 3,
          correctAnswers: 1,
          incorrectAnswers: 2,
          accuracy: 0.33,
          memosToReview: ['memo-2', 'memo-3'],
        }),
      });
    });

    // Start and complete quiz
    await page.route('**/api/quiz/start', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'session-1',
          totalQuestions: 1,
          currentQuestionIndex: 0,
          questions: [{ id: 'memo-1', type: 'recall', question: 'Test' }],
        }),
      });
    });

    await page.getByRole('button', { name: /start quiz/i }).click();
    await page.getByPlaceholder(/type what you remember/i).fill('Answer');
    await page.getByRole('button', { name: /finish quiz/i }).click();

    // Should show review suggestions
    await expect(page.getByText(/memos to review/i)).toBeVisible();
    await expect(page.getByText(/2 memos need review/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /review now/i })).toBeVisible();
  });

  test('should handle quiz error states', async ({ page }) => {
    // Mock insufficient memos error
    await page.route('**/api/quiz/start', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'You need at least 5 memos to start a quiz',
        }),
      });
    });

    await page.getByRole('button', { name: /start quiz/i }).click();

    // Should show error message
    await expect(page.getByText(/you need at least 5 memos/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create more memos/i })).toBeVisible();
  });

  test('should handle daily quiz limit', async ({ page }) => {
    // Mock daily limit error
    await page.route('**/api/quiz/start', async route => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Daily quiz limit reached. Try again tomorrow.',
        }),
      });
    });

    await page.getByRole('button', { name: /start quiz/i }).click();

    // Should show limit message
    await expect(page.getByText(/daily quiz limit reached/i)).toBeVisible();
    await expect(page.getByText(/try again tomorrow/i)).toBeVisible();
  });

  test('should track quiz progress', async ({ page }) => {
    // Mock quiz session with progress
    await page.route('**/api/quiz/start', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'session-1',
          totalQuestions: 5,
          currentQuestionIndex: 0,
          questions: Array.from({ length: 5 }, (_, i) => ({
            id: `memo-${i + 1}`,
            type: 'recall',
            question: `Question ${i + 1}`,
          })),
        }),
      });
    });

    await page.getByRole('button', { name: /start quiz/i }).click();

    // Should show progress bar
    await expect(page.getByRole('progressbar')).toBeVisible();
    await expect(page.getByText(/question 1 of 5/i)).toBeVisible();
    await expect(page.getByText(/20% complete/i)).toBeVisible();

    // Answer and move to next question
    await page.getByPlaceholder(/type what you remember/i).fill('Answer');
    await page.getByRole('button', { name: /next question/i }).click();

    // Progress should update
    await expect(page.getByText(/question 2 of 5/i)).toBeVisible();
    await expect(page.getByText(/40% complete/i)).toBeVisible();
  });

  test('should save quiz progress for resume', async ({ page }) => {
    // Mock quiz session
    await page.route('**/api/quiz/start', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'session-1',
          totalQuestions: 3,
          currentQuestionIndex: 1, // Already answered one question
          questions: [
            { id: 'memo-1', type: 'recall', question: 'Question 1' },
            { id: 'memo-2', type: 'recall', question: 'Question 2' },
            { id: 'memo-3', type: 'recall', question: 'Question 3' },
          ],
        }),
      });
    });

    await page.getByRole('button', { name: /start quiz/i }).click();

    // Should resume from where left off
    await expect(page.getByText(/question 2 of 3/i)).toBeVisible();
    await expect(page.getByText('Question 2')).toBeVisible();
    await expect(page.getByText(/resuming quiz/i)).toBeVisible();
  });
});