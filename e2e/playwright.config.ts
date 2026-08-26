import { defineConfig, devices } from '@playwright/test';

const ANGULAR_PORT = 4200;
const REACT_PORT = 5173;
const VUE_PORT = 5174;

const E2E_ANGULAR_PORT = 4300;
const E2E_REACT_PORT = 5273;
const E2E_VUE_PORT = 5274;

const VISUAL_SPEC_PATTERN = /.*-visual\.spec\.ts$/;

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
  snapshotPathTemplate: '{testDir}/../screenshots/{projectName}/{testFilePath}/{arg}{ext}',
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
      name: 'e2e-angular',
      testDir: './tests',
      testMatch: ['*.spec.ts'],
      testIgnore: [VISUAL_SPEC_PATTERN],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${E2E_ANGULAR_PORT}`,
      },
    },
    {
      name: 'e2e-react',
      testDir: './tests',
      testMatch: ['*.spec.ts'],
      testIgnore: [VISUAL_SPEC_PATTERN],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${E2E_REACT_PORT}`,
      },
    },
    {
      name: 'e2e-vue',
      testDir: './tests',
      testMatch: ['*.spec.ts'],
      testIgnore: [VISUAL_SPEC_PATTERN],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${E2E_VUE_PORT}`,
      },
    },
    // Visual regression specs run against the docs-facing demo apps.
    // Named to match the pre-existing screenshot baseline paths (e2e/screenshots/<name>/**).
    {
      name: 'angular',
      testDir: './tests',
      testMatch: [VISUAL_SPEC_PATTERN],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${ANGULAR_PORT}`,
      },
    },
    {
      name: 'react',
      testDir: './tests',
      testMatch: [VISUAL_SPEC_PATTERN],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${REACT_PORT}`,
      },
    },
    {
      name: 'vue',
      testDir: './tests',
      testMatch: [VISUAL_SPEC_PATTERN],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${VUE_PORT}`,
      },
    },
  ],

  webServer: [
    {
      project: 'e2e-angular',
      command: 'npm run start:e2e:prod -w e2e/apps/angular',
      port: E2E_ANGULAR_PORT,
      reuseExistingServer: !process.env.CI,
      cwd: '..',
    },
    {
      project: 'e2e-react',
      command: 'npm run start:e2e:prod -w e2e/apps/react',
      port: E2E_REACT_PORT,
      reuseExistingServer: !process.env.CI,
      cwd: '..',
    },
    {
      project: 'e2e-vue',
      command: 'npm run start:e2e:prod -w e2e/apps/vue',
      port: E2E_VUE_PORT,
      reuseExistingServer: !process.env.CI,
      cwd: '..',
    },
    {
      project: 'angular',
      command: 'npm run start:e2e:prod -w demos/angular',
      port: ANGULAR_PORT,
      reuseExistingServer: !process.env.CI,
      cwd: '..',
    },
    {
      project: 'react',
      command: 'npm run start:e2e:prod -w demos/react',
      port: REACT_PORT,
      reuseExistingServer: !process.env.CI,
      cwd: '..',
    },
    {
      project: 'vue',
      command: 'npm run start:e2e:prod -w demos/vue',
      port: VUE_PORT,
      reuseExistingServer: !process.env.CI,
      cwd: '..',
    },
  ].filter(({ project }) => SELECTED_PROJECTS.size === 0 || SELECTED_PROJECTS.has(project))
   .map(({ project: _, ...server }) => server),
});
