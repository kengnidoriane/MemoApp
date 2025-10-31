import { chromium, FullConfig } from '@playwright/test';

/**
 * Global teardown for production E2E tests
 * This runs once after all tests complete
 */
async function globalTeardown(config: FullConfig) {
  const baseURL = config.use?.baseURL || 'http://localhost';
  
  console.log('🧹 Starting production E2E test teardown...');
  
  // Launch browser for teardown
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Cleanup test data
    console.log('🗑️ Cleaning up test data...');
    await cleanupTestData(page, baseURL);
    
    // Generate test report summary
    console.log('📊 Generating test report summary...');
    await generateTestSummary();
    
    console.log('✅ Production E2E test teardown completed');
  } catch (error) {
    console.error('❌ Production E2E test teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  } finally {
    await browser.close();
  }
}

/**
 * Cleanup test data created during tests
 */
async function cleanupTestData(page: any, baseURL: string) {
  const testEmail = process.env.E2E_TEST_EMAIL;
  const testPassword = process.env.E2E_TEST_PASSWORD;
  
  if (!testEmail || !testPassword) {
    console.log('ℹ️ No test credentials found, skipping cleanup');
    return;
  }
  
  try {
    // Login as test user
    const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
      data: {
        email: testEmail,
        password: testPassword,
      },
    });
    
    if (!loginResponse.ok()) {
      console.log('ℹ️ Could not login test user for cleanup');
      return;
    }
    
    const { token } = await loginResponse.json();
    
    // Delete test user's data (optional - depends on your cleanup policy)
    // This is commented out to preserve test data for debugging
    /*
    const deleteResponse = await page.request.delete(`${baseURL}/api/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (deleteResponse.ok()) {
      console.log('✅ Test user data cleaned up');
    }
    */
    
    console.log('ℹ️ Test data cleanup skipped (preserved for debugging)');
  } catch (error) {
    console.warn('⚠️ Could not cleanup test data:', error);
  }
}

/**
 * Generate a summary of test results
 */
async function generateTestSummary() {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const resultsPath = 'e2e-results/production/results.json';
    
    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      
      const summary = {
        timestamp: new Date().toISOString(),
        total: results.stats?.total || 0,
        passed: results.stats?.passed || 0,
        failed: results.stats?.failed || 0,
        skipped: results.stats?.skipped || 0,
        duration: results.stats?.duration || 0,
        success: (results.stats?.failed || 0) === 0,
      };
      
      // Write summary
      const summaryPath = 'e2e-results/production/summary.json';
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
      
      console.log('📊 Test Summary:');
      console.log(`   Total: ${summary.total}`);
      console.log(`   Passed: ${summary.passed}`);
      console.log(`   Failed: ${summary.failed}`);
      console.log(`   Skipped: ${summary.skipped}`);
      console.log(`   Duration: ${Math.round(summary.duration / 1000)}s`);
      console.log(`   Success: ${summary.success ? '✅' : '❌'}`);
    }
  } catch (error) {
    console.warn('⚠️ Could not generate test summary:', error);
  }
}

export default globalTeardown;