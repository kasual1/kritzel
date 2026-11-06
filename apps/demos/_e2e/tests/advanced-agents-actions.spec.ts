import type { Page } from '@playwright/test';
import { test, expect, EditorPage } from '../fixtures/editor.fixture';

const RECTANGLE_ID = 'agentic-actions-rectangle';
const ELLIPSE_ID = 'agentic-actions-ellipse';

type ActionResult = { completed: boolean; reason?: string; objectIds?: string[] };

type EditorElement = HTMLElement & {
  addAgenticCursor(options: unknown): Promise<unknown>;
  getAgenticCursor(id: string): Promise<{ activeAction: string | null; canUndo: boolean } | null>;
  performAgenticAction(cursorId: string, action: unknown, options?: unknown): Promise<ActionResult>;
  findObjects(predicate: (obj: any) => boolean): Promise<any[]>;
  getAllObjects(): Promise<any[]>;
  selectObjects(objects: unknown[]): Promise<void>;
};

const openActionsPage = async (page: Page) => {
  const editorPage = new EditorPage(page);
  await editorPage.goto('/advanced/agents/actions');
  await editorPage.waitForReady();
  await page.waitForFunction(async ids => {
    const editor = document.querySelector('kritzel-editor') as EditorElement;
    const found = await editor.findObjects(obj => ids.includes(obj.id));
    return found.length === ids.length;
  }, [RECTANGLE_ID, ELLIPSE_ID]);
  return editorPage;
};

const translateXOf = (page: Page, id: string) =>
  page.evaluate(async objectId => {
    const editor = document.querySelector('kritzel-editor') as EditorElement;
    const [object] = await editor.findObjects(obj => obj.id === objectId);
    return object?.translateX as number;
  }, id);

test.describe('Agentic Actions', () => {
  test('runs the demo script, outlines targets while running and undoes agent steps', async ({ page }) => {
    await openActionsPage(page);
    const overlay = page.locator('kritzel-agentic-cursors');

    await page.getByRole('button', { name: 'Run Script' }).click();
    // While an action runs, its target is outlined in the agent's color (local only).
    await expect(overlay.locator('.agentic-selection[data-cursor-id="agent"]').first()).toBeAttached();
    await expect(page.getByText('Script finished')).toBeVisible({ timeout: 60_000 });
    await expect(overlay.locator('.agentic-selection')).toHaveCount(0);

    const counts = await page.evaluate(async () => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      const objects = await editor.findObjects(() => true);
      return {
        shapes: objects.filter(o => o.__class__ === 'KritzelShape').length,
        lines: objects.filter(o => o.__class__ === 'KritzelLine').length,
        paths: objects.filter(o => o.__class__ === 'KritzelPath').length,
      };
    });
    expect(counts).toEqual({ shapes: 3, lines: 1, paths: 1 });

    const undo = page.getByRole('button', { name: 'Undo Agent' });
    await expect(undo).toBeEnabled();
    await undo.click();
    await expect(page.getByText('Agent undo done.')).toBeVisible();
    await expect.poll(() => page.evaluate(async () => (await (document.querySelector('kritzel-editor') as EditorElement).findObjects(o => o.__class__ === 'KritzelPath')).length)).toBe(0);
  });

  test('refuses to change an object the user has selected', async ({ page }) => {
    await openActionsPage(page);
    const result = await page.evaluate(async id => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      await editor.addAgenticCursor({ id: 'probe', name: 'Probe' });
      const [rectangle] = await editor.findObjects(obj => obj.id === id);
      await editor.selectObjects([rectangle]);
      return editor.performAgenticAction('probe', { type: 'moveObject', objectId: id, to: { x: 400, y: 0 } }, { instant: true });
    }, RECTANGLE_ID);
    expect(result).toEqual({ completed: false, reason: 'user-selected', objectIds: [RECTANGLE_ID] });
  });

  test.describe('in two tabs', () => {
    test('syncs agent changes but never the agent cursor or its selection', async ({ page }) => {
      const pageB = await page.context().newPage();
      await openActionsPage(page);
      await openActionsPage(pageB);
      const cursorId = `agent-a-${Date.now()}`;
      const before = await translateXOf(page, RECTANGLE_ID);

      const result = await page.evaluate(
        async ({ cursorId, id }) => {
          const editor = document.querySelector('kritzel-editor') as EditorElement;
          await editor.addAgenticCursor({ id: cursorId, name: 'Agent A' });
          await editor.performAgenticAction(cursorId, { type: 'select', objectIds: [id] }, { instant: true });
          return editor.performAgenticAction(cursorId, { type: 'moveObject', objectId: id, to: { x: 300, y: -60 } }, { instant: true });
        },
        { cursorId, id: RECTANGLE_ID },
      );
      expect(result.completed).toBe(true);
      const after = await translateXOf(page, RECTANGLE_ID);
      expect(after).not.toBeCloseTo(before, 1);

      // Tab B receives the change...
      await expect.poll(() => translateXOf(pageB, RECTANGLE_ID)).toBeCloseTo(after, 5);
      // ...but no cursor, outline or selection group of the agent.
      const overlayB = pageB.locator('kritzel-agentic-cursors');
      await expect(overlayB.locator(`[data-cursor-id="${cursorId}"]`)).toHaveCount(0);
      await expect(overlayB.locator('.agentic-selection')).toHaveCount(0);
      const inB = await pageB.evaluate(async id => {
        const editor = document.querySelector('kritzel-editor') as EditorElement;
        const groups = (await editor.getAllObjects()).filter(o => o.__class__ === 'KritzelSelectionGroup');
        return { cursor: await editor.getAgenticCursor(id), groups: groups.length };
      }, cursorId);
      expect(inB).toEqual({ cursor: null, groups: 0 });

      // Tab A still shows its own agent's selection.
      await expect(page.locator('kritzel-agentic-cursors').locator(`.agentic-selection[data-cursor-id="${cursorId}"]`)).toHaveCount(1);
      await pageB.close();
    });

    test("refuses objects selected in the other tab as a collaborator's", async ({ page }) => {
      const pageB = await page.context().newPage();
      await openActionsPage(page);
      await openActionsPage(pageB);

      await pageB.evaluate(async id => {
        const editor = document.querySelector('kritzel-editor') as EditorElement;
        const [ellipse] = await editor.findObjects(obj => obj.id === id);
        await editor.selectObjects([ellipse]);
      }, ELLIPSE_ID);
      // Wait until tab A has received tab B's selection.
      await page.waitForFunction(async id => {
        const editor = document.querySelector('kritzel-editor') as EditorElement;
        const groups = (await editor.getAllObjects()).filter(o => o.__class__ === 'KritzelSelectionGroup');
        return groups.some(group => group.objectIds?.includes(id));
      }, ELLIPSE_ID);

      const before = await translateXOf(page, ELLIPSE_ID);
      const result = await page.evaluate(async id => {
        const editor = document.querySelector('kritzel-editor') as EditorElement;
        await editor.addAgenticCursor({ id: 'agent-collab', name: 'Agent' });
        return editor.performAgenticAction('agent-collab', { type: 'moveObject', objectId: id, to: { x: 300, y: 300 } }, { instant: true });
      }, ELLIPSE_ID);

      expect(result).toEqual({ completed: false, reason: 'collaborator-editing', objectIds: [ELLIPSE_ID] });
      expect(await translateXOf(page, ELLIPSE_ID)).toBeCloseTo(before, 5);
      expect(await translateXOf(pageB, ELLIPSE_ID)).toBeCloseTo(before, 5);
      await pageB.close();
    });
  });
});
