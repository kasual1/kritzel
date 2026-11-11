import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../fixtures/editor.fixture';

const ROUTE = '/advanced/dynamic-objects/iframe-elements';
const AGENT = 'agent';
const NONE = '—';

type ElementRect = { x: number; y: number; width: number; height: number };

type ElementInfo = {
  selector: string;
  kritzelId?: string;
  tagName: string;
  text?: string;
  rect: ElementRect;
};

type ElementHighlight = { selector: string; color?: string; label?: string };

type AgentState = {
  isAdded: boolean;
  status: string | null;
  position: { x: number; y: number } | null;
  attachedTo: { objectId: string; selector?: string; anchor: string } | null;
  isMoving: boolean;
};

/** The parts of `KritzelAgent` the tests use. The agent lives in the page; only its state is returned. */
type Agent = {
  id: string;
  state: AgentState;
};

type IframeObject = {
  id: string;
  __class__: string;
  scale: number;
  borderWidth?: number;
  isInteractive: boolean;
  isElementPicking: boolean;
  boundingBox: { x: number; y: number; width: number; height: number };
  getElementHighlights(): ElementHighlight[];
};

type EditorElement = HTMLElement & {
  findObjects(predicate: (obj: { __class__: string }) => boolean): Promise<IframeObject[]>;
  getAgent(id: string): Promise<Agent | null>;
  queryObjectElements(objectId: string, selector: string, limit?: number): Promise<ElementInfo[]>;
};

/** The "Team plan" card rendered by the demo's iframe object. */
function card(page: Page) {
  return page.frameLocator('iframe');
}

function cardElement(page: Page, kritzelId: string) {
  return card(page).locator(`[data-kritzel-id="${kritzelId}"]`);
}

/** Moves the real mouse to the center of an element, also inside the iframe. */
async function pointAt(page: Page, locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Element has no bounding box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
}

async function clickAt(page: Page, locator: Locator) {
  await pointAt(page, locator);
  await page.mouse.down();
  await page.mouse.up();
}

/** Snapshot of the demo's iframe object, as far as these tests need it. */
async function getPlanObjectState(page: Page) {
  return page.evaluate(async () => {
    const editor = document.querySelector('kritzel-editor') as EditorElement;
    const [object] = await editor.findObjects(obj => obj.__class__ === 'KritzelIframeObject');
    return {
      id: object.id,
      isInteractive: object.isInteractive,
      isElementPicking: object.isElementPicking,
      highlights: object.getElementHighlights(),
    };
  });
}

async function queryCardElements(page: Page, selector: string) {
  return page.evaluate(async (elementSelector) => {
    const editor = document.querySelector('kritzel-editor') as EditorElement;
    const [object] = await editor.findObjects(obj => obj.__class__ === 'KritzelIframeObject');
    return editor.queryObjectElements(object.id, elementSelector);
  }, selector);
}

