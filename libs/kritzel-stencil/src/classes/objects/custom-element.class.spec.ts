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
      expect(obj.isInteractive).toBe(true);
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
});
