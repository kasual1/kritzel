import { KritzelCustomElement } from './custom-element.class';
import { KritzelCore } from '../core/core.class';

describe('KritzelCustomElement', () => {
  let mockCore: jest.Mocked<KritzelCore>;
  let mockObjectsUpdate: jest.Mock;

  const createMockCore = (): jest.Mocked<KritzelCore> => {
    const objectsUpdate = jest.fn();
    mockObjectsUpdate = objectsUpdate;

    return {
      store: {
        state: {
          scale: 1,
          translateX: 0,
          translateY: 0,
          viewportWidth: 1000,
          viewportHeight: 800,
          objects: {
            update: objectsUpdate,
          },
          activeWorkspace: {
            id: 'workspace-1',
          },
        },
        get objects() { return this.state.objects; },
        currentZIndex: 5,
      },
    } as unknown as jest.Mocked<KritzelCore>;
  };

  const createMockElement = (): HTMLElement => {
    const el = document.createElement('div');
    el.style.width = '100px';
    el.style.height = '100px';
    return el;
  };

  beforeEach(() => {
    mockCore = createMockCore();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create with default values when no config provided', () => {
      const obj = new KritzelCustomElement();

      expect(obj.__class__).toBe('KritzelCustomElement');
      expect(obj.isInteractive).toBe(false);
      expect(obj.element).toBeUndefined();
    });

    it('should apply config values', () => {
      const element = createMockElement();
      const obj = new KritzelCustomElement({
        element,
        translateX: 10,
        translateY: 20,
        scale: 2,
        width: 100,
        height: 200,
      });

      expect(obj.element).toBe(element);
      expect(obj.translateX).toBe(10);
      expect(obj.translateY).toBe(20);
      expect(obj.scale).toBe(2);
      expect(obj.width).toBe(100);
      expect(obj.height).toBe(200);
    });

    it('should default optional config values to 0 or 1', () => {
      const element = createMockElement();
      const obj = new KritzelCustomElement({ element });

      expect(obj.element).toBe(element);
      expect(obj.translateX).toBe(0);
      expect(obj.translateY).toBe(0);
      expect(obj.scale).toBe(1);
      expect(obj.width).toBe(0);
      expect(obj.height).toBe(0);
    });

    it('should convert constructor rotation from degrees to radians', () => {
      const element = createMockElement();
      const obj = new KritzelCustomElement({
        element,
        rotation: -90,
      });

      expect(obj.rotation).toBeCloseTo(-Math.PI / 2);
    });
  });

  describe('create', () => {
    it('should create an instance with core reference and generated id', () => {
      const element = createMockElement();
      const obj = KritzelCustomElement.create(mockCore, { element }) as KritzelCustomElement;

      expect(obj).toBeInstanceOf(KritzelCustomElement);
      expect(obj.id).toBeDefined();
      expect(obj.id.length).toBeGreaterThan(0);
      expect(obj.element).toBe(element);
    });

    it('should set workspaceId from core store', () => {
      const element = createMockElement();
      const obj = KritzelCustomElement.create(mockCore, { element }) as KritzelCustomElement;

      expect(obj.workspaceId).toBe('workspace-1');
    });

    it('should pass config through to constructor', () => {
      const element = createMockElement();
      const obj = KritzelCustomElement.create(mockCore, {
        element,
        translateX: 50,
        translateY: 60,
        scale: 3,
        width: 200,
        height: 300,
      }) as KritzelCustomElement;

      expect(obj.translateX).toBe(50);
      expect(obj.translateY).toBe(60);
      expect(obj.scale).toBe(3);
      expect(obj.width).toBe(200);
      expect(obj.height).toBe(300);
    });

    it('should convert create rotation from degrees to radians', () => {
      const element = createMockElement();
      const obj = KritzelCustomElement.create(mockCore, {
        element,
        rotation: -90,
      }) as KritzelCustomElement;

      expect(obj.rotation).toBeCloseTo(-Math.PI / 2);
    });
  });

  describe('mount', () => {
    let obj: KritzelCustomElement;
    let innerElement: HTMLElement;

    beforeEach(() => {
      innerElement = createMockElement();
      obj = KritzelCustomElement.create(mockCore, { element: innerElement }) as KritzelCustomElement;
    });

    it('should mount the element into the container', () => {
      const container = document.createElement('div');

      obj.mount(container);

      expect(obj.isMounted).toBe(true);
      expect(obj.elementRef).toBe(container);
      expect(container.contains(innerElement)).toBe(true);
    });

    it('should clear existing content before appending', () => {
      const container = document.createElement('div');
      container.innerHTML = '<span>old content</span>';

      obj.mount(container);

      expect(container.children.length).toBe(1);
      expect(container.firstChild).toBe(innerElement);
    });

    it('should do nothing when element is null', () => {
      obj.mount(null as any);

      expect(obj.isMounted).toBe(false);
    });

    it('should skip remount if already mounted to the same element with content attached', () => {
      const container = document.createElement('div');

      obj.mount(container);
      const appendSpy = jest.spyOn(container, 'appendChild');

      obj.mount(container);

      expect(appendSpy).not.toHaveBeenCalled();
    });

    it('should remount if content was detached from the container', () => {
      const container = document.createElement('div');

      obj.mount(container);
      // Simulate content being removed
      container.innerHTML = '';

      obj.mount(container);

      expect(container.contains(innerElement)).toBe(true);
    });

    it('should enable embedded pointer interaction only when isInteractive is true', () => {
      const container = document.createElement('div');

      obj.isInteractive = false;
      obj.mount(container);

      expect(innerElement.style.pointerEvents).toBe('none');
      expect(innerElement.style.cursor).toBe('default');

      obj.isInteractive = true;
      obj.mount(container);

      expect(innerElement.style.pointerEvents).toBe('auto');
      expect(innerElement.style.cursor).toBe('auto');
    });

    it('should blur focused descendants when interactivity is disabled', () => {
      const container = document.createElement('div');
      const input = document.createElement('input');
      innerElement.appendChild(input);
      document.body.appendChild(container);

      obj.setIsInteractive(true);
      obj.mount(container);
      input.focus();
      expect(document.activeElement).toBe(input);

      obj.setIsInteractive(false);

      expect(document.activeElement).not.toBe(input);

      document.body.removeChild(container);
    });
  });

  describe('resize', () => {
    let obj: KritzelCustomElement;
    let innerElement: HTMLElement;

    beforeEach(() => {
      innerElement = createMockElement();
      obj = KritzelCustomElement.create(mockCore, {
        element: innerElement,
        width: 100,
        height: 100,
      }) as KritzelCustomElement;
    });

    it('should update dimensions and position', () => {
      obj.resize(10, 20, 200, 300);

      expect(obj.width).toBe(200);
      expect(obj.height).toBe(300);
      expect(obj.translateX).toBe(10);
      expect(obj.translateY).toBe(20);
    });

    it('should update the element inline styles', () => {
      obj.resize(0, 0, 150, 250);

      expect(innerElement.style.width).toBe('150px');
      expect(innerElement.style.height).toBe('250px');
    });

    it('should call objects.update to sync changes', () => {
      obj.resize(0, 0, 150, 250);

      expect(mockObjectsUpdate).toHaveBeenCalledWith(obj);
    });

    it('should not resize when width is <= 1', () => {
      obj.resize(0, 0, 1, 100);

      expect(obj.width).toBe(100); // unchanged
      expect(mockObjectsUpdate).not.toHaveBeenCalled();
    });

    it('should not resize when height is <= 1', () => {
      obj.resize(0, 0, 100, 0);

      expect(obj.height).toBe(100); // unchanged
      expect(mockObjectsUpdate).not.toHaveBeenCalled();
    });
  });

  describe('copy', () => {
    it('should return a new instance with a different id', () => {
      const innerElement = createMockElement();
      const obj = KritzelCustomElement.create(mockCore, {
        element: innerElement,
        translateX: 10,
        translateY: 20,
        width: 100,
        height: 200,
      }) as KritzelCustomElement;

      const copy = obj.copy();

      expect(copy).toBeInstanceOf(KritzelCustomElement);
      expect(copy.id).not.toBe(obj.id);
      expect(copy.translateX).toBe(10);
      expect(copy.translateY).toBe(20);
      expect(copy.width).toBe(100);
      expect(copy.height).toBe(200);
    });

    it('should set isMounted to false on the copy', () => {
      const innerElement = createMockElement();
      const obj = KritzelCustomElement.create(mockCore, { element: innerElement }) as KritzelCustomElement;
      const container = document.createElement('div');
      obj.mount(container);

      const copy = obj.copy();

      expect(obj.isMounted).toBe(true);
      expect(copy.isMounted).toBe(false);
    });

    it('should clone the HTML element', () => {
      const innerElement = createMockElement();
      innerElement.textContent = 'hello';
      const obj = KritzelCustomElement.create(mockCore, { element: innerElement }) as KritzelCustomElement;

      const copy = obj.copy();

      expect(copy.element).not.toBe(obj.element);
      expect(copy.element.textContent).toBe('hello');
    });
  });

  describe('serialization', () => {
    it('should serialize element as HTML string', () => {
      const el = document.createElement('div');
      el.textContent = 'Hello';
      const obj = KritzelCustomElement.create(mockCore, { element: el, width: 100, height: 50 }) as KritzelCustomElement;

      const serialized = obj.serialize();

      expect(serialized.htmlString).toContain('Hello');
      expect(typeof serialized.htmlString).toBe('string');
    });

    it('should serialize with dimension snapshot', () => {
      const el = document.createElement('div');
      const obj = KritzelCustomElement.create(mockCore, { element: el, width: 150, height: 75 }) as KritzelCustomElement;

      const serialized = obj.serialize();

      expect(serialized.serializedWidth).toBe(150);
      expect(serialized.serializedHeight).toBe(75);
    });

    it('should exclude _core and _elementRef from serialized output', () => {
      const el = document.createElement('div');
      const obj = KritzelCustomElement.create(mockCore, { element: el }) as KritzelCustomElement;

      const serialized = obj.serialize();

      expect(serialized).not.toHaveProperty('_core');
      expect(serialized).not.toHaveProperty('_elementRef');
    });

    it('should handle empty element', () => {
      const obj = new KritzelCustomElement();
      obj._core = mockCore;

      const serialized = obj.serialize();

      expect(serialized.htmlString).toBe('');
    });

    it('should deserialize and reconstruct element from htmlString', () => {
      const el = document.createElement('button');
      el.id = 'test-button';
      el.textContent = 'Click Me';
      const obj = KritzelCustomElement.create(mockCore, { element: el }) as KritzelCustomElement;

      const serialized = obj.serialize();
      const restored = new KritzelCustomElement();
      restored._core = mockCore;
      restored.deserialize(serialized);

      expect(restored.element).toBeDefined();
      expect(restored.element.textContent).toBe('Click Me');
    });

    it('should create placeholder on deserialize if htmlString is missing', () => {
      const obj = new KritzelCustomElement();
      obj._core = mockCore;

      obj.deserialize({});

      expect(obj.element).toBeDefined();
      expect(obj.element.textContent).toContain('[Custom Element]');
    });

    it('should create placeholder on deserialize if htmlString is invalid', () => {
      const obj = new KritzelCustomElement();
      obj._core = mockCore;

      // Test with empty htmlString fallback - temp.firstElementChild will be null
      obj.deserialize({ htmlString: '' });

      expect(obj.element).toBeDefined();
      expect(obj.element.textContent).toContain('[Custom Element]');
    });

    it('should survive serialization roundtrip with complex HTML', () => {
      const el = document.createElement('div');
      el.innerHTML = '<p><strong>Bold</strong> and <em>italic</em></p>';
      const obj = KritzelCustomElement.create(mockCore, { element: el }) as KritzelCustomElement;

      const serialized = obj.serialize();
      const restored = new KritzelCustomElement();
      restored._core = mockCore;
      restored.deserialize(serialized);

      expect(restored.element.textContent).toContain('Bold');
      expect(restored.element.textContent).toContain('italic');
    });
  });

  describe('interaction semantics', () => {
    it('should have isInteractive property defaulting to false', () => {
      const obj = new KritzelCustomElement();

      expect(obj.isInteractive).toBe(false);
    });

    it('should preserve isInteractive through serialization', () => {
      const obj = new KritzelCustomElement();
      obj.isInteractive = true;

      const serialized = obj.serialize();

      expect(serialized).not.toHaveProperty('allowEmbeddedInteraction');
      expect(serialized.isInteractive).toBe(true);
    });

    it('should ignore legacy allowEmbeddedInteraction on deserialize', () => {
      const obj = new KritzelCustomElement();
      obj._core = mockCore;

      obj.deserialize({ allowEmbeddedInteraction: true, isInteractive: false });

      expect(obj.isInteractive).toBe(false);
      expect((obj as any).allowEmbeddedInteraction).toBeUndefined();
    });
  });
});
