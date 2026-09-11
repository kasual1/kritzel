import { defineConfig, devices } from '@playwright/test';

const ANGULAR_PORT = 4200;
const REACT_PORT = 5173;
const VUE_PORT = 5174;

const E2E_ANGULAR_PORT = 4300;
const E2E_REACT_PORT = 5273;
const E2E_VUE_PORT = 5274;

const E2E_PROJECT = process.env.E2E_PROJECT;
const SELECTED_PROJECTS = new Set(
  [
    ...(E2E_PROJECT ? E2E_PROJECT.split(',') : []),
    ...process.argv.flatMap((argument, index, argumentsList) => {
      if (argument.startsWith('--project=')) {
        return [argument.slice('--project='.length)];
      }

      return argument === '--project' && argumentsList[index + 1] ? [argumentsList[index + 1]] : [];
    }),
  ].filter(Boolean),
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
    toHaveScreenshot: { maxDiffPixelRatio: 0.005 }, // Screenshots will always have some minor pixel differences, so we set a small tolerance to avoid false positives
  },
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    permissions: ['clipboard-read', 'clipboard-write'],
  },

  projects: [
    // Functional specs run against the standalone e2e harness apps.
    {
      name: 'core-angular',
      testDir: './tests/core',
      snapshotPathTemplate: '{testDir}/../../screenshots/core/angular/{testFilePath}/{arg}{ext}',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${E2E_ANGULAR_PORT}`,
      },
    },
    {
      name: 'core-react',
      testDir: './tests/core',
      snapshotPathTemplate: '{testDir}/../../screenshots/core/react/{testFilePath}/{arg}{ext}',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${E2E_REACT_PORT}`,
      },
    },
    {
      name: 'core-vue',
      testDir: './tests/core',
      snapshotPathTemplate: '{testDir}/../../screenshots/core/vue/{testFilePath}/{arg}{ext}',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${E2E_VUE_PORT}`,
      },
    },
    // Visual regression specs run against the docs-facing demo apps.
    // Named to match the pre-existing screenshot baseline paths (e2e/screenshots/<name>/**).
    {
      name: 'demos-angular',
      testDir: './tests/demos',
      snapshotPathTemplate: '{testDir}/../../screenshots/demos/angular/{testFilePath}/{arg}{ext}',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${ANGULAR_PORT}`,
      },
    },
    {
      name: 'demos-react',
      testDir: './tests/demos',
      snapshotPathTemplate: '{testDir}/../../screenshots/demos/react/{testFilePath}/{arg}{ext}',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${REACT_PORT}`,
      },
    },
    {
      name: 'demos-vue',
      testDir: './tests/demos',
      snapshotPathTemplate: '{testDir}/../../screenshots/demos/vue/{testFilePath}/{arg}{ext}',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${VUE_PORT}`,
      },
    },
  ],

  webServer: [
    {
      project: 'core-angular',
      command: 'npm run start:e2e:prod -w apps/core/angular',
      port: E2E_ANGULAR_PORT,
      reuseExistingServer: !process.env.CI,
      cwd: '..',
    },
    {
      project: 'core-react',
      command: 'npm run start:e2e:prod -w apps/core/react',
      port: E2E_REACT_PORT,
      reuseExistingServer: !process.env.CI,
      cwd: '..',
    },
    {
      project: 'core-vue',
      command: 'npm run start:e2e:prod -w apps/core/vue',
      port: E2E_VUE_PORT,
      reuseExistingServer: !process.env.CI,
      cwd: '..',
    },
    {
      project: 'demos-angular',
      command: 'npm run start:e2e:prod -w apps/demos/angular',
      port: ANGULAR_PORT,
      reuseExistingServer: !process.env.CI,
      cwd: '..',
    },
    {
      project: 'demos-react',
      command: 'npm run start:e2e:prod -w apps/demos/react',
      port: REACT_PORT,
      reuseExistingServer: !process.env.CI,
      cwd: '..',
    },
    {
      project: 'demos-vue',
      command: 'npm run start:e2e:prod -w apps/demos/vue',
      port: VUE_PORT,
      reuseExistingServer: !process.env.CI,
      cwd: '..',
    },
  ].filter(({ project }) => SELECTED_PROJECTS.size === 0 || SELECTED_PROJECTS.has(project))
   .map(({ project: _, ...server }) => server),
});
