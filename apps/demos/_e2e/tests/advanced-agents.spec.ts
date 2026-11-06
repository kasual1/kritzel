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
  findObjects(predicate: (obj: { __class__: string }) => boolean): Promise<Array<{ id: string; translateX: number; translateY: number; boundingBox: { x: number; y: number; width: number; height: number } }>>;
  moveAgenticCursor(id: string, target: unknown, options?: unknown): Promise<{ completed: boolean }>;
  removeObject(object: unknown): Promise<unknown>;
  updateObject(object: unknown, properties: Record<string, unknown>): Promise<unknown>;
  undo(): Promise<void>;
  performAgenticAction(cursorId: string, action: unknown, options?: unknown): Promise<{ completed: boolean; reason?: string; objectIds?: string[] }>;
};

test.describe('Agentic Cursors', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto('/advanced/agents/basic');
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

  test('moves an object through performAgenticAction with its own undo history', async ({ editorPage }) => {
    const moved = await editorPage.page.evaluate(async () => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      const [rectangle, ellipse] = await editor.findObjects(obj => obj.__class__ === 'KritzelShape');
      // Agent changes keep object instances, so read the starting position before the action.
      const before = rectangle.translateX;
      const sources: unknown[] = [];
      editor.addEventListener('objectsUpdated', event => sources.push((event as CustomEvent).detail.source), { once: true });

      const result = await editor.performAgenticAction(
        'writer',
        { type: 'moveObject', objectId: rectangle.id, to: { x: rectangle.boundingBox.x + 200, y: rectangle.boundingBox.y }, align: 'top-left' },
        { instant: true },
      );
      const [after] = await editor.findObjects(obj => (obj as unknown as { id: string }).id === rectangle.id);
      return { result, rectangleId: rectangle.id, ellipseId: ellipse.id, before, after: after.translateX, source: sources[0] };
    });

    expect(moved.result).toEqual({ completed: true, objectIds: [moved.rectangleId] });
    expect(moved.after).toBeCloseTo(moved.before + 200, 5);
    expect(moved.source).toEqual({ type: 'agent', agentId: 'writer', actionType: 'moveObject' });

    // A user edit to another object, then the user's undo: only the user's edit is reverted.
    await editorPage.waitForUndoCapture();
    const ellipseBefore = await editorPage.page.evaluate(async (ellipseId) => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      const [ellipse] = await editor.findObjects(obj => (obj as unknown as { id: string }).id === ellipseId);
      const x = ellipse.translateX;
      await editor.updateObject(ellipse, { translateX: x + 50 });
      return x;
    }, moved.ellipseId);
    await editorPage.waitForUndoCapture();

    const afterUserUndo = await editorPage.page.evaluate(async ({ rectangleId, ellipseId }) => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      await editor.undo();
      const [rectangle] = await editor.findObjects(obj => (obj as unknown as { id: string }).id === rectangleId);
      const [ellipse] = await editor.findObjects(obj => (obj as unknown as { id: string }).id === ellipseId);
      return { rectangle: rectangle.translateX, ellipse: ellipse.translateX };
    }, { rectangleId: moved.rectangleId, ellipseId: moved.ellipseId });
    expect(afterUserUndo.ellipse).toBeCloseTo(ellipseBefore, 5);
    expect(afterUserUndo.rectangle).toBeCloseTo(moved.after, 5);

    // The agent's own undo reverts the move.
    const afterAgentUndo = await editorPage.page.evaluate(async (rectangleId) => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      const result = await editor.performAgenticAction('writer', { type: 'undo' }, { instant: true });
      const [rectangle] = await editor.findObjects(obj => (obj as unknown as { id: string }).id === rectangleId);
      return { result, rectangle: rectangle.translateX };
    }, moved.rectangleId);
    expect(afterAgentUndo.result.completed).toBe(true);
    expect(afterAgentUndo.rectangle).toBeCloseTo(moved.before, 5);
  });
  test('animates an agentic move and outlines the target only while running', async ({ editorPage }) => {
    const host = editorPage.page.locator('kritzel-agentic-cursors');
    await expect(host.locator('.agentic-selection')).toHaveCount(0);

    const ids = await editorPage.page.evaluate(async () => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      const [rectangle] = await editor.findObjects(obj => obj.__class__ === 'KritzelShape');
      const start = rectangle.translateX;
      (window as unknown as { agenticMove: Promise<unknown> }).agenticMove = editor.performAgenticAction(
        'planner',
        { type: 'moveObject', objectId: rectangle.id, to: { x: rectangle.boundingBox.x + 300, y: rectangle.boundingBox.y }, align: 'top-left' },
        { speed: 600 },
      );
      return { id: rectangle.id, start };
    });

    await expect(host.locator(`.agentic-selection[data-cursor-id="planner"][data-object-id="${ids.id}"]`)).toHaveCount(1);
    const result = await editorPage.page.evaluate(async () => (window as unknown as { agenticMove: Promise<unknown> }).agenticMove);
    expect(result).toEqual({ completed: true, objectIds: [ids.id] });
    await expect(host.locator('.agentic-selection')).toHaveCount(0);

    const end = await editorPage.page.evaluate(async (id) => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      const [rectangle] = await editor.findObjects(obj => (obj as unknown as { id: string }).id === id);
      return rectangle.translateX;
    }, ids.id);
    expect(end).toBeCloseTo(ids.start + 300, 5);
  });
  test('creates, types, transforms, draws and connects through performAgenticAction', async ({ editorPage }) => {
    const outcome = await editorPage.page.evaluate(async () => {
      const editor = document.querySelector('kritzel-editor') as EditorElement & {
        findObjects(predicate: (obj: any) => boolean): Promise<any[]>;
      };
      const run = (action: unknown) => editor.performAgenticAction('writer', action, { instant: true });
      const byId = async (id: string) => (await editor.findObjects(obj => obj.id === id))[0];

      const shape = await run({ type: 'createShape', x: 100, y: 400, width: 160, height: 90, text: 'Hello' });
      const text = await run({ type: 'createText', x: 320, y: 420, text: 'Note' });
      const typed = await run({ type: 'typeText', objectId: text.objectIds![0], text: ' added' });
      const resized = await run({ type: 'resizeObject', objectId: shape.objectIds![0], width: 240 });
      const rotated = await run({ type: 'rotateObject', objectId: shape.objectIds![0], angle: 30 });
      const path = await run({ type: 'drawPath', points: [{ x: 500, y: 400 }, { x: 560, y: 460 }, { x: 620, y: 400 }] });
      const line = await run({ type: 'connect', from: shape.objectIds![0], to: text.objectIds![0] });

      const shapeObject = await byId(shape.objectIds![0]);
      const lineObject = await byId(line.objectIds![0]);
      const pathObject = await byId(path.objectIds![0]);
      const textObject = await byId(text.objectIds![0]);
      const undoLine = await run({ type: 'undo' });
      const lineAfterUndo = await byId(line.objectIds![0]);

      return {
        results: [shape, text, typed, resized, rotated, path, line].map(result => result.completed),
        shapeClass: shapeObject.__class__,
        shapeRotation: shapeObject.rotation,
        textContent: JSON.stringify(textObject.content),
        pathClass: pathObject.__class__,
        pathCompleted: pathObject.isCompleted,
        lineAnchors: [lineObject.startAnchor?.objectId, lineObject.endAnchor?.objectId],
        expectedAnchors: [shape.objectIds![0], text.objectIds![0]],
        undoLine: undoLine.completed,
        lineAfterUndo: lineAfterUndo ?? null,
      };
    });

    expect(outcome.results).toEqual([true, true, true, true, true, true, true]);
    expect(outcome.shapeClass).toBe('KritzelShape');
    expect(outcome.shapeRotation).toBeCloseTo(Math.PI / 6, 5);
    expect(outcome.textContent).toContain('Note added');
    expect(outcome.pathClass).toBe('KritzelPath');
    expect(outcome.pathCompleted).toBe(true);
    expect(outcome.lineAnchors).toEqual(outcome.expectedAnchors);
    expect(outcome.undoLine).toBe(true);
    expect(outcome.lineAfterUndo).toBeNull();
  });
});
