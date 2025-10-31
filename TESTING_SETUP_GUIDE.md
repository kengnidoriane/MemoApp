# Testing Setup and Configuration Guide

This guide provides instructions for setting up and running the comprehensive test suite for the MemoApp project.

## Current Test Infrastructure

### Frontend Testing Stack
- **Vitest**: Fast unit test runner with native TypeScript support
- **React Testing Library**: Component testing utilities
- **Playwright**: End-to-end testing framework
- **jsdom**: DOM environment for unit tests
- **@testing-library/user-event**: User interaction simulation

### Backend Testing Stack
- **Jest**: JavaScript testing framework
- **ts-jest**: TypeScript support for Jest
- **Supertest**: HTTP assertion library
- **Prisma Client Mocks**: Database mocking

## Dependency Resolution

### Frontend Dependency Conflicts

The current setup has React version conflicts between React 19 and Testing Library's React 18 peer dependency. Here are the resolution options:

#### Option 1: Use Legacy Peer Deps (Recommended for Development)
```bash
cd apps/frontend
npm install --legacy-peer-deps
```

#### Option 2: Force Resolution
```bash
cd apps/frontend
npm install --force
```

#### Option 3: Update Testing Library (When Available)
Wait for @testing-library/react to support React 19, then update:
```bash
npm install @testing-library/react@latest
```

### Backend Dependencies

Install missing backend dependencies:
```bash
cd apps/backend
npm install --save-dev ts-jest@^29.1.1
```

## Test Execution

### Frontend Tests

#### Unit and Component Tests
```bash
cd apps/frontend

# Run all tests
npm run test:run

# Run tests in watch mode
npm run test

# Run with coverage
npm run test:run -- --coverage

# Run specific test file
npm run test:run -- src/components/auth/__tests__/LoginForm.test.tsx

# Run tests matching pattern
npm run test:run -- --grep "validation"
```

#### E2E Tests
```bash
cd apps/frontend

# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run tests in headed mode (visible browser)
npx playwright test --headed

# Run tests in specific browser
npx playwright test --project=chromium
```

### Backend Tests

```bash
cd apps/backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- tests/services/spacedRepetitionService.test.ts

# Run integration tests only
npm test -- tests/integration/

# Run unit tests only
npm test -- tests/services/
```

## Test Configuration Files

### Frontend Vitest Configuration (`apps/frontend/vitest.config.ts`)
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/stories/**',
        'dist/',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@memo-app/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
});
```

### Backend Jest Configuration (`apps/backend/jest.config.js`)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/types/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000,
  clearMocks: true,
  restoreMocks: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Playwright Configuration (`apps/frontend/playwright.config.ts`)
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

## Environment Setup

### Environment Variables

#### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=MemoApp
```

#### Backend (`.env`)
```env
NODE_ENV=test
DATABASE_URL="postgresql://test:test@localhost:5432/memoapp_test"
JWT_SECRET=test-jwt-secret
REDIS_URL=redis://localhost:6379
```

### Test Database Setup

For integration tests, set up a test database:

```bash
# Create test database
createdb memoapp_test

# Run migrations
cd apps/backend
npx prisma migrate dev --name init

# Seed test data (optional)
npx prisma db seed
```

## Troubleshooting

### Common Issues and Solutions

#### 1. React Version Conflicts
**Error**: `peer react@"^18.0.0" from @testing-library/react`

**Solution**: Use legacy peer deps or force installation:
```bash
npm install --legacy-peer-deps
```

#### 2. TypeScript Compilation Errors
**Error**: `Cannot find module` or type errors

**Solution**: Ensure TypeScript paths are configured correctly:
```bash
# Check tsconfig.json paths
# Restart TypeScript server in IDE
```

#### 3. Test Timeouts
**Error**: Tests timing out

**Solution**: Increase timeout in test configuration:
```javascript
// In jest.config.js
testTimeout: 30000

// In vitest.config.ts
test: {
  testTimeout: 30000
}
```

#### 4. Database Connection Issues
**Error**: Cannot connect to test database

**Solution**: Ensure test database is running and accessible:
```bash
# Check database connection
psql -h localhost -U test -d memoapp_test

# Reset database if needed
npx prisma migrate reset --force
```

#### 5. Port Conflicts
**Error**: Port already in use

**Solution**: Use different ports or kill existing processes:
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

## CI/CD Integration

### GitHub Actions Workflow (`.github/workflows/test.yml`)
```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_USER: test
          POSTGRES_DB: memoapp_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run backend tests
        run: |
          cd apps/backend
          npm test -- --coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/memoapp_test

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci --legacy-peer-deps
      
      - name: Run frontend tests
        run: |
          cd apps/frontend
          npm run test:run -- --coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci --legacy-peer-deps
      
      - name: Install Playwright
        run: |
          cd apps/frontend
          npx playwright install --with-deps
      
      - name: Run E2E tests
        run: |
          cd apps/frontend
          npx playwright test
```

## Test Coverage Reports

### Viewing Coverage Reports

#### Frontend Coverage
```bash
cd apps/frontend
npm run test:run -- --coverage
# Open coverage/index.html in browser
```

#### Backend Coverage
```bash
cd apps/backend
npm test -- --coverage
# Open coverage/lcov-report/index.html in browser
```

### Coverage Thresholds

The project maintains the following coverage thresholds:
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Best Practices

### 1. Test Organization
- Group related tests using `describe` blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests focused and isolated

### 2. Mocking Strategy
- Mock external dependencies
- Use real implementations for internal logic
- Reset mocks between tests
- Verify mock calls when relevant

### 3. Async Testing
- Use proper async/await patterns
- Handle promises correctly
- Test both success and error cases
- Use appropriate timeouts

### 4. Component Testing
- Test user interactions, not implementation details
- Use semantic queries (getByRole, getByLabelText)
- Test accessibility features
- Verify error states and loading states

This guide should help you set up and run the comprehensive test suite successfully. If you encounter any issues not covered here, please refer to the official documentation for each testing tool or create an issue in the project repository.