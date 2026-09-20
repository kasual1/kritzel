import { test as base, type Page, type Locator } from '@playwright/test';

export type KritzelAlignment =
  | 'start-horizontal'
  | 'center-horizontal'
  | 'end-horizontal'
  | 'start-vertical'
  | 'center-vertical'
  | 'end-vertical';

export type KritzelToolName = 'selection' | 'brush' | 'line' | 'eraser' | 'text' | 'shape' | 'image';

/** Maps tool names to their default icon names used in the toolbar UI. */
const TOOL_ICON_MAP: Record<KritzelToolName, string> = {
  selection: 'cursor',
  brush: 'pen',
  line: 'arrow',
  eraser: 'eraser',
  text: 'type',
  shape: 'shapeRectangle',
  image: 'image',
};

export interface ViewportState {
  translateX: number;
  translateY: number;
  scale: number;
  width: number;
  height: number;
}

export interface WorldPoint {
  x: number;
  y: number;
}

export interface EditorProps {
  isToolbarVisible?: boolean;
  isUtilityPanelVisible?: boolean;
  isPanningEnabled?: boolean;
  isZoomingEnabled?: boolean;
  scaleMax?: number;
  scaleMin?: number;
  lockDrawingScale?: boolean;
  viewportBoundaryLeft?: number;
  viewportBoundaryRight?: number;
  viewportBoundaryTop?: number;
  viewportBoundaryBottom?: number;
}

export interface ThemeAwareColor {
  light: string;
  dark: string;
}

export type ShapeType = 'rectangle' | 'ellipse' | 'triangle';

export interface KritzelShapeConfig {
  shapeType?: ShapeType;
  translateX?: number;
  translateY?: number;
  rotation?: number;
  width?: number;
  height?: number;
  fillColor?: ThemeAwareColor;
  strokeColor?: ThemeAwareColor;
  strokeWidth?: number;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: ThemeAwareColor;
  scale?: number;
}

export interface KritzelPathConfig {
  points: number[][];
  translateX?: number;
  translateY?: number;
  rotation?: number;
  strokeWidth?: number;
  fill?: ThemeAwareColor;
  lineSlack?: number;
  scale?: number;
}

export interface KritzelTextConfig {
  text?: string;
  translateX?: number;
  translateY?: number;
  rotation?: number;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: ThemeAwareColor;
  width?: number;
  height?: number;
  scale?: number;
}

export interface KritzelLineConfig {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  controlX?: number;
  controlY?: number;
  translateX?: number;
  translateY?: number;
  rotation?: number;
  strokeWidth?: number;
  stroke?: ThemeAwareColor;
  scale?: number;
  opacity?: number;
  startAnchor?: { objectId: string };
  endAnchor?: { objectId: string };
  arrows?: {
    start?: { enabled: boolean; style?: string; size?: number; fill?: ThemeAwareColor };
    end?: { enabled: boolean; style?: string; size?: number; fill?: ThemeAwareColor };
  };
}

export interface KritzelImageConfig {
  src: string;
  x?: number;
  y?: number;
  translateX?: number;
  translateY?: number;
  rotation?: number;
  width?: number;
  height?: number;
  maxWidth?: number;
  maxHeight?: number;
  scale?: number;
}

export interface KritzelDynamicObjectConfig {
  html?: string;
  translateX?: number;
  translateY?: number;
  rotation?: number;
  width?: number;
  height?: number;
  backgroundColor?: ThemeAwareColor;
  borderColor?: ThemeAwareColor;
  borderWidth?: number;
  padding?: number;
  scale?: number;
  isInteractive?: boolean;
  testId?: string;
  contentText?: string;
  scrollableY?: boolean;
  scrollContentHeight?: number;
}

export type KritzelNotificationType = 'info' | 'warning' | 'error';

export interface KritzelNotificationConfig {
  type: KritzelNotificationType;
  message: string;
  id?: string;
  timestampIso?: string;
}

/**
 * Page object for the kritzel-editor web component.
 * Provides helpers to interact with the editor across all framework demos.
 *
 * The editor renders via kritzel-engine (shadow DOM) which uses SVG elements
 * inside .origin > .object divs â€” not an HTML canvas.
 *
 * Each demo app exposes Kritzel class constructors on window.__kritzel__
 * (set up in their entry points), so Playwright can create real class
 * instances inside page.evaluate().
 */
export class EditorPage {
  readonly page: Page;
  readonly editor: Locator;
  readonly engine: Locator;
  readonly origin: Locator;
  readonly toolbar: Locator;
  readonly utilityPanel: Locator;
  readonly zoomPanel: Locator;

  constructor(page: Page) {
    this.page = page;
    this.editor = page.locator('kritzel-editor');
    this.engine = page.locator('kritzel-engine');
    this.origin = page.locator('kritzel-engine >>> .origin');
    this.toolbar = page.locator('kritzel-toolbar');
    this.utilityPanel = page.locator('kritzel-utility-panel');
    this.zoomPanel = page.locator('kritzel-zoom-panel');
  }

