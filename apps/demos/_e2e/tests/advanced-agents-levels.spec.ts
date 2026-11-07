import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/editor.fixture';

// The step-by-step agent demos only exist in the React demo app.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'demos-react', 'The step-by-step agent demos are React-only.');
});

type EditorElement = HTMLElement & {
  findObjects(predicate: (obj: any) => boolean): Promise<any[]>;
  selectObjects(objects: unknown[]): Promise<void>;
  getAgents(): Promise<{ state: { status: string | null; attachedTo: { objectId: string } | null } }[]>;
};

const countObjects = (page: Page, className: string) =>
  page.evaluate(async name => (await (document.querySelector('kritzel-editor') as EditorElement).findObjects(obj => obj.__class__ === name)).length, className);

const selectByText = (page: Page, text: string) =>
  page.evaluate(async needle => {
    const editor = document.querySelector('kritzel-editor') as EditorElement;
    const [object] = await editor.findObjects(obj => JSON.stringify(obj.content ?? '').includes(needle));
    await editor.selectObjects([object]);
  }, text);

test.describe('Agents step by step', () => {
  test('level 1: the agent writes a note', async ({ editorPage, page }) => {
    await editorPage.goto('/advanced/agents/hello');
    await editorPage.waitForReady();
    await page.getByRole('button', { name: 'Say hello' }).click();
    await expect(page.getByRole('button', { name: 'Say hello' })).toBeEnabled({ timeout: 30_000 });
    const notes = await page.evaluate(async () =>
      (await (document.querySelector('kritzel-editor') as EditorElement).findObjects(obj => JSON.stringify(obj.content ?? '').includes('Hello from an agent!'))).map(obj => obj.userId as string),
    );
    expect(notes).toHaveLength(1);
    // Objects an agent creates belong to it.
    expect(notes[0]).toMatch(/^agent-/);
  });

  test('level 2: the agent follows the selection and notices a deletion', async ({ editorPage, page }) => {
    await editorPage.goto('/advanced/agents/follow');
    await editorPage.waitForReady();
    await selectByText(page, 'Drag me around');
    await expect
      .poll(() => page.evaluate(async () => (await (document.querySelector('kritzel-editor') as EditorElement).getAgents())[0]?.state.status))
      .toBe('A note: “Drag me around”');
    await expect.poll(() => page.evaluate(async () => !!(await (document.querySelector('kritzel-editor') as EditorElement).getAgents())[0]?.state.attachedTo)).toBe(true);
    await page.keyboard.press('Delete');
    await expect
      .poll(() => page.evaluate(async () => (await (document.querySelector('kritzel-editor') as EditorElement).getAgents())[0]?.state.status))
      .toBe("It's gone!");
  });

  test('level 3: the artist draws stroke by stroke, stops on request and undoes one stroke', async ({ editorPage, page }) => {
    test.setTimeout(90_000);
    await editorPage.goto('/advanced/agents/sketch');
    await editorPage.waitForReady();
    const message = page.getByTestId('sketch-message');

    await page.getByRole('button', { name: 'Draw a flower' }).click();
    await expect(message).toHaveText('Finished a flower in 5 strokes. Each stroke is one step in the artist\'s history.', { timeout: 60_000 });
    expect(await countObjects(page, 'KritzelPath')).toBe(5);

    await page.getByRole('button', { name: 'Undo stroke' }).click();
    await expect.poll(() => countObjects(page, 'KritzelPath')).toBe(4);

    await page.getByRole('button', { name: 'Draw a house' }).click();
    await expect.poll(() => countObjects(page, 'KritzelPath'), { timeout: 20_000 }).toBeGreaterThan(4);
    await page.getByRole('button', { name: 'Stop' }).click();
    await expect(message).toHaveText(/^Stopped after \d of 9 strokes \(aborted\)\.$/);
  });

  test('level 4: the analyst draws the chart and updates, sorts and highlights bars', async ({ editorPage, page }) => {
    test.setTimeout(120_000);
    await editorPage.goto('/advanced/agents/chart');
    await editorPage.waitForReady();
    const message = page.getByTestId('chart-message');
    const idle = () => expect(message).toHaveAttribute('data-busy', 'false', { timeout: 60_000 });

    await page.getByRole('button', { name: 'Draw chart' }).click();
    await expect(message).toHaveAttribute('data-busy', 'true');
    await idle();
    await page.getByLabel('Wed', { exact: true }).fill('9');
    await expect(message).toHaveText('Wed is now 9.', { timeout: 30_000 });
    const wed = await page.evaluate(async () => {
      const [bar] = await (document.querySelector('kritzel-editor') as EditorElement).findObjects(obj => obj.__class__ === 'KritzelShape' && JSON.stringify(obj.content ?? '').includes('"9"'));
      return { height: Math.round(bar.height), bottom: Math.round(bar.translateY + bar.height) };
    });
    // 30 units per coffee, still standing on the baseline.
    expect(wed).toEqual({ height: 270, bottom: 170 });

    await page.getByRole('button', { name: 'Sort by value' }).click();
    await expect(message).toHaveText('Sorted: Wed, Thu, Tue, Fri, Mon.', { timeout: 60_000 });
    await page.getByRole('button', { name: 'Highlight the top day' }).click();
    await expect(message).toHaveText('Wed had the most coffee: 9.', { timeout: 30_000 });
  });

  test('level 5: the builder adds working widgets with its own tool', async ({ editorPage, page }) => {
    test.setTimeout(120_000);
    await editorPage.goto('/advanced/agents/widgets');
    await editorPage.waitForReady();
    const log = page.getByTestId('widgets-log');

    // The selected note becomes the context of the prompt typed into the editor's chat box.
    await selectByText(page, 'Daily standup');
    await expect(page.locator('kritzel-chat-box')).toContainText('Daily standup');
    await page.locator('kritzel-chat-box textarea').fill('Add a 5-minute timer');
    await page.locator('kritzel-chat-box textarea').press('Enter');
    await expect(log).toHaveAttribute('data-running', 'true');
    await expect(log).toHaveAttribute('data-running', 'false', { timeout: 60_000 });
    await expect(page.getByTestId('widgets-assistant').last()).toHaveText(
      'Added a 5-minute timer next to “Daily standup” and connected them. It works right away: select it and press Start.',
    );
    expect(await countObjects(page, 'KritzelIframeObject')).toBe(1);
    expect(await countObjects(page, 'KritzelLine')).toBe(1);
    await expect(page.frameLocator('iframe').first().locator('#time')).toHaveText('5:00');

    await page.getByRole('button', { name: 'Add a poll: Where should we eat? Pizza, Sushi, Tacos' }).click();
    await expect(log).toHaveAttribute('data-running', 'false', { timeout: 60_000 });
    expect(await countObjects(page, 'KritzelIframeObject')).toBe(2);
  });
});
