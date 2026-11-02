import {
  IFRAME_ELEMENT_QUERY_TIMEOUT,
  KritzelIframeElementBridge,
  KritzelIframeElementBridgeOwner,
  readElementInfo,
} from './iframe-element-bridge.class';
import { IFRAME_ELEMENT_MESSAGES } from './iframe-element-bridge.script';

describe('KritzelIframeElementBridge', () => {
  const element = (overrides: Record<string, unknown> = {}) => ({
    selector: '[data-kritzel-id="equals"]',
    kritzelId: 'equals',
    tagName: 'button',
    classList: ['operator'],
    attributes: { 'data-kritzel-id': 'equals', type: 'button' },
    text: '=',
    rect: { x: 10, y: 20, width: 30, height: 40 },
    visibleRect: { x: 10, y: 20, width: 30, height: 35 },
    ...overrides,
  });

  let postMessage: jest.Mock;
  let owner: KritzelIframeElementBridgeOwner & { isInteractive: boolean; isMounted: boolean; emitHover: jest.Mock; emitClick: jest.Mock; emitPick: jest.Mock };
  let bridge: KritzelIframeElementBridge;

  const sent = () => postMessage.mock.calls.map(call => call[0]);
  const lastSync = () => sent().filter(message => message.type === IFRAME_ELEMENT_MESSAGES.sync).pop();
  const ready = () => bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.ready });

  beforeEach(() => {
    postMessage = jest.fn();
    const iframe = { contentWindow: { postMessage } } as unknown as HTMLIFrameElement;
    owner = {
      id: 'frame-1',
      isInteractive: true,
      isMounted: true,
      getIframe: () => iframe,
      getContentSize: () => ({ width: 300, height: 200 }),
      emitHover: jest.fn(),
      emitClick: jest.fn(),
      emitPick: jest.fn(),
    };
    bridge = new KritzelIframeElementBridge(owner);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('state sync', () => {
    it('waits for the page to be ready and then sends the whole state', () => {
      bridge.setHighlights([{ selector: '.key', color: 'red', label: 'Keys' }]);
      bridge.setPicking(true, { selector: '[data-kritzel-id]', color: 'green' });
      bridge.track('#display');
      expect(postMessage).not.toHaveBeenCalled();

      expect(ready()).toBe(true);

      expect(lastSync()).toEqual({
        type: IFRAME_ELEMENT_MESSAGES.sync,
        interactive: true,
        picking: true,
        pickSelector: '[data-kritzel-id]',
        pickColor: 'green',
        highlights: [{ selector: '.key', color: 'red', label: 'Keys' }],
        track: ['#display'],
        theme: { color: '#007AFF', backgroundColor: 'rgba(0, 122, 255, 0.12)', labelTextColor: '#ffffff' },
      });
    });

    it('sends every change once the page is ready', () => {
      ready();
      postMessage.mockClear();

      bridge.setHighlights([{ selector: 'h2' }]);
      expect(lastSync().highlights).toEqual([{ selector: 'h2' }]);

      bridge.setPicking(false);
      expect(lastSync().picking).toBe(false);
      expect(lastSync().pickSelector).toBeNull();
    });

    it('stops sending after the document is reset until the next ready', () => {
      ready();
      bridge.onDocumentReset();
      postMessage.mockClear();

      bridge.setHighlights([{ selector: 'h2' }]);
      expect(postMessage).not.toHaveBeenCalled();

      ready();
      expect(lastSync().highlights).toEqual([{ selector: 'h2' }]);
    });

    it('reads highlight colors from the theme variables of the iframe', () => {
      const getComputedStyle = jest.spyOn(globalThis, 'getComputedStyle').mockReturnValue({
        getPropertyValue: (name: string) => ({
          '--kritzel-element-highlight-color': ' #ff00ff ',
          '--kritzel-element-highlight-background-color': 'rgba(1, 2, 3, 0.4)',
        } as Record<string, string>)[name] ?? '',
      } as CSSStyleDeclaration);

      ready();

      expect(lastSync().theme).toEqual({ color: '#ff00ff', backgroundColor: 'rgba(1, 2, 3, 0.4)', labelTextColor: '#ffffff' });
      getComputedStyle.mockRestore();
    });

    it('does not post to an unmounted iframe', () => {
      ready();
      postMessage.mockClear();
      owner.isMounted = false;

      bridge.setHighlights([{ selector: 'h2' }]);

      expect(postMessage).not.toHaveBeenCalled();
    });

    it('ignores messages that do not belong to the element bridge', () => {
      expect(bridge.handleMessage({ type: 'kritzel-iframe-state', state: {} })).toBe(false);
      expect(bridge.handleMessage({})).toBe(false);
    });
  });

  describe('validation of host input', () => {
    it('rejects invalid highlights', () => {
      expect(() => bridge.setHighlights('h2' as never)).toThrow();
      expect(() => bridge.setHighlights([{ selector: ' ' }])).toThrow();
      expect(() => bridge.setHighlights([null as never])).toThrow();
      expect(() => bridge.setHighlights(Array.from({ length: 51 }, () => ({ selector: 'p' })))).toThrow();
    });

    it('returns copies of the highlights without empty options', () => {
      bridge.setHighlights([{ selector: 'p', color: '', label: '' }]);
      const highlights = bridge.getHighlights();
      highlights[0].selector = 'changed';

      expect(bridge.getHighlights()).toEqual([{ selector: 'p' }]);
    });

    it('rejects selectors the browser cannot parse', async () => {
      // Browsers throw a SyntaxError DOMException for selectors they can't parse; the test DOM doesn't, so it is simulated.
      const invalid = new Set(['.pickable >', 'button[', '#a,,']);
      const createDocumentFragment = jest.spyOn(document, 'createDocumentFragment').mockReturnValue({
        querySelector: (selector: string) => {
          if (invalid.has(selector)) throw Object.assign(new Error(`'${selector}' is not a valid selector.`), { name: 'SyntaxError' });
          if (selector === ':unsupported-by-this-dom') throw new Error('Not supported');
          return null;
        },
      } as unknown as DocumentFragment);

      expect(() => bridge.setPicking(true, { selector: '.pickable >' })).toThrow('Invalid picking selector ".pickable >"');
      expect(() => bridge.setHighlights([{ selector: 'button[' }])).toThrow('Invalid highlight selector "button["');
      expect(() => bridge.track('#a,,')).toThrow('Invalid element selector "#a,,"');
      await expect(bridge.query('button[')).rejects.toThrow('Invalid element selector "button["');
      expect(() => bridge.setHighlights([{ selector: '[data-kritzel-id="equals"] > span:nth-of-type(2)' }])).not.toThrow();
      // Only syntax errors count: other failures of the DOM implementation must not reject valid selectors.
      expect(() => bridge.track(':unsupported-by-this-dom')).not.toThrow();
      createDocumentFragment.mockRestore();
    });

    it('rejects an invalid picking selector', () => {
      expect(() => bridge.setPicking(true, { selector: ' ' })).toThrow();
      expect(bridge.isPicking).toBe(false);
      bridge.setPicking(true, { selector: '' });
      expect(bridge.isPicking).toBe(true);
      expect(bridge.pickingOptions).toEqual({ selector: undefined, color: undefined });
    });
  });

  describe('hover, click and pick', () => {
    it('emits hovers with the picking state and ignores repeated leaves', () => {
      bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.hover, element: element() });
      expect(owner.emitHover).toHaveBeenLastCalledWith(expect.objectContaining({ selector: '[data-kritzel-id="equals"]' }), false);
      expect(bridge.hoveredElement?.tagName).toBe('button');

      bridge.setPicking(true);
      bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.hover, element: element() });
      expect(owner.emitHover).toHaveBeenLastCalledWith(expect.any(Object), true);

      bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.hover, element: null });
      bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.hover, element: null });
      expect(owner.emitHover).toHaveBeenCalledTimes(3);
      expect(owner.emitHover).toHaveBeenLastCalledWith(null, true);
    });

    it('ignores hovers while the object is not interactive and invalid elements', () => {
      owner.isInteractive = false;
      bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.hover, element: element() });
      owner.isInteractive = true;
      bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.hover, element: { selector: 'p' } });

      expect(owner.emitHover).not.toHaveBeenCalled();
    });

    it('clears the hover when the object stops being interactive', () => {
      ready();
      bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.hover, element: element() });
      owner.isInteractive = false;
      postMessage.mockClear();

      bridge.onInteractivityChange();

      expect(owner.emitHover).toHaveBeenLastCalledWith(null, false);
      expect(lastSync().interactive).toBe(false);
    });

    it('clears the hover when the document is reset or the iframe unmounts', () => {
      bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.hover, element: element() });
      bridge.onDocumentReset();
      expect(owner.emitHover).toHaveBeenLastCalledWith(null, false);

      bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.hover, element: element() });
      bridge.onUnmounted();
      expect(owner.emitHover).toHaveBeenCalledTimes(4);
      expect(owner.emitHover).toHaveBeenLastCalledWith(null, false);
    });

    it('emits clicks only while interactive and not picking', () => {
      bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.click, element: element(), shiftKey: true, metaKey: 'yes' });
      expect(owner.emitClick).toHaveBeenCalledWith(expect.objectContaining({ tagName: 'button' }), { shiftKey: true, ctrlKey: false, altKey: false, metaKey: false });

      bridge.setPicking(true);
      bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.click, element: element() });
      bridge.setPicking(false);
      owner.isInteractive = false;
      bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.click, element: element() });

      expect(owner.emitClick).toHaveBeenCalledTimes(1);
    });

    it('emits picks only while picking and interactive', () => {
      bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.pick, element: element() });
      expect(owner.emitPick).not.toHaveBeenCalled();

      bridge.setPicking(true);
      bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.pick, element: element(), altKey: true });
      expect(owner.emitPick).toHaveBeenCalledWith(expect.objectContaining({ kritzelId: 'equals' }), { shiftKey: false, ctrlKey: false, altKey: true, metaKey: false });

      owner.isInteractive = false;
      bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.pick, element: element() });
      expect(owner.emitPick).toHaveBeenCalledTimes(1);
    });

    it('emits through the owner it was handed to', () => {
      const nextOwner = { ...owner, emitClick: jest.fn() };
      bridge.attach(nextOwner);

      bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.click, element: element() });

      expect(nextOwner.emitClick).toHaveBeenCalledTimes(1);
      expect(owner.emitClick).not.toHaveBeenCalled();
    });
  });

  describe('tracking', () => {
    it('counts references and syncs only when the tracked set changes', () => {
      ready();
      postMessage.mockClear();

      bridge.track('#display');
      bridge.track('#display');
      expect(sent()).toHaveLength(1);
      expect(lastSync().track).toEqual(['#display']);

      bridge.untrack('#display');
      expect(sent()).toHaveLength(1);
      bridge.untrack('#display');
      expect(lastSync().track).toEqual([]);
      bridge.untrack('#display');
      expect(sent()).toHaveLength(2);
    });

    it('keeps the last known rect of tracked elements only', () => {
      bridge.track('#display');
      bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.rects, rects: { '#display': { x: 1, y: 2, width: 3, height: 4 }, '#other': { x: 0, y: 0, width: 1, height: 1 } } });
      expect(bridge.getRect('#display')).toEqual({ x: 1, y: 2, width: 3, height: 4 });
      expect(bridge.getRect('#other')).toBeNull();

      bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.rects, rects: { '#display': null } });
      expect(bridge.getRect('#display')).toEqual({ x: 1, y: 2, width: 3, height: 4 });

      bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.rects, rects: { '#display': { x: 'a', y: 2, width: 3, height: 4 } } });
      expect(bridge.getRect('#display')).toEqual({ x: 1, y: 2, width: 3, height: 4 });

      bridge.untrack('#display');
      expect(bridge.getRect('#display')).toBeNull();
    });

    it('keeps reported positions inside the content', () => {
      bridge.track('#a');
      bridge.track('#b');
      bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.rects, rects: { '#a': { x: 280, y: -10, width: 40, height: 30 }, '#b': { x: 5000, y: 5000, width: 10, height: 10 } } });

      expect(bridge.getRect('#a')).toEqual({ x: 280, y: 0, width: 20, height: 20 });
      expect(bridge.getRect('#b')).toBeNull();
    });

    it('rejects invalid selectors and too many tracked elements', () => {
      expect(() => bridge.track('')).toThrow();
      for (let index = 0; index < 50; index++) bridge.track(`#e${index}`);
      expect(() => bridge.track('#one-more')).toThrow();
      expect(() => bridge.track('#e1')).not.toThrow();
    });
  });

  describe('queries', () => {
    it('rejects while the object is not mounted and for invalid selectors', async () => {
      await expect(bridge.query('')).rejects.toThrow('Invalid element selector');
      owner.isMounted = false;
      await expect(bridge.query('button')).rejects.toThrow('is not mounted');
    });

    it('sends the query once the page is ready and resolves with validated elements', async () => {
      const promise = bridge.query('button', 2);
      expect(postMessage).not.toHaveBeenCalled();

      ready();
      const request = sent().find(message => message.type === IFRAME_ELEMENT_MESSAGES.query);
      expect(request).toEqual({ type: IFRAME_ELEMENT_MESSAGES.query, requestId: expect.any(Number), selector: 'button', limit: 2 });

      bridge.handleMessage({
        type: IFRAME_ELEMENT_MESSAGES.queryResult,
        requestId: request.requestId,
        elements: [element(), { selector: 'broken' }, element({ selector: 'button:nth-of-type(2)' }), element({ selector: 'button:nth-of-type(3)' })],
      });

      await expect(promise).resolves.toEqual([expect.objectContaining({ selector: '[data-kritzel-id="equals"]' })]);
    });

    it('stores the visible part of the first match as the rect of a tracked selector', async () => {
      ready();
      bridge.track('button');
      const promise = bridge.query('button', 1);
      const request = sent().find(message => message.type === IFRAME_ELEMENT_MESSAGES.query);
      bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.queryResult, requestId: request.requestId, elements: [element()] });
      await promise;

      expect(bridge.getRect('button')).toEqual({ x: 10, y: 20, width: 30, height: 35 });
    });

    it('does not store a rect for a match that cannot be seen', async () => {
      ready();
      bridge.track('button');
      const promise = bridge.query('button', 1);
      const request = sent().find(message => message.type === IFRAME_ELEMENT_MESSAGES.query);
      bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.queryResult, requestId: request.requestId, elements: [element({ visibleRect: undefined })] });

      await expect(promise).resolves.toEqual([expect.not.objectContaining({ visibleRect: expect.anything() })]);
      expect(bridge.getRect('button')).toBeNull();
    });

    it('rejects when the page reports an invalid selector', async () => {
      ready();
      const promise = bridge.query('button[');
      const request = sent().find(message => message.type === IFRAME_ELEMENT_MESSAGES.query);
      bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.queryResult, requestId: request.requestId, error: 'Invalid selector' });

      await expect(promise).rejects.toThrow('Invalid element selector "button["');
    });

    it('sends pending queries again when a new document is ready', () => {
      ready();
      void bridge.query('button');
      bridge.onDocumentReset();
      postMessage.mockClear();

      ready();

      expect(sent().filter(message => message.type === IFRAME_ELEMENT_MESSAGES.query)).toHaveLength(1);
    });

    it('rejects when the page does not respond in time', async () => {
      jest.useFakeTimers();
      ready();
      const promise = bridge.query('button');

      jest.advanceTimersByTime(IFRAME_ELEMENT_QUERY_TIMEOUT);

      await expect(promise).rejects.toThrow('did not respond');
    });

    it('rejects pending queries when the iframe unmounts and ignores late answers', async () => {
      ready();
      const promise = bridge.query('button');
      const request = sent().find(message => message.type === IFRAME_ELEMENT_MESSAGES.query);

      bridge.onUnmounted();
      bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.queryResult, requestId: request.requestId, elements: [element()] });

      await expect(promise).rejects.toThrow('was unmounted');
    });
  });
});