  async goto(path = '/e2e/editor') {
    await this.page.goto(`/#${path}`);
  }

  /** Wait for the editor and engine custom elements to be defined and rendered. */
  async waitForReady() {
    await this.editor.waitFor({ state: 'attached' });
    await this.page.waitForFunction(
      () =>
        customElements.get('kritzel-editor') !== undefined &&
        customElements.get('kritzel-engine') !== undefined
    );

    // In CI the custom element can be defined before workspace initialization completes.
    // addObject() depends on an active workspace being present.
    await this.page.waitForFunction(() => {
      const editor = document.querySelector('kritzel-editor') as any;
      const engine = document.querySelector('kritzel-engine') as any;

      if (!editor || !engine) return false;
      const hasEditorApi = typeof editor.getActiveWorkspace === 'function';
      const isEngineReady = engine?.core?.store?.state?.isReady === true;
      const hasActiveWorkspace = !!engine?.core?.store?.state?.activeWorkspace;

      return hasEditorApi && isEngineReady && hasActiveWorkspace;
    }, { timeout: 15_000 });
  }

  /** Wait for the engine's drawing origin to be attached. */
  async waitForEngine() {
    await this.origin.waitFor({ state: 'attached', timeout: 15_000 });
  }

  /**
   * Wait for the engine to emit objectsAdded and then complete a paint cycle.
   * Must be called BEFORE the action that adds the object, then awaited after.
   */
  prepareWaitForObjectsAdded() {
    return this.page.evaluate(() => {
      const engine = document.querySelector('kritzel-engine');
      if (!engine) throw new Error('kritzel-engine not found');
      (window as any).__objectsAddedPromise = new Promise<void>((resolve) => {
        engine.addEventListener(
          'objectsAdded',
          () => requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          { once: true }
        );
      });
    });
  }

  /** Await the objectsAdded promise set up by prepareWaitForObjectsAdded(). */
  waitForObjectsAdded() {
    return this.page.evaluate(() => (window as any).__objectsAddedPromise);
  }

  /**
   * Set props on the kritzel-editor element.
   * Must be called after goto() and waitForReady().
   */
  async setProps(props: EditorProps) {
    await this.page.evaluate((p) => {
      const el = document.querySelector('kritzel-editor') as any;
      if (!el) throw new Error('kritzel-editor not found');
      for (const [key, value] of Object.entries(p)) {
        el[key] = value;
      }
    }, props);
  }

  /** Get the current value of a prop from the kritzel-editor element. */
  async getProp<T = unknown>(name: string): Promise<T> {
    return this.page.evaluate((propName) => {
      const el = document.querySelector('kritzel-editor') as any;
      if (!el) throw new Error('kritzel-editor not found');
      return el[propName];
    }, name);
  }

  /**
   * Call a @Method() on the kritzel-editor element.
   * Use this for any public API method (addObject, getAllObjects, etc.).
   */
  async callMethod<T = unknown>(method: string, ...args: unknown[]): Promise<T> {
    return this.page.evaluate(
      ({ method, args }) => {
        const el = document.querySelector('kritzel-editor') as any;
        if (!el) throw new Error('kritzel-editor not found');
        if (typeof el[method] !== 'function') {
          throw new Error(`kritzel-editor.${method} is not a function`);
        }
        return el[method](...args);
      },
      { method, args }
    );
  }

  // --- Object creation helpers (require loadKritzelClasses()) ---

  /** Create a KritzelShape and add it to the editor. */
  async addShape(config: KritzelShapeConfig) {
    return this.page.evaluate((cfg) => {
      const k = (window as any).__kritzel__;
      if (!k) throw new Error('Kritzel classes not loaded. Call loadKritzelClasses() first.');
      const el = document.querySelector('kritzel-editor') as any;
      if (!el?.engineRef?.core?.store?.state?.activeWorkspace) {
        throw new Error('kritzel-editor is not ready yet (no active workspace). Call waitForReady() first.');
      }
      const shape = new k.KritzelShape(cfg);
      return el.addObject(shape);
    }, config);
  }

  /** Create a KritzelPath and add it to the editor. */
  async addPath(config: KritzelPathConfig) {
    return this.page.evaluate((cfg) => {
      const k = (window as any).__kritzel__;
      if (!k) throw new Error('Kritzel classes not loaded. Call loadKritzelClasses() first.');
      const el = document.querySelector('kritzel-editor') as any;
      if (!el?.engineRef?.core?.store?.state?.activeWorkspace) {
        throw new Error('kritzel-editor is not ready yet (no active workspace). Call waitForReady() first.');
      }
      const path = new k.KritzelPath(cfg);
      return el.addObject(path);
    }, config);
  }

