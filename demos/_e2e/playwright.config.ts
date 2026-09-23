import { defineConfig, devices } from '@playwright/test';

const ANGULAR_PORT = 4200;
const REACT_PORT = 5173;
const VUE_PORT = 5174;

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
      name: 'demos-angular',
      snapshotPathTemplate: '{testDir}/../screenshots/angular/{testFilePath}/{arg}{ext}',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${ANGULAR_PORT}`,
      },
    },
    {
      name: 'demos-react',
      snapshotPathTemplate: '{testDir}/../screenshots/react/{testFilePath}/{arg}{ext}',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${REACT_PORT}`,
      },
    },
    {
      name: 'demos-vue',
      snapshotPathTemplate: '{testDir}/../screenshots/vue/{testFilePath}/{arg}{ext}',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${VUE_PORT}`,
      },
    },
  ],

  webServer: [
    {
      project: 'demos-angular',
      command: 'npm run start:e2e:prod -w apps/demos/angular',
      port: ANGULAR_PORT,
      reuseExistingServer: !process.env.CI,
      cwd: '../../..',
    },
    {
      project: 'demos-react',
      command: 'npm run start:e2e:prod -w apps/demos/react',
      port: REACT_PORT,
      reuseExistingServer: !process.env.CI,
      cwd: '../../..',
    },
    {
      project: 'demos-vue',
      command: 'npm run start:e2e:prod -w apps/demos/vue',
      port: VUE_PORT,
      reuseExistingServer: !process.env.CI,
      cwd: '../../..',
    },
  ].filter(({ project }) => SELECTED_PROJECTS.size === 0 || SELECTED_PROJECTS.has(project))
   .map(({ project: _, ...server }) => server),
});