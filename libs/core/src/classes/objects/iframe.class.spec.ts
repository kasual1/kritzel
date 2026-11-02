import { KritzelIframeObject, KritzelIframeObjectLifecycleContext } from './iframe.class';
import { createIframeElementBridgeScript, IFRAME_ELEMENT_MESSAGES } from './iframe-element-bridge.script';
import { ObjectHelper } from '../../helpers/object.helper';

describe('KritzelIframeObject', () => {
  const createCore = () => ({
    store: {
      state: { activeWorkspace: { id: 'workspace-1' }, scale: 2 },
      currentZIndex: 3,
      objects: { update: jest.fn() },
    },
    user: { id: 'user-1' },
  }) as any;

  it('initializes serializable iframe content and validates sandbox tokens', () => {
    const object = new KritzelIframeObject({
      html: '<main>Test</main>',
      css: 'main { color: red; }',
      script: 'kritzel.setState({ ready: true });',
      state: { ready: false },
      title: 'Test frame',
      sandbox: ['allow-scripts', 'allow-forms', 'invalid-token', 'allow-scripts'],
      width: 320,
      height: 180,
      borderRadius: 12,
      boxShadow: '0 12px 32px rgba(32, 33, 36, 0.12)',
    });

    expect(object.html).toBe('<main>Test</main>');
    expect(object.state).toEqual({ ready: false });
    expect(object.sandbox).toEqual(['allow-scripts', 'allow-forms']);
    expect(object.sandboxAttribute).toBe('allow-scripts allow-forms');
    expect(object.width).toBe(320);
    expect(object.height).toBe(180);
    expect(object.borderRadius).toBe(12);
    expect(object.boxShadow).toBe('0 12px 32px rgba(32, 33, 36, 0.12)');
  });

  it('creates an object bound to the current core context', () => {
    const core = createCore();
    const object = KritzelIframeObject.create(core, { width: 100, height: 80 });

    expect(object._core).toBe(core);
    expect(object.workspaceId).toBe('workspace-1');
    expect(object.userId).toBe('user-1');
    expect(object.scale).toBe(2);
    expect(object.zIndex).toBe(3);
  });

  it('mounts srcdoc once and state updates do not reload the document', () => {
    const core = createCore();
    const object = KritzelIframeObject.create(core, {
      html: '<button>Run</button>',
      state: { count: 0 },
    });
    const iframe = document.createElement('iframe');

    object.mount(iframe);
    const initialSource = iframe.srcdoc;

    expect(iframe.title).toBe('Embedded content');
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts');
    expect(initialSource).toContain('<button>Run</button>');
    expect(initialSource).toContain('"count":0');
    expect(initialSource).toContain('--kritzel-iframe-default-cursor: auto');

    object.setState({ count: 1 });

    expect(object.state).toEqual({ count: 1 });
    expect(iframe.srcdoc).toBe(initialSource);
    expect(core.store.objects.update).toHaveBeenCalledWith(object);
  });

  it('uses separate Kritzel cursors for iframe content and clickable controls', () => {
    const object = new KritzelIframeObject({ html: '<button>Run</button>' });
    const iframe = document.createElement('iframe');
    const getComputedStyle = jest.spyOn(globalThis, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (property: string) => property === '--kritzel-global-default-cursor'
        ? 'url(default-cursor) 4 4, auto'
        : 'url(pointer-cursor) 12 12, auto',
    } as CSSStyleDeclaration);

    object.mount(iframe);

    expect(iframe.srcdoc).toContain('--kritzel-iframe-default-cursor: url(default-cursor) 4 4, auto');
    expect(iframe.srcdoc).toContain('--kritzel-iframe-pointer-cursor: url(pointer-cursor) 12 12, auto');
    getComputedStyle.mockRestore();
  });

  it('reloads srcdoc when content changes', () => {
    const object = KritzelIframeObject.create(createCore(), { html: '<p>Before</p>' });
    const iframe = document.createElement('iframe');
    object.mount(iframe);
    const initialSource = iframe.srcdoc;

    object.setContent({ html: '<p>After</p>', script: 'globalThis.changed = true;' });

    expect(iframe.srcdoc).not.toBe(initialSource);
    expect(iframe.srcdoc).toContain('<p>After</p>');
    expect(iframe.srcdoc).toContain('globalThis.changed = true;');
  });

  it('renders loading content when loading is enabled', () => {
    const object = new KritzelIframeObject({
      content: { html: '<main>Ready</main>', css: 'main { color: red; }', script: '' },
      loadingContent: { html: '<main>Loading</main>', css: 'main { color: gray; }', script: '' },
    });
    const iframe = document.createElement('iframe');

    object.mount(iframe);
    object.setLoading(true);

    expect(iframe.srcdoc).toContain('<main>Loading</main>');
    expect(iframe.srcdoc).toContain('main { color: gray; }');
  });

  it('escapes serialized state and closing script tags', () => {
    const object = new KritzelIframeObject({
      state: { value: '</script><script>bad()</script>' },
      script: 'const value = "</script>";',
    });
    const iframe = document.createElement('iframe');

    object.mount(iframe);

    expect(iframe.srcdoc).toContain('\\u003c/script>');
    expect(iframe.srcdoc).toContain('<\\/script>');
    expect(iframe.srcdoc).not.toContain('const value = "</script>";');
  });

  it('serializes lifecycle state and revives without transient mounting state', () => {
    class StatefulIframeObject extends KritzelIframeObject {
      protected override onSerialize(context: KritzelIframeObjectLifecycleContext): Record<string, unknown> {
        return { ...context.state, serialized: true };
      }
    }

    const object = new StatefulIframeObject({ html: '<p>Persisted</p>', state: { count: 2 } });
    const serialized = object.serialize();
    const revived = new KritzelIframeObject().deserialize<KritzelIframeObject>(serialized);

    expect(serialized.state).toEqual({ count: 2, serialized: true });
    expect(serialized).not.toHaveProperty('messageListener');
    expect(revived.html).toBe('<p>Persisted</p>');
    expect(revived.state).toEqual({ count: 2, serialized: true });
    expect(revived.isMounted).toBe(false);
  });

  it('serializes while mounted without cloning the runtime listener', () => {
    const object = new KritzelIframeObject({ state: { count: 2 } });
    object.mount(document.createElement('iframe'));

    expect(() => object.serialize()).not.toThrow();
    expect(object.serialize()).not.toHaveProperty('messageListener');
  });

  it('adopts a mounted iframe without reloading its document', () => {
    const previous = new KritzelIframeObject({ html: '<p>Mounted</p>', state: { count: 1 } });
    const iframe = document.createElement('iframe');
    previous.mount(iframe);
    previous.setIsInteractive(true);
    previous.isSelected = true;
    const source = iframe.srcdoc;

    const revived = new KritzelIframeObject({ html: '<p>Mounted</p>', state: { count: 2 } });
    revived.adoptTransientStateFrom(previous);

    expect(revived.isMounted).toBe(true);
    expect(revived.isInteractive).toBe(true);
    expect(revived.isSelected).toBe(true);
    expect(revived.elementRef).toBe(iframe);
    expect(iframe.srcdoc).toBe(source);
    expect(previous.isMounted).toBe(false);
  });

  it('bridges pointer movement at viewport scale without feeding the moved iframe position back into the coordinates', () => {
    const originalPointerEvent = globalThis.PointerEvent;
    Object.defineProperty(globalThis, 'PointerEvent', {
      configurable: true,
      value: MouseEvent,
    });
    const object = new KritzelIframeObject();
    const iframe = document.createElement('iframe');
    const dispatchEvent = jest.spyOn(iframe, 'dispatchEvent');
    let iframeLeft = 100;
    Object.defineProperties(iframe, {
      offsetWidth: { configurable: true, value: 200 },
      offsetHeight: { configurable: true, value: 100 },
    });
    jest.spyOn(iframe, 'getBoundingClientRect').mockImplementation(() => ({
      left: iframeLeft,
      top: 50,
      right: iframeLeft + 100,
      bottom: 100,
      width: 100,
      height: 50,
      x: iframeLeft,
      y: 50,
      toJSON: () => ({}),
    }));
    object.mount(iframe);

    const dispatchPointerMessage = (eventType: 'pointerdown' | 'pointermove', clientX: number, screenX: number) => {
      (object as any).dispatchPointerMessage({
        type: 'kritzel-iframe-pointer',
        eventType,
        pointerId: 1,
        pointerType: 'mouse',
        clientX,
        clientY: 20,
        screenX,
        screenY: 120,
        button: 0,
        buttons: 1,
        shiftKey: false,
        ctrlKey: false,
        altKey: false,
        metaKey: false,
      });
    };

    dispatchPointerMessage('pointerdown', 20, 220);
    iframeLeft = 110;
    dispatchPointerMessage('pointermove', 15, 225);

    const bridgedDown = dispatchEvent.mock.calls[0][0] as PointerEvent;
    const bridgedMove = dispatchEvent.mock.calls[1][0] as PointerEvent;
    expect(bridgedDown.clientX).toBe(110);
    expect(bridgedDown.clientY).toBe(60);
    expect(bridgedMove.clientX).toBe(115);
    expect(bridgedMove.clientY).toBe(60);

    Object.defineProperty(globalThis, 'PointerEvent', {
      configurable: true,
      value: originalPointerEvent,
    });
  });

  it('bridges the iframe contextmenu event so Kritzel opens its own context menu', () => {
    const object = new KritzelIframeObject();
    const iframe = document.createElement('iframe');
    const dispatchEvent = jest.spyOn(iframe, 'dispatchEvent');
    jest.spyOn(iframe, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 50,
      right: 300,
      bottom: 150,
      width: 200,
      height: 100,
      x: 100,
      y: 50,
      toJSON: () => ({}),
    });
    object.mount(iframe);

    expect(iframe.srcdoc).toContain("addEventListener('contextmenu'");
    expect(iframe.srcdoc).toContain('kritzel-iframe-contextmenu');

    (object as any).dispatchContextMenuMessage({
      type: 'kritzel-iframe-contextmenu',
      clientX: 30,
      clientY: 20,
      button: 2,
      shiftKey: false,
      ctrlKey: false,
      altKey: false,
      metaKey: false,
    });

    const bridgedContextMenu = dispatchEvent.mock.calls[0][0] as MouseEvent;
    expect(bridgedContextMenu.type).toBe('contextmenu');
    expect(bridgedContextMenu.clientX).toBe(130);
    expect(bridgedContextMenu.clientY).toBe(70);
    expect(bridgedContextMenu.button).toBe(2);
  });

  it('captures unmount state and removes runtime references', () => {
    class StatefulIframeObject extends KritzelIframeObject {
      protected override onUnmount(context: KritzelIframeObjectLifecycleContext): Record<string, unknown> {
        return { ...context.state, unmounted: true };
      }
    }

    const object = new StatefulIframeObject({ state: { count: 1 } });
    const iframe = document.createElement('iframe');
    const removeEventListener = jest.spyOn(window, 'removeEventListener');
    object.mount(iframe);

    object.unmount();

    expect(object.state).toEqual({ count: 1, unmounted: true });
    expect(object.isMounted).toBe(false);
    expect(object.getEmbeddedContentRoots()).toEqual([]);
    expect(removeEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    removeEventListener.mockRestore();
  });

  it('copies mutable state without sharing runtime resources', () => {
    const object = new KritzelIframeObject({ state: { nested: { count: 1 } }, sandbox: ['allow-scripts', 'allow-forms'] });
    const copy = object.copy();

    (copy.state.nested as { count: number }).count = 2;
    copy.sandbox.push('allow-modals');

    expect(copy.id).not.toBe(object.id);
    expect(object.state).toEqual({ nested: { count: 1 } });
    expect(object.sandbox).toEqual(['allow-scripts', 'allow-forms']);
    expect(copy.isMounted).toBe(false);
  });

  describe('element bridge', () => {
    const element = { selector: '#run', id: 'run', tagName: 'button', classList: [], attributes: {}, text: 'Run', rect: { x: 4, y: 6, width: 20, height: 10 } };

    const mountWithWindow = (object: KritzelIframeObject) => {
      const iframe = document.createElement('iframe');
      const contentWindow = { postMessage: jest.fn() };
      Object.defineProperty(iframe, 'contentWindow', { configurable: true, value: contentWindow });
      object.mount(iframe);
      const receive = (data: Record<string, unknown>) => (object as any).handleMessage({ source: contentWindow, data });
      const syncs = () => contentWindow.postMessage.mock.calls.map(call => call[0]).filter(message => message.type === IFRAME_ELEMENT_MESSAGES.sync);
      return { iframe, contentWindow, receive, syncs };
    };

    const createEngineCore = () => {
      const core = createCore();
      core.engine = { emitObjectElementHover: jest.fn(), emitObjectElementClick: jest.fn(), emitObjectElementPick: jest.fn() };
      return core;
    };

    it('runs the bridge in its own script before the author script', () => {
      const object = new KritzelIframeObject({ script: 'const marker = 1;' });
      const iframe = document.createElement('iframe');
      object.mount(iframe);

      const bridgeIndex = iframe.srcdoc.indexOf(IFRAME_ELEMENT_MESSAGES.ready);
      const authorIndex = iframe.srcdoc.indexOf('const marker = 1;');
      expect(bridgeIndex).toBeGreaterThan(-1);
      expect(bridgeIndex).toBeLessThan(authorIndex);
      expect(iframe.srcdoc.slice(bridgeIndex, authorIndex)).toContain('</script>');
      expect(iframe.srcdoc).toContain('html[data-kritzel-picking]');
    });

    it('generates a bridge script that parses and can be inlined', () => {
      const script = createIframeElementBridgeScript();

      expect(() => new Function(script)).not.toThrow();
      expect(script.toLowerCase()).not.toContain('</script');
    });

    it('is recognized as an element-aware object', () => {
      expect(ObjectHelper.isKritzelElementAwareObject(new KritzelIframeObject())).toBe(true);
      expect(ObjectHelper.isKritzelElementAwareObject({ setElementPicking: () => undefined })).toBe(false);
      expect(ObjectHelper.isKritzelElementAwareObject(null)).toBe(false);
    });

    it('sends picking and highlights once the page is ready', () => {
      const object = KritzelIframeObject.create(createCore());
      const { receive, syncs } = mountWithWindow(object);
      object.setElementPicking(true, { selector: 'button' });
      object.setElementHighlights([{ selector: '#run', label: 'Run' }]);
      expect(syncs()).toHaveLength(0);

      receive({ type: IFRAME_ELEMENT_MESSAGES.ready });

      expect(object.isElementPicking).toBe(true);
      expect(object.getElementHighlights()).toEqual([{ selector: '#run', label: 'Run' }]);
      expect(syncs()[0]).toEqual(expect.objectContaining({ picking: true, pickSelector: 'button', highlights: [{ selector: '#run', label: 'Run' }] }));
    });

    it('waits for a new ready after the document is reloaded', () => {
      const object = KritzelIframeObject.create(createCore());
      const { receive, syncs } = mountWithWindow(object);
      receive({ type: IFRAME_ELEMENT_MESSAGES.ready });
      object.setContent({ html: '<p>New</p>' });

      object.setElementHighlights([{ selector: 'p' }]);
      expect(syncs()).toHaveLength(1);

      receive({ type: IFRAME_ELEMENT_MESSAGES.ready });
      expect(syncs()).toHaveLength(2);
      expect(syncs()[1].highlights).toEqual([{ selector: 'p' }]);
    });

    it('emits hovers, clicks and picks through the engine with the object id', () => {
      const core = createEngineCore();
      const object = KritzelIframeObject.create(core);
      const { receive } = mountWithWindow(object);
      object.setIsInteractive(true);

      receive({ type: IFRAME_ELEMENT_MESSAGES.hover, element });
      receive({ type: IFRAME_ELEMENT_MESSAGES.click, element, ctrlKey: true });
      object.setElementPicking(true);
      receive({ type: IFRAME_ELEMENT_MESSAGES.pick, element });

      expect(core.engine.emitObjectElementHover).toHaveBeenCalledWith({ objectId: object.id, element: expect.objectContaining({ selector: '#run' }), isPicking: false });
      expect(core.engine.emitObjectElementClick).toHaveBeenCalledWith(expect.objectContaining({ objectId: object.id, ctrlKey: true, element: expect.objectContaining({ text: 'Run' }) }));
      expect(core.engine.emitObjectElementPick).toHaveBeenCalledWith(expect.objectContaining({ objectId: object.id, shiftKey: false }));
    });

    it('ignores element messages from other windows', () => {
      const core = createEngineCore();
      const object = KritzelIframeObject.create(core);
      mountWithWindow(object);
      object.setIsInteractive(true);

      (object as any).handleMessage({ source: {}, data: { type: IFRAME_ELEMENT_MESSAGES.hover, element } });

      expect(core.engine.emitObjectElementHover).not.toHaveBeenCalled();
    });

    it('reports that the hover ended when the object stops being interactive or unmounts', () => {
      const core = createEngineCore();
      const object = KritzelIframeObject.create(core);
      const { receive } = mountWithWindow(object);
      object.setIsInteractive(true);
      receive({ type: IFRAME_ELEMENT_MESSAGES.hover, element });

      object.setIsInteractive(false);
      expect(core.engine.emitObjectElementHover).toHaveBeenLastCalledWith({ objectId: object.id, element: null, isPicking: false });

      object.setIsInteractive(true);
      receive({ type: IFRAME_ELEMENT_MESSAGES.hover, element });
      object.unmount();
      expect(core.engine.emitObjectElementHover).toHaveBeenCalledTimes(4);
      expect(core.engine.emitObjectElementHover).toHaveBeenLastCalledWith({ objectId: object.id, element: null, isPicking: false });
    });

    it('keeps element state transient: not serialized and not copied', () => {
      const object = new KritzelIframeObject();
      object.setElementHighlights([{ selector: 'p' }]);
      object.setElementPicking(true);
      object.trackElement('p');

      expect(JSON.stringify(object.serialize())).not.toContain('Highlight');
      const copy = object.copy();
      const clone = object.clone();
      expect(copy.getElementHighlights()).toEqual([]);
      expect(copy.isElementPicking).toBe(false);
      expect(clone.getElementHighlights()).toEqual([]);
      expect(object.getElementHighlights()).toEqual([{ selector: 'p' }]);
    });

    it('hands element state to the instance that replaces it after a synced update', () => {
      const core = createEngineCore();
      const previous = KritzelIframeObject.create(core);
      const { receive, syncs } = mountWithWindow(previous);
      receive({ type: IFRAME_ELEMENT_MESSAGES.ready });
      previous.setIsInteractive(true);
      previous.setElementHighlights([{ selector: 'p' }]);
      previous.trackElement('#run');
      receive({ type: IFRAME_ELEMENT_MESSAGES.rects, rects: { '#run': element.rect } });

      const revived = new KritzelIframeObject().deserialize<KritzelIframeObject>(previous.serialize());
      revived._core = core;
      revived.adoptTransientStateFrom(previous);

      expect(revived.getElementHighlights()).toEqual([{ selector: 'p' }]);
      expect(revived.getTrackedElementRect('#run')).toEqual(element.rect);
      expect(previous.getElementHighlights()).toEqual([]);

      (revived as any).handleMessage({ source: (revived.elementRef as HTMLIFrameElement).contentWindow, data: { type: IFRAME_ELEMENT_MESSAGES.hover, element } });
      expect(core.engine.emitObjectElementHover).toHaveBeenCalledWith(expect.objectContaining({ objectId: revived.id }));

      revived.setElementHighlights([]);
      expect(syncs().pop().highlights).toEqual([]);
    });

    it('converts content coordinates to the object space using scale and border', () => {
      const object = new KritzelIframeObject({ scale: 2 });
      object.borderWidth = 4;

      expect(object.contentToObjectLocal({ x: 10, y: 20 })).toEqual({ x: 7, y: 12 });
    });

    it('queries elements through the page', async () => {
      const object = KritzelIframeObject.create(createCore());
      const { receive, contentWindow } = mountWithWindow(object);
      receive({ type: IFRAME_ELEMENT_MESSAGES.ready });

      const promise = object.queryElements('button', 5);
      const request = contentWindow.postMessage.mock.calls.map(call => call[0]).find(message => message.type === IFRAME_ELEMENT_MESSAGES.query);
      receive({ type: IFRAME_ELEMENT_MESSAGES.queryResult, requestId: request.requestId, elements: [element] });

      await expect(promise).resolves.toEqual([expect.objectContaining({ selector: '#run' })]);
      await expect(new KritzelIframeObject().queryElements('button')).rejects.toThrow('is not mounted');
    });
  });
});