  /** Create a KritzelText and add it to the editor. */
  async addText(config: KritzelTextConfig) {
    return this.page.evaluate((cfg) => {
      const k = (window as any).__kritzel__;
      if (!k) throw new Error('Kritzel classes not loaded. Call loadKritzelClasses() first.');
      const el = document.querySelector('kritzel-editor') as any;
      if (!el?.engineRef?.core?.store?.state?.activeWorkspace) {
        throw new Error('kritzel-editor is not ready yet (no active workspace). Call waitForReady() first.');
      }
      const text = new k.KritzelText(cfg);
      return el.addObject(text);
    }, config);
  }

  /** Create a KritzelLine and add it to the editor. */
  async addLine(config: KritzelLineConfig) {
    return this.page.evaluate((cfg) => {
      const k = (window as any).__kritzel__;
      if (!k) throw new Error('Kritzel classes not loaded. Call loadKritzelClasses() first.');
      const el = document.querySelector('kritzel-editor') as any;
      if (!el?.engineRef?.core?.store?.state?.activeWorkspace) {
        throw new Error('kritzel-editor is not ready yet (no active workspace). Call waitForReady() first.');
      }
      const line = new k.KritzelLine(cfg);
      return el.addObject(line);
    }, config);
  }

  /** Load an image from URL and add it to the editor via KritzelImage.fromUrl(). */
  async addImage(config: KritzelImageConfig) {
    return this.page.evaluate(async (cfg) => {
      const k = (window as any).__kritzel__;
      if (!k) throw new Error('Kritzel classes not loaded. Call loadKritzelClasses() first.');
      const el = document.querySelector('kritzel-editor') as any;
      if (!el?.engineRef?.core?.store?.state?.activeWorkspace) {
        throw new Error('kritzel-editor is not ready yet (no active workspace). Call waitForReady() first.');
      }
      const image = await k.KritzelImage.fromUrl(cfg.src, cfg);
      return el.addObject(image);
    }, config);
  }

  /** Create a KritzelDynamicObject and add it to the editor. */
  async addDynamicObject(config: KritzelDynamicObjectConfig) {
    return this.page.evaluate((cfg) => {
      const k = (window as any).__kritzel__;
      if (!k) throw new Error('Kritzel classes not loaded. Call loadKritzelClasses() first.');
      const el = document.querySelector('kritzel-editor') as any;
      if (!el?.engineRef?.core?.store?.state?.activeWorkspace) {
        throw new Error('kritzel-editor is not ready yet (no active workspace). Call waitForReady() first.');
      }

      const contentRoot = document.createElement('div');
      contentRoot.style.width = '100%';
      contentRoot.style.height = '100%';
      contentRoot.style.boxSizing = 'border-box';
      contentRoot.style.background = '#f5f5f5';
      contentRoot.style.color = '#111111';
      contentRoot.style.fontFamily = 'Arial, sans-serif';
      contentRoot.style.padding = '8px';

      if (cfg.testId) {
        contentRoot.setAttribute('data-testid', cfg.testId);
      }

      if (cfg.html) {
        contentRoot.innerHTML = cfg.html;
      } else if (cfg.scrollableY) {
        contentRoot.style.overflowY = 'auto';
        const tallContent = document.createElement('div');
        tallContent.style.height = `${cfg.scrollContentHeight ?? 800}px`;
        tallContent.style.background = 'linear-gradient(#dbeafe, #bfdbfe)';
        tallContent.textContent = cfg.contentText ?? 'Scrollable custom content';
        contentRoot.appendChild(tallContent);
      } else {
        contentRoot.textContent = cfg.contentText ?? 'Custom element content';
      }

      const dynamicObject = new k.KritzelDynamicObject({
        element: contentRoot,
        translateX: cfg.translateX,
        translateY: cfg.translateY,
        rotation: cfg.rotation,
        width: cfg.width,
        height: cfg.height,
        backgroundColor: cfg.backgroundColor,
        borderColor: cfg.borderColor,
        borderWidth: cfg.borderWidth,
        padding: cfg.padding,
        scale: cfg.scale,
      });

      if (typeof cfg.isInteractive === 'boolean') {
        dynamicObject.isInteractive = cfg.isInteractive;
      }

      return el.addObject(dynamicObject);
    }, config);
  }

  // --- Query helpers ---

  /** Get all objects currently in the editor. */
  async getAllObjects<T = unknown>(): Promise<T[]> {
    return this.callMethod<T[]>('getAllObjects');
  }

  /** Get the total number of objects in the editor. */
  async getObjectsTotalCount(): Promise<number> {
    return this.callMethod<number>('getObjectsTotalCount');
  }

  /** Get all selected objects. */
  async getSelectedObjects<T = unknown>(): Promise<T[]> {
    return this.callMethod<T[]>('getSelectedObjects');
  }

  // --- Editor actions ---

  /** Select all objects in viewport. */
  async selectAllObjectsInViewport() {
    return this.callMethod('selectAllObjectsInViewport');
  }

  /** Clear selection. */
  async clearSelection() {
    return this.callMethod('clearSelection');
  }

