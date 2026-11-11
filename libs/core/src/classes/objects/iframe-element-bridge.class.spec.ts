import {
  IFRAME_ELEMENT_INTERACTION_TIMEOUT,
  IFRAME_ELEMENT_LOAD_TIMEOUT,
  IFRAME_ELEMENT_MAX_FILL_LENGTH,
  IFRAME_ELEMENT_QUERY_TIMEOUT,
  KritzelIframeElementBridge,
  KritzelIframeElementBridgeOwner,
  readElementInfo,
  readElementInteraction,
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
  // Messages of a page that runs the current document and applied the latest sync.
  const receive = (message: Record<string, unknown>) => bridge.handleMessage({ doc: bridge.documentToken, version: bridge.syncVersion, ...message });
  const ready = () => receive({ type: IFRAME_ELEMENT_MESSAGES.ready });

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
        version: 1,
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
      bridge.beginDocument();
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

    it('ignores messages of a replaced document', () => {
      ready();
      const stale = bridge.documentToken;
      bridge.beginDocument();
      postMessage.mockClear();

      bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.ready, doc: stale });
      expect(bridge.isReady).toBe(false);
      expect(postMessage).not.toHaveBeenCalled();
      expect(bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.hover, element: element(), doc: stale })).toBe(true);
      expect(owner.emitHover).not.toHaveBeenCalled();
    });

    it('treats a second ready as a reload and reports that the hover ended', () => {
      ready();
      receive({ type: IFRAME_ELEMENT_MESSAGES.hover, element: element() });
      postMessage.mockClear();

      ready();

      expect(owner.emitHover).toHaveBeenLastCalledWith(null, false);
      expect(lastSync()).toBeDefined();
    });

    it('ignores messages that do not belong to the element bridge', () => {
      expect(receive({ type: 'kritzel-iframe-state', state: {} })).toBe(false);
      expect(receive({})).toBe(false);
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
      ready();
      receive({ type: IFRAME_ELEMENT_MESSAGES.hover, element: element() });
      expect(owner.emitHover).toHaveBeenLastCalledWith(expect.objectContaining({ selector: '[data-kritzel-id="equals"]' }), false);
      expect(bridge.hoveredElement?.tagName).toBe('button');

      bridge.setPicking(true);
      receive({ type: IFRAME_ELEMENT_MESSAGES.hover, element: element() });
      expect(owner.emitHover).toHaveBeenLastCalledWith(expect.any(Object), true);

      receive({ type: IFRAME_ELEMENT_MESSAGES.hover, element: null });
      receive({ type: IFRAME_ELEMENT_MESSAGES.hover, element: null });
      expect(owner.emitHover).toHaveBeenCalledTimes(3);
      expect(owner.emitHover).toHaveBeenLastCalledWith(null, true);
    });

    it('ignores hovers while the object is not interactive and invalid elements', () => {
      owner.isInteractive = false;
      receive({ type: IFRAME_ELEMENT_MESSAGES.hover, element: element() });
      owner.isInteractive = true;
      receive({ type: IFRAME_ELEMENT_MESSAGES.hover, element: { selector: 'p' } });

      expect(owner.emitHover).not.toHaveBeenCalled();
    });

    it('clears the hover when the object stops being interactive', () => {
      ready();
      receive({ type: IFRAME_ELEMENT_MESSAGES.hover, element: element() });
      owner.isInteractive = false;
      postMessage.mockClear();

      bridge.onInteractivityChange();

      expect(owner.emitHover).toHaveBeenLastCalledWith(null, false);
      expect(lastSync().interactive).toBe(false);
    });

    it('clears the hover when the document is reset or the iframe unmounts', () => {
      receive({ type: IFRAME_ELEMENT_MESSAGES.hover, element: element() });
      bridge.beginDocument();
      expect(owner.emitHover).toHaveBeenLastCalledWith(null, false);

      receive({ type: IFRAME_ELEMENT_MESSAGES.hover, element: element() });
      bridge.onUnmounted();
      expect(owner.emitHover).toHaveBeenCalledTimes(4);
      expect(owner.emitHover).toHaveBeenLastCalledWith(null, false);
    });

    it('emits clicks only while interactive and not picking', () => {
      ready();
      receive({ type: IFRAME_ELEMENT_MESSAGES.click, element: element(), shiftKey: true, metaKey: 'yes' });
      expect(owner.emitClick).toHaveBeenCalledWith(expect.objectContaining({ tagName: 'button' }), { shiftKey: true, ctrlKey: false, altKey: false, metaKey: false });

      bridge.setPicking(true);
      receive({ type: IFRAME_ELEMENT_MESSAGES.click, element: element() });
      bridge.setPicking(false);
      owner.isInteractive = false;
      receive({ type: IFRAME_ELEMENT_MESSAGES.click, element: element() });

      expect(owner.emitClick).toHaveBeenCalledTimes(1);
    });

    it('emits picks only while picking and interactive', () => {
      ready();
      receive({ type: IFRAME_ELEMENT_MESSAGES.pick, element: element() });
      expect(owner.emitPick).not.toHaveBeenCalled();

      bridge.setPicking(true);
      receive({ type: IFRAME_ELEMENT_MESSAGES.pick, element: element(), altKey: true });
      expect(owner.emitPick).toHaveBeenCalledWith(expect.objectContaining({ kritzelId: 'equals' }), { shiftKey: false, ctrlKey: false, altKey: true, metaKey: false });

      owner.isInteractive = false;
      receive({ type: IFRAME_ELEMENT_MESSAGES.pick, element: element() });
      expect(owner.emitPick).toHaveBeenCalledTimes(1);
    });

    it('judges clicks and picks by the state the page had when the user pressed', () => {
      ready();
      const beforePicking = bridge.syncVersion;
      bridge.setPicking(true);
      const whilePicking = bridge.syncVersion;

      // The page had not applied the new state yet: the press reached the page and is a click.
      receive({ type: IFRAME_ELEMENT_MESSAGES.click, element: element(), version: beforePicking });
      receive({ type: IFRAME_ELEMENT_MESSAGES.pick, element: element(), version: beforePicking });
      expect(owner.emitClick).toHaveBeenCalledTimes(1);
      expect(owner.emitPick).not.toHaveBeenCalled();

      bridge.setPicking(false);
      // A pick of the page that still picked counts, the click it blocked never happened.
      receive({ type: IFRAME_ELEMENT_MESSAGES.pick, element: element(), version: whilePicking });
      expect(owner.emitPick).toHaveBeenCalledTimes(1);

      // Versions the host never sent are ignored.
      receive({ type: IFRAME_ELEMENT_MESSAGES.pick, element: element(), version: 999 });
      receive({ type: IFRAME_ELEMENT_MESSAGES.click, element: element(), version: 'x' });
      expect(owner.emitPick).toHaveBeenCalledTimes(1);
      expect(owner.emitClick).toHaveBeenCalledTimes(1);
    });

    it('ignores clicks and picks that cite a replaced state after a moment', () => {
      jest.useFakeTimers();
      ready();
      bridge.setPicking(true);
      const whilePicking = bridge.syncVersion;
      bridge.setPicking(false);

      jest.advanceTimersByTime(1001);
      receive({ type: IFRAME_ELEMENT_MESSAGES.pick, element: element(), version: whilePicking });
      receive({ type: IFRAME_ELEMENT_MESSAGES.click, element: element(), version: 0 });

      expect(owner.emitPick).not.toHaveBeenCalled();
      expect(owner.emitClick).not.toHaveBeenCalled();
      receive({ type: IFRAME_ELEMENT_MESSAGES.click, element: element() });
      expect(owner.emitClick).toHaveBeenCalledTimes(1);
    });

    it('accepts clicks of a freshly loaded page before it applied the first state', () => {
      ready();
      bridge.beginDocument();
      receive({ type: IFRAME_ELEMENT_MESSAGES.ready });

      receive({ type: IFRAME_ELEMENT_MESSAGES.click, element: element(), version: 0 });

      expect(owner.emitClick).toHaveBeenCalledTimes(1);
    });

    it('keeps the visible part of reported elements inside the content', () => {
      ready();
      receive({ type: IFRAME_ELEMENT_MESSAGES.click, element: element({ visibleRect: { x: -1e6, y: -1e6, width: 2e6, height: 2e6 } }) });
      receive({ type: IFRAME_ELEMENT_MESSAGES.click, element: element({ visibleRect: { x: 5000, y: 5000, width: 10, height: 10 } }) });

      expect(owner.emitClick.mock.calls[0][0].visibleRect).toEqual({ x: 0, y: 0, width: 300, height: 200 });
      expect(owner.emitClick.mock.calls[1][0]).not.toHaveProperty('visibleRect');
    });

    it('emits through the owner it was handed to', () => {
      const nextOwner = { ...owner, emitClick: jest.fn() };
      bridge.attach(nextOwner);

      receive({ type: IFRAME_ELEMENT_MESSAGES.click, element: element() });

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
      receive({ type: IFRAME_ELEMENT_MESSAGES.rects, rects: { '#display': { x: 1, y: 2, width: 3, height: 4 }, '#other': { x: 0, y: 0, width: 1, height: 1 } } });
      expect(bridge.getRect('#display')).toEqual({ x: 1, y: 2, width: 3, height: 4 });
      expect(bridge.getRect('#other')).toBeNull();

      receive({ type: IFRAME_ELEMENT_MESSAGES.rects, rects: { '#display': null } });
      expect(bridge.getRect('#display')).toEqual({ x: 1, y: 2, width: 3, height: 4 });

      receive({ type: IFRAME_ELEMENT_MESSAGES.rects, rects: { '#display': { x: 'a', y: 2, width: 3, height: 4 } } });
      expect(bridge.getRect('#display')).toEqual({ x: 1, y: 2, width: 3, height: 4 });

      bridge.untrack('#display');
      expect(bridge.getRect('#display')).toBeNull();
    });

    it('keeps reported positions inside the content', () => {
      bridge.track('#a');
      bridge.track('#b');
      receive({ type: IFRAME_ELEMENT_MESSAGES.rects, rects: { '#a': { x: 280, y: -10, width: 40, height: 30 }, '#b': { x: 5000, y: 5000, width: 10, height: 10 } } });

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
      expect(request).toEqual({
        type: IFRAME_ELEMENT_MESSAGES.query,
        requestId: expect.any(Number),
        selector: 'button',
        limit: 2,
        interactiveOnly: false,
        includeValues: false,
      });

      receive({
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
      receive({ type: IFRAME_ELEMENT_MESSAGES.queryResult, requestId: request.requestId, elements: [element()] });
      await promise;

      expect(bridge.getRect('button')).toEqual({ x: 10, y: 20, width: 30, height: 35 });
    });

    it('does not store a rect for a match that cannot be seen', async () => {
      ready();
      bridge.track('button');
      const promise = bridge.query('button', 1);
      const request = sent().find(message => message.type === IFRAME_ELEMENT_MESSAGES.query);
      receive({ type: IFRAME_ELEMENT_MESSAGES.queryResult, requestId: request.requestId, elements: [element({ visibleRect: undefined })] });

      await expect(promise).resolves.toEqual([expect.not.objectContaining({ visibleRect: expect.anything() })]);
      expect(bridge.getRect('button')).toBeNull();
    });

    it('rejects when the page reports an invalid selector', async () => {
      ready();
      const promise = bridge.query('button[');
      const request = sent().find(message => message.type === IFRAME_ELEMENT_MESSAGES.query);
      receive({ type: IFRAME_ELEMENT_MESSAGES.queryResult, requestId: request.requestId, error: 'Invalid selector' });

      await expect(promise).rejects.toThrow('Invalid element selector "button["');
    });

    it('sends pending queries again when a new document is ready', async () => {
      ready();
      const promise = bridge.query('button');
      bridge.beginDocument();
      postMessage.mockClear();

      ready();

      expect(sent().filter(message => message.type === IFRAME_ELEMENT_MESSAGES.query)).toHaveLength(1);
      bridge.onUnmounted();
      await expect(promise).rejects.toThrow('was unmounted');
    });

    it('rejects when the page does not respond in time', async () => {
      jest.useFakeTimers();
      ready();
      const promise = bridge.query('button');

      jest.advanceTimersByTime(IFRAME_ELEMENT_QUERY_TIMEOUT);

      await expect(promise).rejects.toThrow('did not respond');
    });

    it('gives a loading page more time and starts the answer timeout once the query is sent', async () => {
      jest.useFakeTimers();
      const promise = bridge.query('button');

      jest.advanceTimersByTime(IFRAME_ELEMENT_QUERY_TIMEOUT + 1000);
      ready();
      jest.advanceTimersByTime(IFRAME_ELEMENT_QUERY_TIMEOUT - 1);
      const request = sent().find(message => message.type === IFRAME_ELEMENT_MESSAGES.query);
      receive({ type: IFRAME_ELEMENT_MESSAGES.queryResult, requestId: request.requestId, elements: [element()] });

      await expect(promise).resolves.toHaveLength(1);
    });

    it('does not let a page that keeps reloading extend the timeouts', async () => {
      jest.useFakeTimers();
      ready();
      const promise = bridge.query('button');
      const settled = jest.fn();
      promise.then(settled, settled);

      for (let index = 0; index < 10; index++) {
        jest.advanceTimersByTime(IFRAME_ELEMENT_QUERY_TIMEOUT - 500);
        ready();
      }
      await Promise.resolve();

      expect(settled).toHaveBeenCalled();
      await expect(promise).rejects.toThrow('did not respond');
    });

    it('gives queries a new answer timeout when the page reloads by itself', async () => {
      jest.useFakeTimers();
      ready();
      const promise = bridge.query('button');

      jest.advanceTimersByTime(IFRAME_ELEMENT_QUERY_TIMEOUT - 100);
      ready();
      jest.advanceTimersByTime(IFRAME_ELEMENT_QUERY_TIMEOUT - 100);
      const requests = sent().filter(message => message.type === IFRAME_ELEMENT_MESSAGES.query);
      expect(requests).toHaveLength(2);
      receive({ type: IFRAME_ELEMENT_MESSAGES.queryResult, requestId: requests[1].requestId, elements: [element()] });

      await expect(promise).resolves.toHaveLength(1);
    });

    it('rejects when the page does not load in time', async () => {
      jest.useFakeTimers();
      const promise = bridge.query('button');

      jest.advanceTimersByTime(IFRAME_ELEMENT_LOAD_TIMEOUT);

      await expect(promise).rejects.toThrow('did not finish loading');
    });

    it('passes query options to the page', () => {
      ready();
      bridge.query('*', { limit: 9999, interactiveOnly: true, includeValues: true }).catch(() => undefined);

      expect(sent().find(message => message.type === IFRAME_ELEMENT_MESSAGES.query)).toMatchObject({
        selector: '*',
        limit: 500,
        interactiveOnly: true,
        includeValues: true,
      });
      bridge.onUnmounted();
    });

    it('rejects pending queries when the iframe unmounts and ignores late answers', async () => {
      ready();
      const promise = bridge.query('button');
      const request = sent().find(message => message.type === IFRAME_ELEMENT_MESSAGES.query);

      bridge.onUnmounted();
      receive({ type: IFRAME_ELEMENT_MESSAGES.queryResult, requestId: request.requestId, elements: [element()] });

      await expect(promise).rejects.toThrow('was unmounted');
    });
  });
});

