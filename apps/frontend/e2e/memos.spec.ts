import { test, expect } from '@playwright/test';

test.describe('Memo Management', () => {
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

    // Mock categories
    await page.route('**/api/categories', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'cat-1', name: 'Work', color: '#3B82F6', memoCount: 5 },
          { id: 'cat-2', name: 'Personal', color: '#10B981', memoCount: 3 },
        ]),
      });
    });

    // Navigate to memos page
    await page.goto('/memos');
  });

  test('should display memo list', async ({ page }) => {
    // Mock memos API
    await page.route('**/api/memos*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          memos: [
            {
              id: 'memo-1',
              title: 'Test Memo 1',
              content: 'This is the first test memo',
              tags: ['test', 'example'],
              categoryId: 'cat-1',
              category: { id: 'cat-1', name: 'Work', color: '#3B82F6' },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'memo-2',
              title: 'Test Memo 2',
              content: 'This is the second test memo',
              tags: ['test'],
              categoryId: 'cat-2',
              category: { id: 'cat-2', name: 'Personal', color: '#10B981' },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1,
          },
        }),
      });
    });

    await expect(page.getByText('Test Memo 1')).toBeVisible();
    await expect(page.getByText('Test Memo 2')).toBeVisible();
    await expect(page.getByText('Work')).toBeVisible();
    await expect(page.getByText('Personal')).toBeVisible();
  });

  test('should create new memo', async ({ page }) => {
    // Mock memo creation
    await page.route('**/api/memos', async (route, request) => {
      if (request.method() === 'POST') {
        const body = request.postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'new-memo-1',
            ...body,
            category: { id: 'cat-1', name: 'Work', color: '#3B82F6' },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      }
    });

    // Click create memo button
    await page.getByRole('button', { name: /create memo/i }).click();

    // Fill memo form
    await page.getByLabelText(/title/i).fill('New Test Memo');
    await page.getByLabelText(/content/i).fill('This is a new test memo content');
    await page.getByLabelText(/tags/i).fill('new, test, memo');
    await page.getByLabelText(/category/i).selectOption('cat-1');

    // Submit form
    await page.getByRole('button', { name: /create memo/i }).click();

    // Should show success message
    await expect(page.getByText(/memo created successfully/i)).toBeVisible();
  });

  test('should validate memo form', async ({ page }) => {
    await page.getByRole('button', { name: /create memo/i }).click();

    // Submit empty form
    await page.getByRole('button', { name: /create memo/i }).click();

    // Should show validation errors
    await expect(page.getByText(/title is required/i)).toBeVisible();
    await expect(page.getByText(/content is required/i)).toBeVisible();
  });

  test('should edit existing memo', async ({ page }) => {
    // Mock initial memos
    await page.route('**/api/memos*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          memos: [
            {
              id: 'memo-1',
              title: 'Test Memo 1',
              content: 'Original content',
              tags: ['test'],
              categoryId: 'cat-1',
              category: { id: 'cat-1', name: 'Work', color: '#3B82F6' },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        }),
      });
    });

    // Mock memo update
    await page.route('**/api/memos/memo-1', async (route, request) => {
      if (request.method() === 'PUT') {
        const body = request.postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'memo-1',
            ...body,
            category: { id: 'cat-1', name: 'Work', color: '#3B82F6' },
            updatedAt: new Date().toISOString(),
          }),
        });
      }
    });

    // Click edit button on first memo
    await page.getByRole('button', { name: /edit/i }).first().click();

    // Update memo content
    await page.getByLabelText(/title/i).fill('Updated Test Memo');
    await page.getByLabelText(/content/i).fill('Updated content');

    // Submit form
    await page.getByRole('button', { name: /update memo/i }).click();

    // Should show success message
    await expect(page.getByText(/memo updated successfully/i)).toBeVisible();
  });

  test('should delete memo', async ({ page }) => {
    // Mock initial memos
    await page.route('**/api/memos*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          memos: [
            {
              id: 'memo-1',
              title: 'Test Memo 1',
              content: 'Content to delete',
              tags: ['test'],
              categoryId: 'cat-1',
              category: { id: 'cat-1', name: 'Work', color: '#3B82F6' },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        }),
      });
    });

    // Mock memo deletion
    await page.route('**/api/memos/memo-1', async (route, request) => {
      if (request.method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Memo deleted successfully' }),
        });
      }
    });

    // Click delete button
    await page.getByRole('button', { name: /delete/i }).first().click();

    // Confirm deletion in modal
    await page.getByRole('button', { name: /confirm delete/i }).click();

    // Should show success message
    await expect(page.getByText(/memo deleted successfully/i)).toBeVisible();
  });

  test('should search memos', async ({ page }) => {
    // Mock search results
    await page.route('**/api/memos/search*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            {
              id: 'memo-1',
              title: 'JavaScript Concepts',
              content: 'Important JavaScript concepts to remember',
              tags: ['javascript', 'programming'],
              categoryId: 'cat-1',
              category: { id: 'cat-1', name: 'Work', color: '#3B82F6' },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    // Search for memos
    await page.getByPlaceholder(/search memos/i).fill('JavaScript');
    await page.getByRole('button', { name: /search/i }).click();

    // Should show search results
    await expect(page.getByText('JavaScript Concepts')).toBeVisible();
    await expect(page.getByText(/search results for "javascript"/i)).toBeVisible();
  });

  test('should filter memos by category', async ({ page }) => {
    // Mock filtered results
    await page.route('**/api/memos*categoryId=cat-1*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          memos: [
            {
              id: 'memo-1',
              title: 'Work Memo',
              content: 'Work related content',
              tags: ['work'],
              categoryId: 'cat-1',
              category: { id: 'cat-1', name: 'Work', color: '#3B82F6' },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        }),
      });
    });

    // Filter by Work category
    await page.getByRole('button', { name: /filter/i }).click();
    await page.getByRole('checkbox', { name: /work/i }).check();
    await page.getByRole('button', { name: /apply filters/i }).click();

    // Should show filtered results
    await expect(page.getByText('Work Memo')).toBeVisible();
    await expect(page.getByText(/filtered by: work/i)).toBeVisible();
  });

  test('should filter memos by tags', async ({ page }) => {
    // Mock tag-filtered results
    await page.route('**/api/memos*tags=javascript*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          memos: [
            {
              id: 'memo-1',
              title: 'JavaScript Notes',
              content: 'JavaScript learning notes',
              tags: ['javascript', 'programming'],
              categoryId: 'cat-1',
              category: { id: 'cat-1', name: 'Work', color: '#3B82F6' },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        }),
      });
    });

    // Filter by tag
    await page.getByRole('button', { name: /filter/i }).click();
    await page.getByPlaceholder(/filter by tags/i).fill('javascript');
    await page.getByRole('button', { name: /apply filters/i }).click();

    // Should show filtered results
    await expect(page.getByText('JavaScript Notes')).toBeVisible();
  });

  test('should sort memos', async ({ page }) => {
    // Mock sorted results
    await page.route('**/api/memos*sortBy=title*sortOrder=asc*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          memos: [
            {
              id: 'memo-1',
              title: 'A First Memo',
              content: 'First memo content',
              tags: ['first'],
              categoryId: 'cat-1',
              category: { id: 'cat-1', name: 'Work', color: '#3B82F6' },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'memo-2',
              title: 'B Second Memo',
              content: 'Second memo content',
              tags: ['second'],
              categoryId: 'cat-2',
              category: { id: 'cat-2', name: 'Personal', color: '#10B981' },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
        }),
      });
    });

    // Sort by title ascending
    await page.getByRole('button', { name: /sort/i }).click();
    await page.getByRole('option', { name: /title a-z/i }).click();

    // Should show sorted results
    const memoTitles = await page.locator('[data-testid="memo-title"]').allTextContents();
    expect(memoTitles[0]).toBe('A First Memo');
    expect(memoTitles[1]).toBe('B Second Memo');
  });

  test('should handle pagination', async ({ page }) => {
    // Mock first page
    await page.route('**/api/memos*page=1*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          memos: [
            {
              id: 'memo-1',
              title: 'Memo 1',
              content: 'Content 1',
              tags: ['page1'],
              categoryId: 'cat-1',
              category: { id: 'cat-1', name: 'Work', color: '#3B82F6' },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          pagination: { page: 1, limit: 1, total: 2, totalPages: 2 },
        }),
      });
    });

    // Mock second page
    await page.route('**/api/memos*page=2*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          memos: [
            {
              id: 'memo-2',
              title: 'Memo 2',
              content: 'Content 2',
              tags: ['page2'],
              categoryId: 'cat-2',
              category: { id: 'cat-2', name: 'Personal', color: '#10B981' },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          pagination: { page: 2, limit: 1, total: 2, totalPages: 2 },
        }),
      });
    });

    // Should show first page
    await expect(page.getByText('Memo 1')).toBeVisible();
    await expect(page.getByText(/page 1 of 2/i)).toBeVisible();

    // Navigate to second page
    await page.getByRole('button', { name: /next page/i }).click();

    // Should show second page
    await expect(page.getByText('Memo 2')).toBeVisible();
    await expect(page.getByText(/page 2 of 2/i)).toBeVisible();
  });

  test('should handle empty state', async ({ page }) => {
    // Mock empty results
    await page.route('**/api/memos*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          memos: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        }),
      });
    });

    // Should show empty state
    await expect(page.getByText(/no memos found/i)).toBeVisible();
    await expect(page.getByText(/create your first memo/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create memo/i })).toBeVisible();
  });

  test('should handle loading state', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/memos*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          memos: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        }),
      });
    });

    // Should show loading state
    await expect(page.getByTestId('memo-list-skeleton')).toBeVisible();
  });

  test('should handle error state', async ({ page }) => {
    // Mock API error
    await page.route('**/api/memos*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Internal server error',
        }),
      });
    });

    // Should show error state
    await expect(page.getByText(/failed to load memos/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /try again/i })).toBeVisible();
  });
});