  /** Center an object in the viewport. Looks up the real instance by ID to avoid serialization issues. */
  async centerObjectInViewport(object: Record<string, unknown>) {
    return this.page.evaluate(async (id) => {
      const el = document.querySelector('kritzel-editor') as any;
      if (!el) throw new Error('kritzel-editor not found');
      const realObject = await el.getObjectById(id);
      if (!realObject) throw new Error(`Object with id "${id}" not found`);
      return el.centerObjectInViewport(realObject);
    }, object.id as string);
  }

  /**
   * Force the Yjs UndoManager to seal the current capture group so the next
   * tracked change starts a new undo step. Call this between actions that
   * must end up in separate undo steps.
   *
   * The UndoManager uses an effectively-infinite captureTimeout, so undo
   * step boundaries are explicit; sleeping is not enough.
   */
  async waitForUndoCapture() {
    await this.page.evaluate(() => {
      const engine = document.querySelector('kritzel-engine') as any;
      engine?.core?.store?.objects?.stopUndoCapturing?.();
    });
  }

  /** Undo the last action. */
  async undo() {
    return this.callMethod('undo');
  }

  /** Redo the last undone action. */
  async redo() {
    return this.callMethod('redo');
  }

  // --- DOM locators ---

  /** Get all rendered object divs inside the engine shadow DOM. */
  getObjectElements() {
    return this.engine.locator('.object').first().locator('..');
  }

  /** Count rendered object divs inside the engine shadow DOM. */
  async getObjectElementCount(): Promise<number> {
    return this.page.evaluate(() => {
      const engine = document.querySelector('kritzel-engine');
      if (!engine?.shadowRoot) return 0;
      return engine.shadowRoot.querySelectorAll('.object').length;
    });
  }

  /** Count SVG elements inside the engine shadow DOM. */
  async getSvgElementCount(): Promise<number> {
    return this.page.evaluate(() => {
      const engine = document.querySelector('kritzel-engine');
      if (!engine?.shadowRoot) return 0;
      return engine.shadowRoot.querySelectorAll('.object svg').length;
    });
  }

  // --- Tool Activation ---

  /**
   * Click a tool button in the kritzel-toolbar shadow DOM by tool name.
  * Matches buttons via their `kritzel-icon[name]` attribute inside the toolbar.
   */
  async clickToolButton(name: KritzelToolName) {
    if (!TOOL_ICON_MAP[name]) throw new Error(`Unknown tool name: "${name}". Valid names: ${Object.keys(TOOL_ICON_MAP).join(', ')}`);

    // The shape tool uses a split-button with a separate main button testid.
    if (name === 'shape') {
      await this.page.getByTestId('tool-shape-main').click();
      return;
    }

    await this.page.getByTestId(`tool-${name}`).click();
  }

  /**
   * Activate a tool by name. Alias for clickToolButton.
   */
  async activateTool(name: KritzelToolName) {
    await this.clickToolButton(name);
  }

  /**
   * Click a shape sub-option (rectangle, ellipse, triangle) from the dropdown.
   * Opens the shape dropdown if needed, then clicks the sub-option.
   */
  async clickShapeSubOption(type: ShapeType) {
    if (!['rectangle', 'ellipse', 'triangle'].includes(type)) {
      throw new Error(`Unknown shape type: "${type}"`);
    }

    // Ensure the shape tool is active first so the dropdown trigger is visible
    const splitControl = this.page.getByTestId('tool-shape');
    const isSelected = await splitControl.evaluate(el => el.classList.contains('selected'));
    if (!isSelected) {
      await this.clickToolButton('shape');
    }

    // Click the dropdown chevron to open the submenu
    await this.page.getByTestId('tool-shape-dropdown').click();

    // Click the matching sub-option in the submenu
    await this.page.getByTestId(`suboption-${type}`).click();
  }

  /**
   * Check if a tool is currently active (has the .selected class).
   */
  async isToolActive(name: KritzelToolName): Promise<boolean> {
    const el = this.page.getByTestId(`tool-${name}`);
    if ((await el.count()) === 0) return false;
    return el.evaluate(el => el.classList.contains('selected'));
  }

  /** Change the active tool by name via the editor's public API (bypasses controls UI). */
  async setActiveTool(toolName: string) {
    return this.callMethod('setActiveTool', toolName);
  }

  // --- Utility Panel (Undo / Redo / Delete buttons) ---

  /** Click the undo button in the utility panel. */
  async clickUndo() {
    await this.page.getByTestId('utility-undo').click();
  }

  /** Click the redo button in the utility panel. */
  async clickRedo() {
    await this.page.getByTestId('utility-redo').click();
  }

  /** Click the delete button in the utility panel. */
  async clickDelete() {
    await this.page.getByTestId('utility-delete').click();
  }

  /** Check whether the undo button is enabled. */
  async isUndoEnabled(): Promise<boolean> {
    return !(await this.page.getByTestId('utility-undo').isDisabled());
  }

