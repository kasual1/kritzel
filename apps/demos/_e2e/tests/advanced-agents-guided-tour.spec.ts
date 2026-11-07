import { test, expect } from '../fixtures/editor.fixture';

// The guided tour page only exists in the React demo app.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'demos-react', 'The agent guided tour is a React-only demo.');
});

test.describe('Agent Guided Tour', () => {
  test('places the trip planner, walks through it and reacts when the user books', async ({ editorPage, page }) => {
    test.setTimeout(120_000);
    await editorPage.goto('/advanced/agents/guided-tour');
    await editorPage.waitForReady();

    await page.getByRole('button', { name: 'Start tour' }).click();
    const message = page.getByTestId('tour-message');
    await expect(message).toHaveAttribute('data-phase', /your-turn|failed/, { timeout: 100_000 });
    await expect(message).toHaveText('Your turn: press Book trip');

    // The guide pressed Lisbon, two more nights and the insurance switch.
    const planner = page.frameLocator('iframe');
    await expect(planner.locator('[data-kritzel-id="title"]')).toHaveText('Lisbon');
    await expect(planner.locator('[data-kritzel-id="nights"]')).toHaveText('5');
    await expect(planner.locator('[data-kritzel-id="insurance"]')).toHaveAttribute('aria-checked', 'true');
    await expect(planner.locator('[data-kritzel-id="total"]')).toHaveText('$639');
    await expect(page.getByRole('region', { name: 'Elements in the trip planner' })).toContainText('nights-increase');

    // The user presses Book trip inside the page; the guide marks the summary as booked.
    const book = planner.getByRole('button', { name: 'Book trip' });
    const box = (await book.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(planner.locator('[data-kritzel-id="book"]')).toHaveText('Booked ✓');
    await expect(message).toHaveText('Enjoy Lisbon!', { timeout: 30_000 });
    await expect(message).toHaveAttribute('data-phase', 'booked');
  });
});
