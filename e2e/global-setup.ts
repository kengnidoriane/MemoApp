import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for production E2E tests
 * This runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  const baseURL = config.use?.baseURL || 'http://localhost';
  
  console.log('🚀 Starting production E2E test setup...');
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for services to be ready
    console.log('⏳ Waiting for services to be ready...');
    await waitForServices(page, baseURL);
    
    // Setup test data
    console.log('📝 Setting up test data...');
    await setupTestData(page, baseURL);
    
    console.log('✅ Production E2E test setup completed');
  } catch (error) {
    console.error('❌ Production E2E test setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Wait for all services to be healthy
 */
async function waitForServices(page: any, baseURL: string) {
  const maxRetries = 30;
  const retryDelay = 2000;
  
  const services = [
    { name: 'Frontend', url: `${baseURL}/health` },
    { name: 'Backend API', url: `${baseURL}/api/health` },
    { name: 'Load Balancer', url: `${baseURL.replace('localhost', 'localhost:8080')}/health` },
  ];
  
  for (const service of services) {
    let retries = 0;
    let healthy = false;
    
    while (retries < maxRetries && !healthy) {
      try {
        const response = await page.request.get(service.url);
        if (response.ok()) {
          console.log(`✅ ${service.name} is healthy`);
          healthy = true;
        } else {
          throw new Error(`HTTP ${response.status()}`);
        }
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          throw new Error(`${service.name} failed to become healthy after ${maxRetries} retries: ${error}`);
        }
        console.log(`⏳ ${service.name} not ready, retrying... (${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
}

/**
 * Setup test data for production tests
 */
async function setupTestData(page: any, baseURL: string) {
  // Create test user for production tests
  const testUser = {
    email: 'e2e-test@memoapp.com',
    password: 'TestPassword123!',
    name: 'E2E Test User',
  };
  
  try {
    // Try to register test user
    const response = await page.request.post(`${baseURL}/api/auth/register`, {
      data: testUser,
    });
    
    if (response.ok()) {
      console.log('✅ Test user created successfully');
    } else if (response.status() === 409) {
      console.log('ℹ️ Test user already exists');
    } else {
      throw new Error(`Failed to create test user: HTTP ${response.status()}`);
    }
  } catch (error) {
    console.warn('⚠️ Could not setup test user:', error);
    // Don't fail setup if user creation fails - tests should handle this
  }
  
  // Store test credentials for tests
  process.env.E2E_TEST_EMAIL = testUser.email;
  process.env.E2E_TEST_PASSWORD = testUser.password;
}

export default globalSetup;