  /** Check whether the redo button is enabled. */
  async isRedoEnabled(): Promise<boolean> {
    return !(await this.page.getByTestId('utility-redo').isDisabled());
  }

  // --- Zoom Panel ---

  /** Get the zoom level label shown in the zoom panel. */
  async getZoomLevelText(): Promise<string> {
    return (await this.zoomPanel.locator('.zoom-level').innerText()).trim();
  }

  /** Get the numeric zoom level shown in the zoom panel. */
  async getZoomPercent(): Promise<number> {
    const zoomLevelText = await this.getZoomLevelText();
    return Number.parseInt(zoomLevelText, 10);
  }

  /** Click the zoom-in button and wait until the label updates. */
  async clickZoomIn() {
    const previousZoomPercent = await this.getZoomPercent();

    await this.zoomPanel.getByRole('button', { name: 'Zoom in' }).click();
    await this.page.waitForFunction((oldPercent) => {
      const panel = document.querySelector('kritzel-zoom-panel');
      const label = panel?.shadowRoot?.querySelector('.zoom-level')?.textContent?.trim();
      const nextPercent = label ? Number.parseInt(label, 10) : Number.NaN;
      return Number.isFinite(nextPercent) && nextPercent > oldPercent;
    }, previousZoomPercent);
    await this.page.waitForFunction(() => {
      const engine = document.querySelector('kritzel-engine') as any;
      return engine?.core?.store?.state?.isScaling === false;
    });
  }

  /** Click the zoom-out button and wait until the label updates. */
  async clickZoomOut() {
    const previousZoomPercent = await this.getZoomPercent();

    await this.zoomPanel.getByRole('button', { name: 'Zoom out' }).click();
    await this.page.waitForFunction((oldPercent) => {
      const panel = document.querySelector('kritzel-zoom-panel');
      const label = panel?.shadowRoot?.querySelector('.zoom-level')?.textContent?.trim();
      const nextPercent = label ? Number.parseInt(label, 10) : Number.NaN;
      return Number.isFinite(nextPercent) && nextPercent < oldPercent;
    }, previousZoomPercent);
    await this.page.waitForFunction(() => {
      const engine = document.querySelector('kritzel-engine') as any;
      return engine?.core?.store?.state?.isScaling === false;
    });
  }

  // --- Config Panel ---

  /** Click the config display (color circle / font preview) to open the tool config tooltip. */
  async clickConfig() {
    await this.page.getByTestId('tool-config').click();
  }

  /** Check whether the config panel is visible for the current tool. */
  async isConfigVisible(): Promise<boolean> {
    const container = this.page.getByTestId('tool-config');
    return (await container.count()) > 0;
  }

  // --- Mouse Interactions ---

  /** Get the engine element's bounding rect for screen coordinate math. */
  async getEngineBoundingBox(): Promise<{ x: number; y: number; width: number; height: number }> {
    return this.page.evaluate(() => {
      const engine = document.querySelector('kritzel-engine');
      if (!engine) throw new Error('kritzel-engine not found');
      const rect = engine.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });
  }

  /** Convert world coordinates to screen coordinates via the API. */
  async worldToScreen(x: number, y: number): Promise<WorldPoint> {
    return this.callMethod<WorldPoint>('worldToScreen', x, y);
  }

  /** Convert screen coordinates to world coordinates via the API. */
  async screenToWorld(x: number, y: number): Promise<WorldPoint> {
    return this.callMethod<WorldPoint>('screenToWorld', x, y);
  }

  /**
   * Convert world coordinates to absolute page coordinates for mouse events.
   * Combines worldToScreen + engine bounding box offset.
   */
  async worldToPage(x: number, y: number): Promise<{ pageX: number; pageY: number }> {
    const screen = await this.worldToScreen(x, y);
    const box = await this.getEngineBoundingBox();
    return { pageX: box.x + screen.x, pageY: box.y + screen.y };
  }

  /** Draw a stroke (mouse down â†’ move through points â†’ mouse up) for brush/eraser. */
  async drawStroke(worldPoints: WorldPoint[]) {
    if (worldPoints.length < 2) throw new Error('drawStroke requires at least 2 points');

    const start = await this.worldToPage(worldPoints[0].x, worldPoints[0].y);
    await this.page.mouse.move(start.pageX, start.pageY);
    await this.page.mouse.down();

    for (let i = 1; i < worldPoints.length; i++) {
      const pt = await this.worldToPage(worldPoints[i].x, worldPoints[i].y);
      await this.page.mouse.move(pt.pageX, pt.pageY, { steps: 5 });
    }

    await this.page.mouse.up();
  }

