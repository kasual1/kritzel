import { defineConfig, devices } from '@playwright/test';

const ANGULAR_PORT = 4200;
const REACT_PORT = 5173;
const VUE_PORT = 5174;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  outputDir: './test-results',
  reporter: [['line'], ['html', { open: 'never', outputFolder: './playwright-report' }]],
  snapshotPathTemplate: '{testDir}/../screenshots/{projectName}/{testFilePath}/{arg}{ext}',
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 }, // Screenshots will always have some minor pixel differences, so we set a small tolerance to avoid false positives
  },
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'angular',
      testDir: './tests',
      testMatch: ['*.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${ANGULAR_PORT}`,
      },
    },
    {
      name: 'react',
      testDir: './tests',
      testMatch: ['*.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${REACT_PORT}`,
      },
    },
    {
      name: 'vue',
      testDir: './tests',
      testMatch: ['*.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${VUE_PORT}`,
      },
    },
  ],

  webServer: [
    {
      command: 'npm run demo:angular',
      port: ANGULAR_PORT,
      reuseExistingServer: !process.env.CI,
      cwd: '..',
    },
    {
      command: 'npm run demo:react',
      port: REACT_PORT,
      reuseExistingServer: !process.env.CI,
      cwd: '..',
    },
    {
      command: 'npm run demo:vue',
      port: VUE_PORT,
      reuseExistingServer: !process.env.CI,
      cwd: '..',
    },
  ],
});