describe('KritzelIframeElementBridge interactions', () => {
  const element = (overrides: Record<string, unknown> = {}) => ({
    selector: '#play',
    tagName: 'div',
    classList: ['play'],
    attributes: { 'aria-label': 'Play' },
    rect: { x: 10, y: 20, width: 40, height: 40 },
    visibleRect: { x: 10, y: 20, width: 40, height: 40 },
    ...overrides,
  });

  let postMessage: jest.Mock;
  let owner: KritzelIframeElementBridgeOwner & { isMounted: boolean };
  let bridge: KritzelIframeElementBridge;

  const sent = () => postMessage.mock.calls.map(call => call[0]);
  const requests = () => sent().filter(message => message.type === IFRAME_ELEMENT_MESSAGES.interact);
  const receive = (message: Record<string, unknown>) => bridge.handleMessage({ doc: bridge.documentToken, version: bridge.syncVersion, ...message });
  const ready = () => receive({ type: IFRAME_ELEMENT_MESSAGES.ready });
  const answer = (message: Record<string, unknown>) =>
    receive({ type: IFRAME_ELEMENT_MESSAGES.interactResult, requestId: requests()[requests().length - 1].requestId, ...message });

  beforeEach(() => {
    postMessage = jest.fn();
    const iframe = { contentWindow: { postMessage } } as unknown as HTMLIFrameElement;
    owner = {
      id: 'frame-1',
      isInteractive: false,
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

  it('sends a validated copy of the interaction once the page is ready, also while the object is not interactive', async () => {
    const promise = bridge.interact('#play', { type: 'click', extra: 'dropped' } as never);
    expect(requests()).toHaveLength(0);

    ready();
    expect(requests()).toEqual([
      { type: IFRAME_ELEMENT_MESSAGES.interact, requestId: expect.any(Number), selector: '#play', interaction: { type: 'click' }, trial: false },
    ]);
    answer({ element: element({ state: { focused: true } }) });

    await expect(promise).resolves.toEqual({ completed: true, element: expect.objectContaining({ selector: '#play', state: { focused: true } }) });
  });

  it('sends trials as trials', () => {
    ready();
    bridge.interact('#play', { type: 'hover' }, { trial: true });

    expect(requests()[0]).toMatchObject({ interaction: { type: 'hover' }, trial: true });
  });

  it('resolves refusals with a known reason, the message and the covering element', async () => {
    ready();
    const covered = bridge.interact('#play', { type: 'click' });
    answer({ failure: 'covered', message: 'Another element is on top of it.', element: element(), coveredBy: element({ selector: '.modal' }) });
    const unknown = bridge.interact('#play', { type: 'click' });
    answer({ failure: 'exploded', message: 7, coveredBy: element({ selector: '.modal' }) });

    await expect(covered).resolves.toEqual({
      completed: false,
      reason: 'covered',
      message: 'Another element is on top of it.',
      element: expect.objectContaining({ selector: '#play' }),
      coveredBy: expect.objectContaining({ selector: '.modal' }),
    });
    await expect(unknown).resolves.toEqual({ completed: false, reason: 'unavailable' });
  });

  it('keeps reported elements inside the content', async () => {
    ready();
    const promise = bridge.interact('#play', { type: 'click' });
    answer({ element: element({ visibleRect: { x: 280, y: 20, width: 100, height: 40 } }) });

    await expect(promise).resolves.toMatchObject({ element: { visibleRect: { x: 280, y: 20, width: 20, height: 40 } } });
  });

  it('rejects invalid selectors and interactions', async () => {
    await expect(bridge.interact('', { type: 'click' })).rejects.toThrow('Invalid element selector');
    await expect(bridge.interact('#a', { type: 'explode' } as never)).rejects.toThrow('Unknown interaction type');
    await expect(bridge.interact('#a', { type: 'fill' } as never)).rejects.toThrow('"value" must be a string');
    await expect(bridge.interact('#a', { type: 'scroll' })).rejects.toThrow('Give "deltaX", "deltaY" or both');
    expect(requests()).toHaveLength(0);
  });

  it('resolves as unavailable while the object is not mounted', async () => {
    owner.isMounted = false;

    await expect(bridge.interact('#play', { type: 'click' })).resolves.toMatchObject({ completed: false, reason: 'unavailable', message: expect.stringContaining('not mounted') });
  });

  it('never sends an interaction twice: it fails when the page reloads after it was sent', async () => {
    ready();
    const sentBefore = bridge.interact('#play', { type: 'click' });
    receive({ type: IFRAME_ELEMENT_MESSAGES.ready });
    const sentAfter = bridge.interact('#play', { type: 'click' });

    await expect(sentBefore).resolves.toMatchObject({ completed: false, reason: 'unavailable', message: expect.stringContaining('reloaded') });
    expect(requests()).toHaveLength(2);
    answer({});
    await expect(sentAfter).resolves.toEqual({ completed: true });
  });

  it('fails sent interactions when the content is replaced, and sends waiting ones to the new document', async () => {
    const waiting = bridge.interact('#play', { type: 'click' });
    ready();
    const first = requests()[0];
    bridge.beginDocument();
    // An answer of the replaced document is ignored.
    bridge.handleMessage({ type: IFRAME_ELEMENT_MESSAGES.interactResult, doc: bridge.documentToken - 1, requestId: first.requestId });

    await expect(waiting).resolves.toMatchObject({ completed: false, reason: 'unavailable', message: expect.stringContaining('replaced') });

    const next = bridge.interact('#play', { type: 'hover' });
    expect(requests()).toHaveLength(1);
    ready();
    expect(requests()).toHaveLength(2);
    answer({});
    await expect(next).resolves.toEqual({ completed: true });
  });

  it('resolves as unavailable when the page does not answer or load in time, or the iframe unmounts', async () => {
    jest.useFakeTimers();
    const loading = bridge.interact('#play', { type: 'click' });
    jest.advanceTimersByTime(IFRAME_ELEMENT_LOAD_TIMEOUT);
    await expect(loading).resolves.toMatchObject({ reason: 'unavailable', message: expect.stringContaining('did not finish loading') });

    ready();
    const silent = bridge.interact('#play', { type: 'click' });
    jest.advanceTimersByTime(IFRAME_ELEMENT_INTERACTION_TIMEOUT);
    await expect(silent).resolves.toMatchObject({ reason: 'unavailable', message: expect.stringContaining('did not respond') });

    const unmounted = bridge.interact('#play', { type: 'click' });
    bridge.onUnmounted();
    await expect(unmounted).resolves.toMatchObject({ reason: 'unavailable', message: expect.stringContaining('was unmounted') });
  });

  it('ignores answers to unknown requests', () => {
    ready();
    expect(receive({ type: IFRAME_ELEMENT_MESSAGES.interactResult, requestId: 999 })).toBe(true);
  });
});

describe('readElementInteraction', () => {
  it('copies the known fields of each interaction type', () => {
    expect(readElementInteraction({ type: 'click', count: 2, x: 1 })).toEqual({ type: 'click', count: 2 });
    expect(readElementInteraction({ type: 'click', count: 1 })).toEqual({ type: 'click' });
    expect(readElementInteraction({ type: 'hover', value: 'x' })).toEqual({ type: 'hover' });
    expect(readElementInteraction({ type: 'fill', value: '' })).toEqual({ type: 'fill', value: '' });
    expect(readElementInteraction({ type: 'check' })).toEqual({ type: 'check', checked: true });
    expect(readElementInteraction({ type: 'check', checked: false })).toEqual({ type: 'check', checked: false });
    expect(readElementInteraction({ type: 'press', key: 'Control+a' })).toEqual({ type: 'press', key: 'Control+a' });
    expect(readElementInteraction({ type: 'scroll', deltaY: -40 })).toEqual({ type: 'scroll', deltaX: 0, deltaY: -40 });
  });

  it('throws for invalid interactions', () => {
    expect(() => readElementInteraction(null)).toThrow('must be an object');
    expect(() => readElementInteraction({ type: 'toString' })).toThrow('Unknown interaction type');
    expect(() => readElementInteraction({ type: 'click', count: 3 })).toThrow('"count" must be 1 or 2');
    expect(() => readElementInteraction({ type: 'fill', value: 1 })).toThrow('"value" must be a string');
    expect(() => readElementInteraction({ type: 'fill', value: 'x'.repeat(IFRAME_ELEMENT_MAX_FILL_LENGTH + 1) })).toThrow('longer than');
    expect(() => readElementInteraction({ type: 'check', checked: 'yes' })).toThrow('"checked" must be a boolean');
    expect(() => readElementInteraction({ type: 'press', key: '' })).toThrow('"key"');
    expect(() => readElementInteraction({ type: 'scroll', deltaX: Infinity })).toThrow('"deltaX"');
    expect(() => readElementInteraction({ type: 'scroll', deltaX: 0, deltaY: 0 })).toThrow('Give "deltaX"');
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

  it('keeps valid state fields and string values, and drops the rest', () => {
    const info = readElementInfo({
      ...valid,
      state: { disabled: true, checked: 'mixed', focused: 'yes', editable: false, playing: true, extra: true },
      value: '',
    })!;
    expect(info.state).toEqual({ disabled: true, checked: 'mixed', editable: false, playing: true });
    expect(info.value).toBe('');

    const other = readElementInfo({ ...valid, state: { checked: 'maybe' }, value: 3 })!;
    expect(other).not.toHaveProperty('state');
    expect(other).not.toHaveProperty('value');
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