  /**
   * Draw a stroke using engine-relative SCREEN coordinates (pixels from the
   * engine's top-left), rather than world coordinates.
   *
   * At extreme zoom the worldâ†’screen mapping is degenerate (large world
   * deltas collapse to sub-pixel screen deltas), so a drawing gesture must be
   * expressed directly in screen space to be registered by the browser.
   */
  async drawStrokeScreen(screenPoints: WorldPoint[]) {
    if (screenPoints.length < 2) throw new Error('drawStrokeScreen requires at least 2 points');

    const box = await this.getEngineBoundingBox();
    await this.page.mouse.move(box.x + screenPoints[0].x, box.y + screenPoints[0].y);
    await this.page.mouse.down();

    for (let i = 1; i < screenPoints.length; i++) {
      await this.page.mouse.move(box.x + screenPoints[i].x, box.y + screenPoints[i].y, { steps: 5 });
    }

    await this.page.mouse.up();
  }

  /** Click at a world position on the engine. */
  async clickAtWorld(x: number, y: number) {
    const { pageX, pageY } = await this.worldToPage(x, y);
    await this.page.mouse.click(pageX, pageY);
  }

  /** Drag from one world position to another (for drawing shapes/lines, moving, resizing). */
  async dragFromTo(from: WorldPoint, to: WorldPoint) {
    const startPos = await this.worldToPage(from.x, from.y);
    const endPos = await this.worldToPage(to.x, to.y);
    await this.page.mouse.move(startPos.pageX, startPos.pageY);
    await this.page.mouse.down();
    await this.page.mouse.move(endPos.pageX, endPos.pageY, { steps: 10 });
    await this.page.mouse.up();
  }

  // --- Viewport ---

  /** Get current viewport state (translateX, translateY, scale, width, height). */
  async getViewport(): Promise<ViewportState> {
    return this.callMethod<ViewportState>('getViewport');
  }

  /** Set viewport position and scale. */
  async setViewport(x: number, y: number, scale: number) {
    return this.callMethod('setViewport', x, y, scale);
  }

  /**
   * Set the raw viewport state (translateX, translateY, scale) directly on the
   * engine store, without animation or clamping.
   *
   * Use this to deterministically reproduce extreme viewport positions â€” far
   * from the origin at extreme zoom â€” that the animated public setViewport()
   * API cannot express precisely (it centers on a world point and animates).
   */
  async setViewportRaw(translateX: number, translateY: number, scale: number) {
    await this.page.evaluate(
      ({ tx, ty, s }) => {
        const engine = document.querySelector('kritzel-engine') as any;
        if (!engine?.core?.store?.state) throw new Error('kritzel-engine store not available');
        const state = engine.core.store.state;
        state.scale = s;
        state.translateX = tx;
        state.translateY = ty;
        state.hasViewportChanged = true;
        engine.core.rerender();
      },
      { tx: translateX, ty: translateY, s: scale }
    );
  }

  /** Pan to world coordinates. */
  async panTo(x: number, y: number) {
    return this.callMethod('panTo', x, y);
  }

  /** Zoom to a specific scale, optionally around a world point. */
  async zoomTo(scale: number, worldX?: number, worldY?: number) {
    if (worldX !== undefined && worldY !== undefined) {
      return this.callMethod('zoomTo', scale, worldX, worldY);
    }
    return this.callMethod('zoomTo', scale);
  }

  /** Pan/zoom to fit all content. Returns true if content was found. */
  async backToContent(): Promise<boolean> {
    return this.callMethod<boolean>('backToContent');
  }

  // --- Additional Queries ---

  /** Get a single object by ID. */
  async getObjectById<T = unknown>(id: string): Promise<T | null> {
    return this.callMethod<T | null>('getObjectById', id);
  }

  /** Get all objects visible in the current viewport. */
  async getObjectsInViewport<T = unknown>(): Promise<T[]> {
    return this.callMethod<T[]>('getObjectsInViewport');
  }

  /** Find objects matching a predicate (evaluated in the browser). */
  async findObjects<T = unknown>(predicateBody: string): Promise<T[]> {
    return this.page.evaluate((body) => {
      const el = document.querySelector('kritzel-editor') as any;
      if (!el) throw new Error('kritzel-editor not found');
      const predicate = new Function('obj', body) as (obj: any) => boolean;
      return el.findObjects(predicate);
    }, predicateBody);
  }

  // --- Clipboard & Editing ---

  /** Copy selected objects. */
  async copy() {
    return this.callMethod('copy');
  }

  /** Cut selected objects (copy then delete). */
  async cut() {
    return this.callMethod('cut');
  }

  /**
   * Paste at world coordinates and wait briefly for selection/object state to settle.
   * @param settleTimeoutMs - Additional settle delay in milliseconds (default: 50).
   */
  async paste(x: number, y: number, settleTimeoutMs = 500) {
    const result = await this.callMethod('paste', x, y);
    if (settleTimeoutMs > 0) {
      await this.page.waitForTimeout(settleTimeoutMs);
    }
    return result;
  }

  /** Delete selected objects. */
  async deleteSelected() {
    return this.callMethod('delete');
  }

