import { test, expect } from '../fixtures/editor.fixture';

type AgenticCursorSnapshot = {
  id: string;
  position: { x: number; y: number };
  attachedTo: { objectId: string; anchor: string } | null;
  isMoving: boolean;
};

type EditorElement = HTMLElement & {
  getAgenticCursors(): Promise<AgenticCursorSnapshot[]>;
  getAgenticCursor(id: string): Promise<AgenticCursorSnapshot | null>;
  findObjects(predicate: (obj: { __class__: string }) => boolean): Promise<Array<{ id: string; boundingBox: { x: number; y: number; width: number; height: number } }>>;
  moveAgenticCursor(id: string, target: unknown, options?: unknown): Promise<{ completed: boolean }>;
  removeObject(object: unknown): Promise<unknown>;
};

test.describe('Agentic Cursors', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto('/advanced/agentic-cursors/basic');
    await editorPage.waitForReady();
    await editorPage.page.waitForFunction(async () => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      return (await editor.getAgenticCursors()).length === 2;
    });
  });

  test('renders the demo cursors with names and status', async ({ editorPage }) => {
    const host = editorPage.page.locator('kritzel-agentic-cursors');
    await expect(host.locator('.agentic-cursor')).toHaveCount(2);
    await expect(host.locator('.cursor-label', { hasText: 'Planner' })).toBeVisible();
    await expect(host.locator('.agentic-cursor-status', { hasText: 'Waiting…' })).toBeVisible();
  });

  test('moves to an object anchor, attaches, and detaches when the object is removed', async ({ editorPage }) => {
    const result = await editorPage.page.evaluate(async () => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      const [, ellipse] = await editor.findObjects(obj => obj.__class__ === 'KritzelShape');
      const move = await editor.moveAgenticCursor('writer', { objectId: ellipse.id, anchor: 'bottom-right' }, { duration: 200 });
      const attached = await editor.getAgenticCursor('writer');
      const box = ellipse.boundingBox;

      const detached = new Promise<{ reason: string }>(resolve => {
        editor.addEventListener('agenticCursorDetached', event => resolve((event as CustomEvent).detail), { once: true });
      });
      await editor.removeObject(ellipse);
      const detail = await detached;
      const afterRemoval = await editor.getAgenticCursor('writer');

      return { move, attached, expected: { x: box.x + box.width, y: box.y + box.height }, detail, afterRemoval };
    });

    expect(result.move.completed).toBe(true);
    expect(result.attached?.attachedTo?.anchor).toBe('bottom-right');
    expect(result.attached?.position.x).toBeCloseTo(result.expected.x, 5);
    expect(result.attached?.position.y).toBeCloseTo(result.expected.y, 5);
    expect(result.detail.reason).toBe('object-removed');
    expect(result.afterRemoval?.attachedTo).toBeNull();
    expect(result.afterRemoval?.position).toEqual(result.attached?.position);
  });
});