test.describe('Iframe Element Interaction', () => {
  test.beforeEach(async ({ editorPage }) => {
    const { page } = editorPage;
    await editorPage.goto(ROUTE);
    await editorPage.waitForReady();

    // On ready the demo selects the card (only selected iframe objects report hovers and picks) and adds the agent.
    // An async waitForFunction resolves at once (the Promise is truthy), so poll from the test.
    await expect
      .poll(() =>
        page.evaluate(async (agentId) => {
          const editor = document.querySelector('kritzel-editor') as EditorElement;
          const [object] = await editor.findObjects(obj => obj.__class__ === 'KritzelIframeObject');
          return !!object?.isInteractive && !!(await editor.getAgent(agentId))?.state.isAdded;
        }, AGENT),
      )
      .toBe(true);

    // The page inside the iframe answers queries once it has loaded and talks to the editor.
    await expect.poll(async () => (await queryCardElements(page, '[data-kritzel-id]').catch(() => [])).length).toBeGreaterThan(0);
    await expect(cardElement(page, 'seats-count')).toHaveText('3');
  });

  test('reports hovered and clicked elements while the card is selected', async ({ editorPage }) => {
    const { page } = editorPage;
    const hovered = page.getByTestId('hovered-element');
    const clicked = page.getByTestId('clicked-element');
    await expect(hovered).toHaveText(NONE);
    await expect(clicked).toHaveText(NONE);

    await pointAt(page, cardElement(page, 'checkout'));
    await expect(hovered).toHaveText('checkout "Checkout"');

    await pointAt(page, cardElement(page, 'seats-increase'));
    await expect(hovered).toHaveText('seats-increase "+"');
    await expect(clicked).toHaveText(NONE);

    // The click is reported and still reaches the page.
    await page.mouse.down();
    await page.mouse.up();
    await expect(clicked).toHaveText('seats-increase "+"');
    await expect(cardElement(page, 'seats-count')).toHaveText('4');
    await expect(cardElement(page, 'total')).toHaveText('$48 / month');

    // Leaving the card clears the hovered element.
    await pointAt(page, page.getByTestId('toggle-picking'));
    await expect(hovered).toHaveText(NONE);
  });

  test('picks an element instead of clicking it and points the agent at it', async ({ editorPage }) => {
    const { page } = editorPage;
    const hovered = page.getByTestId('hovered-element');
    const clicked = page.getByTestId('clicked-element');
    const picked = page.getByTestId('picked-element');
    const toggle = page.getByTestId('toggle-picking');

    await page.evaluate(() => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      const picks: Array<{ objectId: string; element: ElementInfo }> = [];
      (window as unknown as { __picks: typeof picks }).__picks = picks;
      editor.addEventListener('objectElementPick', event => picks.push((event as CustomEvent).detail));
    });

    await expect(picked).toHaveText(NONE);
    await expect(toggle).toHaveText('Pick element');
    await clickAt(page, toggle);
    await expect(toggle).toHaveText('Stop picking');
    await expect.poll(async () => (await getPlanObjectState(page)).isElementPicking).toBe(true);

    // Any element can be picked, also ones without a data-kritzel-id such as the "Total" label.
    await pointAt(page, card(page).locator('.total .label'));
    await expect(hovered).toHaveText('span "Total"');

    await pointAt(page, cardElement(page, 'seats-increase'));
    await expect(hovered).toHaveText('seats-increase "+"');
    await page.mouse.down();
    await page.mouse.up();

    // The press picks the element and never reaches the page.
    await expect(picked).toHaveText('seats-increase "+"');
    await expect(toggle).toHaveText('Pick element');
    await expect.poll(async () => (await getPlanObjectState(page)).isElementPicking).toBe(false);
    await expect(clicked).toHaveText(NONE);
    await expect(cardElement(page, 'seats-count')).toHaveText('3');

    const picks = await page.evaluate(() => (window as unknown as { __picks: Array<{ objectId: string; element: ElementInfo }> }).__picks);
    expect(picks).toHaveLength(1);
    const [{ objectId, element }] = picks;
    expect(element.kritzelId).toBe('seats-increase');
    expect(element.tagName).toBe('button');

    // The picked element is highlighted.
    await expect.poll(async () => (await getPlanObjectState(page)).highlights).toEqual([{ selector: element.selector, label: 'Picked' }]);

    // The agent's cursor moves to the picked element and attaches to it.
    await expect.poll(async () => page.evaluate(async (agentId) => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      const state = (await editor.getAgent(agentId))?.state;
      return { selector: state?.attachedTo?.selector ?? null, isMoving: state?.isMoving ?? null };
    }, AGENT)).toEqual({ selector: element.selector, isMoving: false });

    const result = await page.evaluate(async ({ agentId, selector }) => {
      const editor = document.querySelector('kritzel-editor') as EditorElement;
      const [object] = await editor.findObjects(obj => obj.__class__ === 'KritzelIframeObject');
      const [target] = await editor.queryObjectElements(object.id, selector);
      const cursor = (await editor.getAgent(agentId))?.state ?? null;
      // Content coordinates (CSS pixels of the iframe) -> world units, see KritzelIframeObject.contentToObjectLocal().
      const scale = object.scale || 1;
      const inset = object.borderWidth || 0;
      const box = object.boundingBox;
      return {
        objectId: object.id,
        cursor,
        expected: {
          x: box.x + (inset + target.rect.x + target.rect.width / 2) / scale,
          y: box.y + (inset + target.rect.y + target.rect.height / 2) / scale,
        },
      };
    }, { agentId: AGENT, selector: element.selector });

    expect(objectId).toBe(result.objectId);
    expect(result.cursor?.status).toBe('Looking at seats-increase');
    expect(result.cursor?.attachedTo).toMatchObject({ objectId: result.objectId, selector: element.selector, anchor: 'center' });
    expect(result.cursor?.position?.x).toBeCloseTo(result.expected.x, 0);
    expect(result.cursor?.position?.y).toBeCloseTo(result.expected.y, 0);
  });

  test('highlights the buttons and clears the highlights', async ({ editorPage }) => {
    const { page } = editorPage;

    await clickAt(page, page.getByTestId('highlight-controls'));
    await expect.poll(async () => (await getPlanObjectState(page)).highlights).toEqual([{ selector: 'button' }]);

    await clickAt(page, page.getByTestId('clear-highlights'));
    await expect.poll(async () => (await getPlanObjectState(page)).highlights).toEqual([]);
  });

  test('queries the buttons of the card with unique selectors', async ({ editorPage }) => {
    const { page } = editorPage;
    const buttons = await queryCardElements(page, 'button');

    expect(buttons.map(button => button.kritzelId)).toEqual(['monthly', 'yearly', 'seats-decrease', 'seats-increase', 'checkout']);
    expect(buttons.every(button => button.tagName === 'button' && button.rect.width > 0 && button.rect.height > 0)).toBe(true);
    expect(buttons.find(button => button.kritzelId === 'checkout')?.text).toBe('Checkout');

    const selectors = buttons.map(button => button.selector);
    expect(new Set(selectors).size).toBe(buttons.length);

    // Every selector matches exactly the button it was reported for.
    const matches = await Promise.all(selectors.map(async selector => (await queryCardElements(page, selector)).map(match => match.kritzelId)));
    expect(matches).toEqual(buttons.map(button => [button.kritzelId]));
  });
});

