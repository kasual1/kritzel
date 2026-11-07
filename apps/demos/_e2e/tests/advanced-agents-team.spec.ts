import { test, expect, EditorPage } from '../fixtures/editor.fixture';

// The team page only exists in the React demo app.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'demos-react', 'The agent team is a React-only demo.');
});

test.describe('Agent Team', () => {
  test('runs three agents at once and shares them with a second tab', async ({ page, context }) => {
    test.setTimeout(120_000);
    const first = new EditorPage(page);
    await first.goto('/advanced/agents/team');
    await first.waitForReady();
    const secondPage = await context.newPage();
    const second = new EditorPage(secondPage);
    await second.goto('/advanced/agents/team');
    await second.waitForReady();

    await page.getByRole('button', { name: 'Run team' }).click();

    // The second tab sees the agents of the first one through presence.
    const remote = secondPage.locator('[data-testid=team-agent][data-remote=true]');
    await expect(remote).toHaveCount(3, { timeout: 30_000 });
    await expect(remote.first()).toContainText('via Tab');

    await expect(page.getByTestId('team-run')).toHaveAttribute('data-running', 'false', { timeout: 100_000 });
    const feed = page.getByTestId('team-feed');
    await expect(feed).toContainText('Planner added createShape');
    await expect(feed).toContainText('Writer updated typeText');
    await expect(feed).toContainText('Designer updated setStyle');
    await expect(feed).not.toContainText('refused');

    // Each agent has its own history. The Writer checked off the done card after the Designer colored it, so the
    // Designer's step is outdated and refused...
    await page.locator('[data-testid=team-agent]', { hasText: 'Designer' }).getByRole('button', { name: 'Undo' }).click();
    await expect(feed).toContainText("Designer can't undo: its card changed since its last step conflict");
    // ...while the Writer takes back its own last step.
    await page.locator('[data-testid=team-agent]', { hasText: 'Writer' }).getByRole('button', { name: 'Undo' }).click();
    await expect(feed).toContainText('Writer updated undo');
  });
});