  /** Trigger a UI notification through the editor public API. */
  async triggerNotification(notification: KritzelNotificationConfig) {
    return this.page.evaluate(({ type, message, id, timestampIso }) => {
      const editor = document.querySelector('kritzel-editor') as any;
      if (!editor) throw new Error('kritzel-editor not found');

      return editor.triggerNotification({
        type,
        message,
        id,
        timestamp: timestampIso ? new Date(timestampIso) : undefined,
      });
    }, notification);
  }

  // --- System clipboard simulation ---

  /**
   * Simulate copying the current selection to the OS clipboard.
   * Dispatches a synthetic `copy` ClipboardEvent and returns the serialized
   * Kritzel payload that the engine wrote into the event's clipboardData.
   * The returned string can be handed to another tab/editor to simulate a
   * cross-tab paste via the system clipboard.
   */
  async copyToSystemClipboard(): Promise<string> {
    return this.page.evaluate(() => {
      const dataTransfer = new DataTransfer();
      window.dispatchEvent(
        new ClipboardEvent('copy', { clipboardData: dataTransfer, bubbles: true, cancelable: true })
      );
      return dataTransfer.getData('text/plain');
    });
  }

  /** Clear the browser system clipboard text payload. */
  async clearSystemClipboard() {
    await this.page.evaluate(async () => {
      if (!navigator.clipboard?.writeText) return;
      await navigator.clipboard.writeText('');
    });
  }

  /** Simulate blocked browser clipboard-read permission for the current page. */
  async blockClipboardReadPermission() {
    await this.page.evaluate(() => {
      const engine = document.querySelector('kritzel-engine') as any;
      if (!engine?.core?.permissionManager) {
        throw new Error('kritzel-engine permission manager is not available');
      }

      engine.core.permissionManager.registerRequestPermissionHandler('clipboard-read', async () => 'denied');
    });
  }