test.describe('Agents using iframe elements', () => {
  /** Runs the demo's agent in the page; only serializable results come back. */
  async function withAgent<T>(page: Page, run: string): Promise<T> {
    return page.evaluate(async ({ agentId, source }) => {
      const editor = document.querySelector('kritzel-editor') as any;
      const agent = await editor.getAgent(agentId);
      const [object] = await editor.findObjects((obj: { __class__: string }) => obj.__class__ === 'KritzelIframeObject');
      return new Function('agent', 'objectId', `return (async () => { ${source} })();`)(agent, object.id);
    }, { agentId: AGENT, source: run });
  }

  test.beforeEach(async ({ editorPage }) => {
    const { page } = editorPage;
    await editorPage.goto(ROUTE);
    await editorPage.waitForReady();
    await expect.poll(() => withAgent<boolean>(page, 'return !!agent && agent.state.isAdded;')).toBe(true);
    await expect.poll(async () => (await queryCardElements(page, '[data-kritzel-id]').catch(() => [])).length).toBeGreaterThan(0);
    await expect(cardElement(page, 'seats-count')).toHaveText('3');
    // Deselect the card: agents use widgets whether or not they are selected.
    await page.keyboard.press('Escape');
    await expect.poll(async () => (await getPlanObjectState(page)).isInteractive).toBe(false);
  });

  test('clicks buttons inside the card and stays on the element', async ({ editorPage }) => {
    const { page } = editorPage;

    const result = await withAgent<any>(
      page,
      `const result = await agent.interactWithElement({ objectId, selector: '[data-kritzel-id="seats-increase"]' }, { type: 'click' });
       return { completed: result.completed, element: result.element && result.element.kritzelId, attachedTo: agent.state.attachedTo };`,
    );

    expect(result).toMatchObject({ completed: true, element: 'seats-increase', attachedTo: { selector: '[data-kritzel-id="seats-increase"]' } });
    await expect(cardElement(page, 'seats-count')).toHaveText('4');
    await expect(cardElement(page, 'total')).toHaveText('$48 / month');
    // The agent's pointer is not the user's: no hover is reported to the app.
    expect((await page.getByText('Hovered').locator('..').textContent())?.replace(/\s+/g, ' ')).toContain('—');

    await withAgent(page, `await agent.click({ objectId, selector: '[data-kritzel-id="seats-decrease"]' });`);
    await expect(cardElement(page, 'seats-count')).toHaveText('3');
  });

  test('finds and uses the elements through its tools', async ({ editorPage }) => {
    const { page } = editorPage;

    const inspected = await withAgent<any>(page, `return JSON.parse(await agent.tools().find(tool => tool.name === 'inspect_elements').run({ objectId }));`);
    expect(inspected.completed).toBe(true);
    expect(inspected.elements.map((element: { selector: string }) => element.selector)).toContain('[data-kritzel-id="yearly"]');

    const used = await withAgent<any>(
      page,
      `return JSON.parse(await agent.tools().find(tool => tool.name === 'interact_with_element').run({
         target: { objectId, selector: '[data-kritzel-id="yearly"]' },
         interaction: { type: 'click' },
       }));`,
    );
    expect(used).toMatchObject({ completed: true, element: { selector: '[data-kritzel-id="yearly"]', visible: true } });
    await expect(cardElement(page, 'total')).toHaveText('$360 / year');

    const missing = await withAgent<any>(
      page,
      `return JSON.parse(await agent.tools().find(tool => tool.name === 'interact_with_element').run({
         target: { objectId, selector: '#missing' },
         interaction: { type: 'click' },
       }));`,
    );
    expect(missing).toMatchObject({ completed: false, reason: 'element-interaction-failed', message: expect.stringContaining('No element matches') });
  });
});
