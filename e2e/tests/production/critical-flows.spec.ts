import { test, expect } from '@playwright/test';

/**
 * Production Critical Flow Tests
 * These tests verify that critical user journeys work in production
 */
test.describe('Production Critical Flows', () => {
  const testEmail = process.env.E2E_TEST_EMAIL || 'e2e-test@memoapp.com';
  const testPassword = process.env.E2E_TEST_PASSWORD || 'TestPassword123!';

  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000); // Longer timeout for critical flows
  });

  test('should complete user registration flow', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to registration
    await page.click('text=Sign Up');
    await expect(page).toHaveURL(/.*register/);
    
    // Fill registration form
    const uniqueEmail = `test-${Date.now()}@memoapp.com`;
    await page.fill('[data-testid="email-input"]', uniqueEmail);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.fill('[data-testid="name-input"]', 'Test User');
    
    // Submit registration
    await page.click('[data-testid="register-button"]');
    
    // Should show success message or redirect to verification
    await expect(page.locator('text=Registration successful')).toBeVisible({ timeout: 10000 });
  });

  test('should complete user login flow', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to login
    await page.click('text=Sign In');
    await expect(page).toHaveURL(/.*login/);
    
    // Fill login form
    await page.fill('[data-testid="email-input"]', testEmail);
    await page.fill('[data-testid="password-input"]', testPassword);
    
    // Submit login
    await page.click('[data-testid="login-button"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 });
  });

  test('should complete memo creation flow', async ({ page }) => {
    // Login first
    await loginUser(page, testEmail, testPassword);
    
    // Navigate to memo creation
    await page.click('[data-testid="create-memo-button"]');
    
    // Fill memo form
    const memoTitle = `Test Memo ${Date.now()}`;
    await page.fill('[data-testid="memo-title-input"]', memoTitle);
    await page.fill('[data-testid="memo-content-input"]', 'This is a test memo content for production testing.');
    
    // Add tags
    await page.fill('[data-testid="memo-tags-input"]', 'test, production');
    await page.press('[data-testid="memo-tags-input"]', 'Enter');
    
    // Save memo
    await page.click('[data-testid="save-memo-button"]');
    
    // Should show success message
    await expect(page.locator('text=Memo saved successfully')).toBeVisible({ timeout: 10000 });
    
    // Should appear in memo list
    await page.goto('/memos');
    await expect(page.locator(`text=${memoTitle}`)).toBeVisible();
  });

  test('should complete quiz session flow', async ({ page }) => {
    // Login first
    await loginUser(page, testEmail, testPassword);
    
    // Ensure we have at least one memo
    await createTestMemo(page);
    
    // Start quiz
    await page.goto('/quiz');
    await page.click('[data-testid="start-quiz-button"]');
    
    // Answer quiz questions
    const maxQuestions = 5;
    for (let i = 0; i < maxQuestions; i++) {
      // Check if there are more questions
      const questionExists = await page.locator('[data-testid="quiz-question"]').isVisible();
      if (!questionExists) break;
      
      // Answer the question
      await page.click('[data-testid="remember-button"]');
      
      // Wait for next question or results
      await page.waitForTimeout(1000);
    }
    
    // Should show quiz results
    await expect(page.locator('[data-testid="quiz-results"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Quiz Complete')).toBeVisible();
  });

  test('should handle offline functionality', async ({ page }) => {
    // Login first
    await loginUser(page, testEmail, testPassword);
    
    // Go offline
    await page.context().setOffline(true);
    
    // Try to create a memo offline
    await page.goto('/memos/new');
    
    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Fill memo form
    const memoTitle = `Offline Memo ${Date.now()}`;
    await page.fill('[data-testid="memo-title-input"]', memoTitle);
    await page.fill('[data-testid="memo-content-input"]', 'This memo was created offline.');
    
    // Save memo (should queue for sync)
    await page.click('[data-testid="save-memo-button"]');
    
    // Should show offline save message
    await expect(page.locator('text=Saved offline')).toBeVisible();
    
    // Go back online
    await page.context().setOffline(false);
    
    // Should sync automatically
    await expect(page.locator('[data-testid="sync-indicator"]')).toBeVisible({ timeout: 10000 });
    
    // Memo should appear in list
    await page.goto('/memos');
    await expect(page.locator(`text=${memoTitle}`)).toBeVisible();
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Test login with invalid credentials
    await page.click('text=Sign In');
    await page.fill('[data-testid="email-input"]', 'invalid@email.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
    
    // Should not redirect
    await expect(page).toHaveURL(/.*login/);
  });

  test('should maintain session across page refreshes', async ({ page }) => {
    // Login first
    await loginUser(page, testEmail, testPassword);
    
    // Verify logged in state
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // Refresh page
    await page.reload();
    
    // Should still be logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/.*dashboard/);
  });
});

/**
 * Helper function to login a user
 */
async function loginUser(page: any, email: string, password: string) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');
  await expect(page).toHaveURL(/.*dashboard/);
}

/**
 * Helper function to create a test memo
 */
async function createTestMemo(page: any) {
  await page.goto('/memos/new');
  await page.fill('[data-testid="memo-title-input"]', 'Quiz Test Memo');
  await page.fill('[data-testid="memo-content-input"]', 'This is a memo for quiz testing.');
  await page.click('[data-testid="save-memo-button"]');
  await expect(page.locator('text=Memo saved successfully')).toBeVisible();
}