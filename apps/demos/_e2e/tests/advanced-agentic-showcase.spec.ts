import { test, expect } from '../fixtures/editor.fixture';

// The showcase page only exists in the React demo app.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'demos-react', 'The agentic showcase is a React-only demo.');
});

const SCENARIOS = [
  { label: 'Tidy up', message: 'Tidy up finished.' },
  { label: 'Flowchart', message: 'Flowchart finished.' },
  { label: 'Review', message: 'Review finished.' },
  // Without a human taking the note, Agent A completes its move.
  { label: 'Agents + human', message: 'Agent A moved the green note. Agent B undid its connector.' },
];

test.describe('Agentic Showcase', () => {
  for (const scenario of SCENARIOS) {
    test(`runs the "${scenario.label}" use case to the end`, async ({ editorPage, page }) => {
      test.setTimeout(120_000);
      await editorPage.goto('/advanced/agentic-cursors/showcase');
      await editorPage.waitForReady();

      await page.getByRole('button', { name: scenario.label, exact: true }).click();
      const status = page.getByTestId('showcase-message');
      await expect(status).toHaveAttribute('data-scenario-state', /done|failed/, { timeout: 100_000 });
      await expect(status).toHaveText(scenario.message);
      await expect(status).toHaveAttribute('data-scenario-state', 'done');
    });
  }
});
