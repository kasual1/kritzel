import { test, expect } from '../fixtures/editor.fixture';

type ActionResult = { completed: boolean; reason?: string; objectIds?: string[] };

type AgentState = {
  isAdded: boolean;
  position: { x: number; y: number } | null;
  attachedTo: { objectId: string; anchor: string } | null;
  isMoving: boolean;
  status: string | null;
  selection: string[];
  activeAction: string | null;
  queueLength: number;
  canUndo: boolean;
  canRedo: boolean;
};

type ActionOptions = { instant?: boolean; speed?: number };

/** The parts of `KritzelAgent` the tests use. Agents live in the page; only their state is returned. */
type Agent = {
  id: string;
  state: AgentState;
  on(event: string, listener: (payload: any) => void): () => void;
  moveTo(target: unknown, options?: unknown): Promise<{ completed: boolean }>;
  moveObject(objectId: string, to: unknown, options?: { align?: string } & ActionOptions): Promise<ActionResult>;
  resizeObject(objectId: string, size: { width?: number; height?: number }, options?: ActionOptions): Promise<ActionResult>;
  rotateObject(objectId: string, angle: number, options?: ActionOptions): Promise<ActionResult>;
  createShape(shape: Record<string, unknown>, options?: ActionOptions): Promise<ActionResult>;
  createText(text: Record<string, unknown>, options?: ActionOptions): Promise<ActionResult>;
  typeText(objectId: string, text: string, options?: ActionOptions): Promise<ActionResult>;
  drawPath(points: Array<{ x: number; y: number }>, options?: ActionOptions): Promise<ActionResult>;
  connect(from: string, to: string, options?: ActionOptions): Promise<ActionResult>;
  setStyle(objectIds: string[], style: Record<string, unknown>, options?: ActionOptions): Promise<ActionResult>;
  addObject(object: unknown, options?: ActionOptions): Promise<ActionResult>;
  undo(options?: ActionOptions): Promise<ActionResult>;
  cancel(): void;
  task<T>(label: string, fn: () => Promise<T>): Promise<T>;
};

type EditorElement = HTMLElement & {
  getAgents(): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent | null>;
  findObjects(predicate: (obj: any) => boolean): Promise<any[]>;
  getSelectedObjects(): Promise<Array<{ id: string }>>;
  selectObjects(objects: unknown[]): Promise<void>;
  removeObject(object: unknown): Promise<unknown>;
  updateObject(object: unknown, properties: Record<string, unknown>): Promise<unknown>;
  undo(): Promise<void>;
};

type KritzelWindow = Window & {
  __kritzel__: { KritzelShape: new (config: Record<string, unknown>) => unknown; ShapeType: Record<string, string> };
  agenticMove?: Promise<ActionResult>;
};