  /**
   * Simulate pasting an image file from the OS clipboard by dispatching a
   * synthetic `paste` ClipboardEvent whose clipboardData carries a File.
   * A deterministic solid-color PNG is drawn on a canvas so screenshots are stable.
   */
  async pasteImageFileFromSystemClipboard(options?: { width?: number; height?: number; color?: string }) {
    return this.page.evaluate(
      async ({ width, height, color }) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get 2D canvas context');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);

        const blob: Blob | null = await new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/png'));
        if (!blob) throw new Error('Failed to create image blob');

        const file = new File([blob], 'pasted-image.png', { type: 'image/png' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        window.dispatchEvent(
          new ClipboardEvent('paste', { clipboardData: dataTransfer, bubbles: true, cancelable: true })
        );
      },
      { width: options?.width ?? 200, height: options?.height ?? 150, color: options?.color ?? '#4a90d9' }
    );
  }

  /**
   * Simulate pasting plain text from the OS clipboard by dispatching a
   * synthetic `paste` ClipboardEvent whose clipboardData carries text/plain.
   */
  async pasteTextFromSystemClipboard(text: string) {
    return this.page.evaluate(value => {
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text/plain', value);
      window.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: dataTransfer, bubbles: true, cancelable: true })
      );
    }, text);
  }

  /**
   * Simulate pasting a previously copied Kritzel payload from the OS clipboard
   * by dispatching a synthetic `paste` ClipboardEvent whose clipboardData
   * carries the serialized payload as text/plain. Use together with
   * copyToSystemClipboard() to simulate a cross-tab object transfer.
   */
  async pasteKritzelPayloadFromSystemClipboard(payload: string) {
    return this.page.evaluate(value => {
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text/plain', value);
      window.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: dataTransfer, bubbles: true, cancelable: true })
      );
    }, payload);
  }

  // --- Ordering ---

  /** Move selected object forward one z-level. */
  async bringForward() {
    return this.callMethod('bringForward');
  }

  /** Move selected object backward one z-level. */
  async sendBackward() {
    return this.callMethod('sendBackward');
  }

  /** Move selected object to the very front. */
  async bringToFront() {
    return this.callMethod('bringToFront');
  }

  /** Move selected object to the very back. */
  async sendToBack() {
    return this.callMethod('sendToBack');
  }

  // --- Alignment & Grouping ---

  /** Align selected objects (6 alignment modes). */
  async alignObjects(alignment: KritzelAlignment) {
    return this.callMethod('alignObjects', alignment);
  }

  /** Group selected objects. */
  async group() {
    return this.callMethod('group');
  }

  /** Ungroup selected group. */
  async ungroup() {
    return this.callMethod('ungroup');
  }

  // --- Selection ---

  /** Programmatically select objects by passing them to selectObjects. */
  async selectObjects(objects: Record<string, unknown>[]) {
    return this.callMethod('selectObjects', objects);
  }

  /** Trigger the selection change event. */
  async triggerSelectionChange() {
    return this.callMethod('triggerSelectionChange');
  }

  // --- Line Handles ---

  /**
   * Get the page-absolute center position of a line handle (start, end, or center).
   * Uses the data-testid attributes on the overlay circles and getBoundingClientRect
   * for reliable positioning regardless of SVG transforms.
   */
  async getLineHandlePosition(handleType: 'start' | 'end' | 'center'): Promise<{ pageX: number; pageY: number }> {
    const testId = `line-handle-${handleType}`;
    return this.page.evaluate((id) => {
      const engine = document.querySelector('kritzel-engine');
      if (!engine?.shadowRoot) throw new Error('kritzel-engine shadow root not found');
      const overlay = engine.shadowRoot.querySelector(`[data-testid="${id}"]`);
      if (!overlay) throw new Error(`Line handle overlay "${id}" not found`);
      const rect = overlay.getBoundingClientRect();
      return { pageX: rect.x + rect.width / 2, pageY: rect.y + rect.height / 2 };
    }, testId);
  }

  /**
   * Drag a line handle from its current position by a given pixel delta.
   * The line must be selected so that handles are visible.
   */
  async dragLineHandle(handleType: 'start' | 'end' | 'center', deltaX: number, deltaY: number) {
    const { pageX, pageY } = await this.getLineHandlePosition(handleType);
    await this.page.mouse.move(pageX, pageY);
    await this.page.mouse.down();
    await this.page.mouse.move(pageX + deltaX, pageY + deltaY, { steps: 10 });
    await this.page.mouse.up();
  }

  // --- Events ---

  /**
   * Set up a listener for any editor/engine event.
   * Must be called BEFORE the action that triggers the event.
   */
  async prepareWaitForEvent(name: string) {
    await this.page.evaluate((eventName) => {
      const editor = document.querySelector('kritzel-editor');
      if (!editor) throw new Error('kritzel-editor not found');
      (window as any).__eventPromise = new Promise<any>((resolve) => {
        editor.addEventListener(
          eventName,
          (e: any) => {
            const detail = e.detail;
            // Serialize to a plain object to avoid crossing the page boundary with class instances
            resolve(JSON.parse(JSON.stringify(detail ?? null)));
          },
          { once: true }
        );
      });
    }, name);
  }

  /** Await the event set up by prepareWaitForEvent(). */
  async waitForEvent<T = unknown>(): Promise<T> {
    return this.page.evaluate(() => (window as any).__eventPromise);
  }

  // --- Enable/Disable ---

  /** Disable the editor. */
  async disable() {
    return this.callMethod('disable');
  }

  /** Re-enable the editor. */
  async enable() {
    return this.callMethod('enable');
  }

  // --- Export ---

  /** Get a screenshot as a data URL. */
  async getScreenshot(format: 'png' | 'svg' = 'png'): Promise<string> {
    return this.callMethod<string>('getScreenshot', format);
  }

  // --- Workspaces ---

  /** Get the active workspace. */
  async getActiveWorkspace<T = unknown>(): Promise<T> {
    return this.callMethod<T>('getActiveWorkspace');
  }

  /** Create a new workspace. */
  async createWorkspace(workspace: Record<string, unknown>) {
    return this.callMethod('createWorkspace', workspace);
  }

  /** Get all workspaces. */
  async getWorkspaces<T = unknown>(): Promise<T[]> {
    return this.callMethod<T[]>('getWorkspaces');
  }

  /** Update a workspace. */
  async updateWorkspace(workspace: Record<string, unknown>) {
    return this.callMethod('updateWorkspace', workspace);
  }

  /** Delete a workspace. */
  async deleteWorkspace(workspace: Record<string, unknown>) {
    return this.callMethod('deleteWorkspace', workspace);
  }

  // --- Object Update/Remove helpers ---

  /** Update properties of an existing object. Looks up the real instance by ID to avoid serialization issues. */
  async updateObject(object: Record<string, unknown>, updatedProperties: Record<string, unknown>) {
    return this.page.evaluate(
      async ({ id, props }) => {
        const el = document.querySelector('kritzel-editor') as any;
        if (!el) throw new Error('kritzel-editor not found');
        const realObject = await el.getObjectById(id);
        if (!realObject) throw new Error(`Object with id "${id}" not found`);
        return el.updateObject(realObject, props);
      },
      { id: object.id as string, props: updatedProperties }
    );
  }

  /** Remove an object from the canvas. Looks up the real instance by ID to avoid serialization issues. */
  async removeObject(object: Record<string, unknown>) {
    return this.page.evaluate(async (id) => {
      const el = document.querySelector('kritzel-editor') as any;
      if (!el) throw new Error('kritzel-editor not found');
      const realObject = await el.getObjectById(id);
      if (!realObject) throw new Error(`Object with id "${id}" not found`);
      return el.removeObject(realObject);
    }, object.id as string);
  }
}

export const test = base.extend<{ editorPage: EditorPage }>({
  editorPage: async ({ page }, use) => {
    const editorPage = new EditorPage(page);
    await use(editorPage);
  },
});

export { expect } from '@playwright/test';
