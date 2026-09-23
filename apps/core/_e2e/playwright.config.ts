import { defineConfig, devices } from '@playwright/test';

const E2E_ANGULAR_PORT = 4300;
const E2E_REACT_PORT = 5273;
const E2E_VUE_PORT = 5274;

const SELECTED_PROJECTS = new Set(
  process.argv.flatMap((argument, index, argumentsList) => {
    if (argument.startsWith('--project=')) {
      return [argument.slice('--project='.length)];
    }

    return argument === '--project' && argumentsList[index + 1] ? [argumentsList[index + 1]] : [];
  }),
);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  maxFailures: process.env.CI ? 2 : 0,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  outputDir: './test-results',
  reporter: [['line'], ['html', { open: 'never', outputFolder: './playwright-report' }]],
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.005 },
  },
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    permissions: ['clipboard-read', 'clipboard-write'],
  },

  projects: [
    {
      name: 'core-angular',
      snapshotPathTemplate: '{testDir}/../screenshots/angular/{testFilePath}/{arg}{ext}',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${E2E_ANGULAR_PORT}`,
      },
    },
    {
      name: 'core-react',
      snapshotPathTemplate: '{testDir}/../screenshots/react/{testFilePath}/{arg}{ext}',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${E2E_REACT_PORT}`,
      },
    },
    {
      name: 'core-vue',
      snapshotPathTemplate: '{testDir}/../screenshots/vue/{testFilePath}/{arg}{ext}',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${E2E_VUE_PORT}`,
      },
    },
  ],

  webServer: [
    {
      project: 'core-angular',
      command: 'npm run start:e2e:prod -w apps/core/angular',
      port: E2E_ANGULAR_PORT,
      reuseExistingServer: !process.env.CI,
      cwd: '../../..',
    },
    {
      project: 'core-react',
      command: 'npm run start:e2e:prod -w apps/core/react',
      port: E2E_REACT_PORT,
      reuseExistingServer: !process.env.CI,
      cwd: '../../..',
    },
    {
      project: 'core-vue',
      command: 'npm run start:e2e:prod -w apps/core/vue',
      port: E2E_VUE_PORT,
      reuseExistingServer: !process.env.CI,
      cwd: '../../..',
    },
  ].filter(({ project }) => SELECTED_PROJECTS.size === 0 || SELECTED_PROJECTS.has(project))
   .map(({ project: _, ...server }) => server),
});