test.describe('Agents', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto('/advanced/agents/basic');
    await editorPage.waitForReady();
    // An async waitForFunction resolves at once (the Promise is truthy), so poll from the test.
    await expect
      .poll(() =>
        editorPage.page.evaluate(async () => {
          const editor = document.querySelector('kritzel-editor') as EditorElement;
          return (await editor.getAgents()).length;
        }),
      )
      .toBe(2);
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
      const writer = (await editor.getAgent('writer'))!;
      const [, ellipse] = await editor.findObjects(obj => obj.__class__ === 'KritzelShape');
      const move = await writer.moveTo({ objectId: ellipse.id, anchor: 'bottom-right' }, { duration: 200 });
      const attached = writer.state;
      const box = ellipse.boundingBox;

      const detached = new Promise<{ objectId: string; reason: string }>(resolve => {
        const off = writer.on('detached', event => {
          off();
          resolve(event);
        });
      });
      await editor.removeObject(ellipse);
      const detail = await detached;
      const afterRemoval = writer.state;

      return { move, attached, ellipseId: ellipse.id, expected: { x: box.x + box.width, y: box.y + box.height }, detail, afterRemoval };
    });

    expect(result.move.completed).toBe(true);
    expect(result.attached.attachedTo).toMatchObject({ objectId: result.ellipseId, anchor: 'bottom-right' });
    expect(result.attached.position?.x).toBeCloseTo(result.expected.x, 5);
    expect(result.attached.position?.y).toBeCloseTo(result.expected.y, 5);
    expect(result.detail).toEqual({ objectId: result.ellipseId, reason: 'object-removed' });
    expect(result.afterRemoval.attachedTo).toBeNull();
    expect(result.afterRemoval.position).toEqual(result.attached.position);
  });

  test('moves an object with its own undo history', async ({ editorPage }) => {
    const moved = await editorPage.page.evaluate(async () => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      const writer = (await editor.getAgent('writer'))!;
      const [rectangle, ellipse] = await editor.findObjects(obj => obj.__class__ === 'KritzelShape');
      // Agent changes keep object instances, so read the starting position before the action.
      const before = rectangle.translateX;
      const sources: unknown[] = [];
      editor.addEventListener('objectsUpdated', event => sources.push((event as CustomEvent).detail.source), { once: true });

      const result = await writer.moveObject(
        rectangle.id,
        { x: rectangle.boundingBox.x + 200, y: rectangle.boundingBox.y },
        { align: 'top-left', instant: true },
      );
      const [after] = await editor.findObjects(obj => obj.id === rectangle.id);
      return { result, rectangleId: rectangle.id, ellipseId: ellipse.id, before, after: after.translateX, source: sources[0], canUndo: writer.state.canUndo };
    });

    expect(moved.result).toEqual({ completed: true, objectIds: [moved.rectangleId] });
    expect(moved.after).toBeCloseTo(moved.before + 200, 5);
    expect(moved.source).toEqual({ type: 'agent', agentId: 'writer', actionType: 'moveObject' });
    expect(moved.canUndo).toBe(true);

    // A user edit to another object, then the user's undo: only the user's edit is reverted.
    await editorPage.waitForUndoCapture();
    const ellipseBefore = await editorPage.page.evaluate(async (ellipseId) => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      const [ellipse] = await editor.findObjects(obj => obj.id === ellipseId);
      const x = ellipse.translateX;
      await editor.updateObject(ellipse, { translateX: x + 50 });
      return x;
    }, moved.ellipseId);
    await editorPage.waitForUndoCapture();

    const afterUserUndo = await editorPage.page.evaluate(async ({ rectangleId, ellipseId }) => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      await editor.undo();
      const [rectangle] = await editor.findObjects(obj => obj.id === rectangleId);
      const [ellipse] = await editor.findObjects(obj => obj.id === ellipseId);
      return { rectangle: rectangle.translateX, ellipse: ellipse.translateX };
    }, { rectangleId: moved.rectangleId, ellipseId: moved.ellipseId });
    expect(afterUserUndo.ellipse).toBeCloseTo(ellipseBefore, 5);
    expect(afterUserUndo.rectangle).toBeCloseTo(moved.after, 5);

    // The agent's own undo reverts the move.
    const afterAgentUndo = await editorPage.page.evaluate(async (rectangleId) => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      const writer = (await editor.getAgent('writer'))!;
      const result = await writer.undo({ instant: true });
      const [rectangle] = await editor.findObjects(obj => obj.id === rectangleId);
      return { result, rectangle: rectangle.translateX, canRedo: writer.state.canRedo };
    }, moved.rectangleId);
    expect(afterAgentUndo.result.completed).toBe(true);
    expect(afterAgentUndo.rectangle).toBeCloseTo(moved.before, 5);
    expect(afterAgentUndo.canRedo).toBe(true);
  });

  test('animates an agent move and outlines the target only while running', async ({ editorPage }) => {
    const host = editorPage.page.locator('kritzel-agentic-cursors');
    await expect(host.locator('.agentic-selection')).toHaveCount(0);

    const ids = await editorPage.page.evaluate(async () => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      const planner = (await editor.getAgent('planner'))!;
      const [rectangle] = await editor.findObjects(obj => obj.__class__ === 'KritzelShape');
      const start = rectangle.translateX;
      (window as unknown as KritzelWindow).agenticMove = planner.moveObject(
        rectangle.id,
        { x: rectangle.boundingBox.x + 300, y: rectangle.boundingBox.y },
        { align: 'top-left', speed: 600 },
      );
      return { id: rectangle.id, start };
    });

    await expect(host.locator(`.agentic-selection[data-cursor-id="planner"][data-object-id="${ids.id}"]`)).toHaveCount(1);
    const result = await editorPage.page.evaluate(async () => (window as unknown as KritzelWindow).agenticMove);
    expect(result).toEqual({ completed: true, objectIds: [ids.id] });
    await expect(host.locator('.agentic-selection')).toHaveCount(0);

    const end = await editorPage.page.evaluate(async (id) => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      const [rectangle] = await editor.findObjects(obj => obj.id === id);
      return rectangle.translateX;
    }, ids.id);
    expect(end).toBeCloseTo(ids.start + 300, 5);
  });

  test('creates, types, transforms, draws and connects', async ({ editorPage }) => {
    const outcome = await editorPage.page.evaluate(async () => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      const writer = (await editor.getAgent('writer'))!;
      const instant = { instant: true };
      const byId = async (id: string) => (await editor.findObjects(obj => obj.id === id))[0];

      const shape = await writer.createShape({ x: 100, y: 400, width: 160, height: 90, text: 'Hello' }, instant);
      const text = await writer.createText({ x: 320, y: 420, text: 'Note' }, instant);
      const typed = await writer.typeText(text.objectIds![0], ' added', instant);
      const resized = await writer.resizeObject(shape.objectIds![0], { width: 240 }, instant);
      const rotated = await writer.rotateObject(shape.objectIds![0], 30, instant);
      const path = await writer.drawPath([{ x: 500, y: 400 }, { x: 560, y: 460 }, { x: 620, y: 400 }], instant);
      const line = await writer.connect(shape.objectIds![0], text.objectIds![0], instant);

      const shapeObject = await byId(shape.objectIds![0]);
      const lineObject = await byId(line.objectIds![0]);
      const pathObject = await byId(path.objectIds![0]);
      const textObject = await byId(text.objectIds![0]);
      const undoLine = await writer.undo(instant);
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

  test('attributes the objects an agent creates to the agent', async ({ editorPage }) => {
    const outcome = await editorPage.page.evaluate(async () => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      const writer = (await editor.getAgent('writer'))!;
      const sources: unknown[] = [];
      const onAdded = (event: Event) => sources.push((event as CustomEvent).detail.source);
      editor.addEventListener('objectsAdded', onAdded);

      const shape = await writer.createShape({ x: 100, y: 400, width: 160, height: 90 }, { instant: true });
      const text = await writer.createText({ x: 320, y: 420, text: 'By the writer' }, { instant: true });
      const path = await writer.drawPath([{ x: 500, y: 400 }, { x: 560, y: 460 }, { x: 620, y: 400 }], { instant: true });
      const line = await writer.connect(shape.objectIds![0], text.objectIds![0], { instant: true });
      editor.removeEventListener('objectsAdded', onAdded);

      const ids = [shape, text, path, line].map(result => result.objectIds![0]);
      const objects = await editor.findObjects(obj => ids.includes(obj.id));
      const [seed] = await editor.findObjects(obj => obj.__class__ === 'KritzelShape');
      return {
        created: ids.map(id => objects.find(obj => obj.id === id)?.userId ?? null),
        seedUserId: seed.userId ?? null,
        sources,
      };
    });

    expect(outcome.created).toEqual(['writer', 'writer', 'writer', 'writer']);
    expect(outcome.seedUserId).not.toBe('writer');
    expect(outcome.sources.length).toBeGreaterThan(0);
    for (const source of outcome.sources) {
      expect(source).toMatchObject({ type: 'agent', agentId: 'writer' });
    }
  });

  test('restyles a shape with setStyle and restores it with agent.undo', async ({ editorPage }) => {
    const outcome = await editorPage.page.evaluate(async () => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      const writer = (await editor.getAgent('writer'))!;
      const [rectangle] = await editor.findObjects(obj => obj.__class__ === 'KritzelShape');
      const styleOf = async () => {
        const [shape] = await editor.findObjects(obj => obj.id === rectangle.id);
        return JSON.parse(JSON.stringify({ fillColor: shape.fillColor, strokeWidth: shape.strokeWidth }));
      };
      const sources: unknown[] = [];
      editor.addEventListener('objectsUpdated', event => sources.push((event as CustomEvent).detail.source), { once: true });

      const before = await styleOf();
      const result = await writer.setStyle([rectangle.id], { fillColor: '#22c55e', strokeWidth: 6 }, { instant: true });
      const styled = await styleOf();
      const undo = await writer.undo({ instant: true });
      const restored = await styleOf();
      return { rectangleId: rectangle.id, before, result, styled, undo, restored, source: sources[0] };
    });

    expect(outcome.result).toEqual({ completed: true, objectIds: [outcome.rectangleId] });
    expect(outcome.source).toEqual({ type: 'agent', agentId: 'writer', actionType: 'setStyle' });
    expect(outcome.styled).toEqual({ fillColor: { light: '#22c55e', dark: '#22c55e' }, strokeWidth: 6 });
    expect(outcome.undo.completed).toBe(true);
    expect(outcome.restored).toEqual(outcome.before);
    expect(outcome.restored).not.toEqual(outcome.styled);
  });

  test("places a new shape with addObject and keeps the user's selection", async ({ editorPage }) => {
    const outcome = await editorPage.page.evaluate(async () => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      const writer = (await editor.getAgent('writer'))!;
      const { KritzelShape, ShapeType } = (window as unknown as KritzelWindow).__kritzel__;
      const [rectangle] = await editor.findObjects(obj => obj.__class__ === 'KritzelShape');
      await editor.selectObjects([rectangle]);
      const selectedBefore = (await editor.getSelectedObjects()).map(obj => obj.id);

      const shape = new KritzelShape({
        translateX: 220,
        translateY: 120,
        width: 120,
        height: 80,
        shapeType: ShapeType.Ellipse,
        fillColor: { light: '#dcfce7', dark: '#14532d' },
        strokeColor: { light: '#16a34a', dark: '#86efac' },
        strokeWidth: 3,
      });
      const result = await writer.addObject(shape, { instant: true });
      const [added] = await editor.findObjects(obj => obj.id === result.objectIds?.[0]);
      const selectedAfter = (await editor.getSelectedObjects()).map(obj => obj.id);

      const undo = await writer.undo({ instant: true });
      const afterUndo = await editor.findObjects(obj => obj.id === result.objectIds?.[0]);
      const selectedAfterUndo = (await editor.getSelectedObjects()).map(obj => obj.id);

      return {
        rectangleId: rectangle.id,
        result,
        added: added ? { class: added.__class__, userId: added.userId, translateX: added.translateX, translateY: added.translateY } : null,
        selectedBefore,
        selectedAfter,
        undo: undo.completed,
        removedByUndo: afterUndo.length === 0,
        selectedAfterUndo,
      };
    });

    expect(outcome.selectedBefore).toEqual([outcome.rectangleId]);
    expect(outcome.result.completed).toBe(true);
    expect(outcome.result.objectIds).toHaveLength(1);
    expect(outcome.added).toEqual({ class: 'KritzelShape', userId: 'writer', translateX: 220, translateY: 120 });
    expect(outcome.selectedAfter).toEqual(outcome.selectedBefore);
    expect(outcome.undo).toBe(true);
    expect(outcome.removedByUndo).toBe(true);
    expect(outcome.selectedAfterUndo).toEqual(outcome.selectedBefore);
  });

  test('throws a KritzelAgentActionError from a task when the user has the target selected', async ({ editorPage }) => {
    const outcome = await editorPage.page.evaluate(async () => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      const writer = (await editor.getAgent('writer'))!;
      const [rectangle] = await editor.findObjects(obj => obj.__class__ === 'KritzelShape');
      const before = rectangle.translateX;
      await editor.selectObjects([rectangle]);

      let statusInTask: string | null = null;
      let error: unknown = null;
      try {
        await writer.task('Moving the rectangle', async () => {
          statusInTask = writer.state.status;
          await writer.moveObject(rectangle.id, { x: 400, y: 0 }, { instant: true });
        });
      } catch (caught) {
        error = caught;
      }
      const [after] = await editor.findObjects(obj => obj.id === rectangle.id);
      const failure = error as { name?: string; reason?: string; objectIds?: string[]; action?: { type: string } } | null;
      return {
        rectangleId: rectangle.id,
        isError: error instanceof Error,
        name: failure?.name ?? null,
        reason: failure?.reason ?? null,
        objectIds: failure?.objectIds ?? null,
        actionType: failure?.action?.type ?? null,
        statusInTask,
        statusAfter: writer.state.status,
        moved: after.translateX !== before,
      };
    });

    expect(outcome).toEqual({
      rectangleId: outcome.rectangleId,
      isError: true,
      name: 'KritzelAgentActionError',
      reason: 'user-selected',
      objectIds: [outcome.rectangleId],
      actionType: 'moveObject',
      statusInTask: 'Moving the rectangle',
      statusAfter: 'Waiting…',
      moved: false,
    });
  });

  test('cancel rolls back a running move', async ({ editorPage }) => {
    test.setTimeout(60_000);
    const host = editorPage.page.locator('kritzel-agentic-cursors');
    const translateOf = (id: string) =>
      editorPage.page.evaluate(async (objectId) => {
        const editor = document.querySelector('kritzel-editor') as EditorElement;
        const [object] = await editor.findObjects(obj => obj.id === objectId);
        return { x: object.translateX as number, y: object.translateY as number };
      }, id);

    const start = await editorPage.page.evaluate(async () => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      const writer = (await editor.getAgent('writer'))!;
      const [rectangle] = await editor.findObjects(obj => obj.__class__ === 'KritzelShape');
      const position = { x: rectangle.translateX as number, y: rectangle.translateY as number };
      // Slow enough (a 2 s drag) to cancel well before the drag ends.
      (window as unknown as KritzelWindow).agenticMove = writer.moveObject(
        rectangle.id,
        { x: rectangle.boundingBox.x + 300, y: rectangle.boundingBox.y },
        { align: 'top-left', speed: 150 },
      );
      return { id: rectangle.id, position };
    });

    // Wait until the drag has visibly moved the rectangle, then cancel.
    await expect.poll(async () => (await translateOf(start.id)).x - start.position.x, { intervals: [50], timeout: 20_000 }).toBeGreaterThan(20);
    await expect(host.locator(`.agentic-selection[data-cursor-id="writer"][data-object-id="${start.id}"]`)).toHaveCount(1);

    const cancelled = await editorPage.page.evaluate(async () => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      const writer = (await editor.getAgent('writer'))!;
      const activeBefore = writer.state.activeAction;
      writer.cancel();
      const result = await (window as unknown as KritzelWindow).agenticMove;
      const { activeAction, queueLength, canUndo } = writer.state;
      return { activeBefore, result, activeAction, queueLength, canUndo };
    });

    expect(cancelled.activeBefore).toBe('moveObject');
    expect(cancelled.result).toMatchObject({ completed: false, reason: 'aborted' });
    expect(cancelled).toMatchObject({ activeAction: null, queueLength: 0, canUndo: false });
    const end = await translateOf(start.id);
    expect(end.x).toBeCloseTo(start.position.x, 5);
    expect(end.y).toBeCloseTo(start.position.y, 5);
    await expect(host.locator('.agentic-selection')).toHaveCount(0);
  });
});
