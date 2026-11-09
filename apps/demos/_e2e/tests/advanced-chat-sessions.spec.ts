import type { Page } from '@playwright/test';
import { test, expect, EditorPage } from '../fixtures/editor.fixture';

type EditorElement = HTMLElement & {
  findObjects(predicate: (obj: any) => boolean): Promise<any[]>;
  selectObjects(objects: unknown[]): Promise<void>;
  getAgent(id: string): Promise<unknown | null>;
};

const openModesPage = async (page: Page) => {
  const editorPage = new EditorPage(page);
  await editorPage.goto('/advanced/chat-sessions/modes');
  await editorPage.waitForReady();
  await expect(editorPage.chatInput).toBeVisible();
  return editorPage;
};

/** Objects whose text contains the given text, with who created them. */
const notesWithText = (page: Page, text: string) =>
  page.evaluate(async needle => {
    const editor = document.querySelector('kritzel-editor') as EditorElement;
    const shapes = await editor.findObjects(obj => obj.__class__ === 'KritzelShape');
    return shapes
      .filter(shape => JSON.stringify(shape.content ?? '').includes(needle))
      .map(shape => ({ id: shape.id as string, userId: shape.userId as string | undefined }));
  }, text);

const transcript = (page: Page) => page.getByRole('list', { name: 'Transcript' });

test.describe('Chat Sessions', () => {
  test('works as the user: the prompt adds a note that the user can undo', async ({ page }) => {
    const editorPage = await openModesPage(page);

    await editorPage.sendChatPrompt('Hello board');
    await expect(transcript(page)).toContainText('Done. Press Ctrl+Z to take it back.');
    await editorPage.waitForChatIdle();

    await expect.poll(() => notesWithText(page, 'Hello board')).toEqual([{ id: expect.any(String), userId: 'demo-user' }]);

    await editorPage.undo();
    await expect.poll(() => notesWithText(page, 'Hello board')).toEqual([]);
  });

  test('turns the selection into chips and restyles the selected object', async ({ page }) => {
    const editorPage = await openModesPage(page);
    const target = await page.evaluate(async () => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      const [shape] = await editor.findObjects(obj => obj.__class__ === 'KritzelShape');
      await editor.selectObjects([shape]);
      return { id: shape.id as string, fill: JSON.stringify(shape.fillColor) };
    });
    await expect(editorPage.chatChips).toHaveCount(1);

    await editorPage.sendChatPrompt('Make it yellow');
    await expect(transcript(page)).toContainText('→ set_style');
    await editorPage.waitForChatIdle();

    const fill = await page.evaluate(async id => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      const [shape] = await editor.findObjects(obj => obj.id === id);
      return JSON.stringify(shape.fillColor);
    }, target.id);
    expect(fill).not.toBe(target.fill);
  });

  test('stops a slow response and keeps a draft typed meanwhile', async ({ page }) => {
    const editorPage = await openModesPage(page);

    await editorPage.sendChatPrompt('Please think slowly');
    await expect.poll(() => editorPage.isChatBusy()).toBe(true);

    await editorPage.chatInput.fill('Next idea');
    await editorPage.chatInput.press('Enter');
    await expect(editorPage.chatInput).toHaveValue('Next idea');

    await editorPage.chatSubmitButton.click();
    await editorPage.waitForChatIdle(5_000);
    await expect(transcript(page).locator('li')).toHaveCount(1);
    await expect(transcript(page)).not.toContainText('That took a while.');
  });

  test('works as an agent: the agent joins the canvas and creates the note', async ({ page }) => {
    const editorPage = await openModesPage(page);
    await page.getByRole('button', { name: 'Work as Agent' }).click();
    await expect
      .poll(() =>
        page.evaluate(async () => {
          const editor = document.querySelector('kritzel-editor') as EditorElement;
          return (await editor.getAgent('assistant')) !== null;
        }),
      )
      .toBe(true);

    await editorPage.sendChatPrompt('Agent note');
    await expect(transcript(page)).toContainText("Done. Undo it with the agent's history.", { timeout: 30_000 });
    await expect.poll(() => notesWithText(page, 'Agent note')).toEqual([{ id: expect.any(String), userId: 'assistant' }]);
  });
});
