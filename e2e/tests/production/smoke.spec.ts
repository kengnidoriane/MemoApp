import { test, expect } from '@playwright/test';

/**
 * Production Smoke Tests
 * These tests verify that the basic functionality works in production
 */
test.describe('Production Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for production environment
    test.setTimeout(60000);
  });

  test('should load the application homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/MemoApp/);
    
    // Check for key elements
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    
    // Check that no console errors occurred
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('should have working health check endpoints', async ({ page }) => {
    // Test frontend health
    const frontendHealth = await page.request.get('/health');
    expect(frontendHealth.ok()).toBeTruthy();
    
    // Test backend health
    const backendHealth = await page.request.get('/api/health');
    expect(backendHealth.ok()).toBeTruthy();
    
    const healthData = await backendHealth.json();
    expect(healthData.status).toBe('healthy');
    expect(healthData.database).toBe(true);
  });

  test('should serve static assets correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check that CSS is loaded
    const stylesheets = await page.locator('link[rel="stylesheet"]').count();
    expect(stylesheets).toBeGreaterThan(0);
    
    // Check that JavaScript is loaded
    const scripts = await page.locator('script[src]').count();
    expect(scripts).toBeGreaterThan(0);
    
    // Check that favicon is accessible
    const faviconResponse = await page.request.get('/favicon.ico');
    expect(faviconResponse.status()).toBeLessThan(400);
  });

  test('should have proper security headers', async ({ page }) => {
    const response = await page.request.get('/');
    
    const headers = response.headers();
    
    // Check for security headers
    expect(headers['x-frame-options']).toBeTruthy();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-xss-protection']).toBeTruthy();
    
    // Check Content-Security-Policy if present
    if (headers['content-security-policy']) {
      expect(headers['content-security-policy']).toContain('default-src');
    }
  });

  test('should handle 404 errors gracefully', async ({ page }) => {
    const response = await page.goto('/non-existent-page');
    
    // Should redirect to main app (SPA routing)
    expect(response?.status()).toBe(200);
    
    // Should show the app, not a generic 404
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have working service worker', async ({ page }) => {
    await page.goto('/');
    
    // Wait for service worker to register
    await page.waitForFunction(() => 'serviceWorker' in navigator);
    
    // Check if service worker is registered
    const swRegistered = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return !!registration;
    });
    
    expect(swRegistered).toBe(true);
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that the page is responsive
    await expect(page.locator('nav')).toBeVisible();
    
    // Check that text is readable (not too small)
    const bodyFontSize = await page.locator('body').evaluate(el => {
      return window.getComputedStyle(el).fontSize;
    });
    
    const fontSize = parseInt(bodyFontSize);
    expect(fontSize).toBeGreaterThanOrEqual(14); // Minimum readable font size
  });

  test('should load within acceptable time limits', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds in production
    expect(loadTime).toBeLessThan(5000);
    
    console.log(`Page load time: ${loadTime}ms`);
  });
});