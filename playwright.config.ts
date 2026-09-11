import { defineConfig, devices } from '@playwright/test';

const DEMO_ANGULAR_PORT = 4200;
const DEMO_REACT_PORT = 5173;
const DEMO_VUE_PORT = 5174;

const CORE_ANGULAR_PORT = 4300;
const CORE_REACT_PORT = 5273;
const CORE_VUE_PORT = 5274;

const SELECTED_PROJECTS = new Set(
  process.argv.flatMap((argument, index, argumentsList) => {
    if (argument.startsWith('--project=')) {
      return [argument.slice('--project='.length)];
    }

    return argument === '--project' && argumentsList[index + 1] ? [argumentsList[index + 1]] : [];
  }),
);

export default defineConfig({
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
      testDir: './apps/core/_e2e/tests',
      snapshotPathTemplate: '{testDir}/../screenshots/angular/{testFilePath}/{arg}{ext}',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${CORE_ANGULAR_PORT}`,
      },
    },
    {
      name: 'core-react',
      testDir: './apps/core/_e2e/tests',
      snapshotPathTemplate: '{testDir}/../screenshots/react/{testFilePath}/{arg}{ext}',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${CORE_REACT_PORT}`,
      },
    },
    {
      name: 'core-vue',
      testDir: './apps/core/_e2e/tests',
      snapshotPathTemplate: '{testDir}/../screenshots/vue/{testFilePath}/{arg}{ext}',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${CORE_VUE_PORT}`,
      },
    },
    {
      name: 'demos-angular',
      testDir: './apps/demos/_e2e/tests',
      snapshotPathTemplate: '{testDir}/../screenshots/angular/{testFilePath}/{arg}{ext}',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${DEMO_ANGULAR_PORT}`,
      },
    },
    {
      name: 'demos-react',
      testDir: './apps/demos/_e2e/tests',
      snapshotPathTemplate: '{testDir}/../screenshots/react/{testFilePath}/{arg}{ext}',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${DEMO_REACT_PORT}`,
      },
    },
    {
      name: 'demos-vue',
      testDir: './apps/demos/_e2e/tests',
      snapshotPathTemplate: '{testDir}/../screenshots/vue/{testFilePath}/{arg}{ext}',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${DEMO_VUE_PORT}`,
      },
    },
  ],

  webServer: [
    {
      project: 'core-angular',
      command: 'npm run start:e2e:prod -w apps/core/angular',
      port: CORE_ANGULAR_PORT,
      reuseExistingServer: !process.env.CI,
    },
    {
      project: 'core-react',
      command: 'npm run start:e2e:prod -w apps/core/react',
      port: CORE_REACT_PORT,
      reuseExistingServer: !process.env.CI,
    },
    {
      project: 'core-vue',
      command: 'npm run start:e2e:prod -w apps/core/vue',
      port: CORE_VUE_PORT,
      reuseExistingServer: !process.env.CI,
    },
    {
      project: 'demos-angular',
      command: 'npm run start:e2e:prod -w apps/demos/angular',
      port: DEMO_ANGULAR_PORT,
      reuseExistingServer: !process.env.CI,
    },
    {
      project: 'demos-react',
      command: 'npm run start:e2e:prod -w apps/demos/react',
      port: DEMO_REACT_PORT,
      reuseExistingServer: !process.env.CI,
    },
    {
      project: 'demos-vue',
      command: 'npm run start:e2e:prod -w apps/demos/vue',
      port: DEMO_VUE_PORT,
      reuseExistingServer: !process.env.CI,
    },
  ].filter(({ project }) => SELECTED_PROJECTS.size === 0 || SELECTED_PROJECTS.has(project))
   .map(({ project: _, ...server }) => server),
});