describe('readElementInfo', () => {
  const valid = { selector: 'p', tagName: 'P', classList: [], attributes: {}, rect: { x: 0, y: 0, width: 1, height: 1 } };

  it('accepts a minimal element and normalizes the tag name', () => {
    expect(readElementInfo(valid)).toEqual({ selector: 'p', tagName: 'p', classList: [], attributes: {}, rect: { x: 0, y: 0, width: 1, height: 1 } });
  });

  it('keeps a valid visible rect and drops an invalid one', () => {
    expect(readElementInfo({ ...valid, visibleRect: { x: 1, y: 1, width: 2, height: 2 } })?.visibleRect).toEqual({ x: 1, y: 1, width: 2, height: 2 });
    expect(readElementInfo({ ...valid, visibleRect: { x: 1, y: 1, width: -2, height: 2 } })).not.toHaveProperty('visibleRect');
  });

  it('rejects elements without selector, tag name or a valid rect', () => {
    expect(readElementInfo(null)).toBeNull();
    expect(readElementInfo([])).toBeNull();
    expect(readElementInfo({ ...valid, selector: '' })).toBeNull();
    expect(readElementInfo({ ...valid, tagName: 3 })).toBeNull();
    expect(readElementInfo({ ...valid, rect: { x: 0, y: 0, width: -1, height: 1 } })).toBeNull();
    expect(readElementInfo({ ...valid, rect: { x: Infinity, y: 0, width: 1, height: 1 } })).toBeNull();
  });

  it('drops values of the wrong type and truncates long ones', () => {
    const info = readElementInfo({
      ...valid,
      id: 'x'.repeat(1000),
      text: 42,
      classList: ['a', 3, '', 'b'],
      attributes: { role: 'button', bad: 1, ['x'.repeat(101)]: 'long name' },
    })!;

    expect(info.id).toHaveLength(500);
    expect(info.text).toBeUndefined();
    expect(info.classList).toEqual(['a', 'b']);
    expect(info.attributes).toEqual({ role: 'button' });
  });
});
