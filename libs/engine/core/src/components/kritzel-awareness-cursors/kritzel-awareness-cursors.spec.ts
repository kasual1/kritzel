jest.mock('@stencil/core', () => ({
  ...jest.requireActual('@stencil/core/internal/testing'),
  Component: () => (cls: any) => cls,
  Prop: () => () => {},
  State: () => () => {},
}));

class MockKritzelPath { }
class MockKritzelLine { }
class MockKritzelShape { }

jest.mock('../../classes/objects/path.class', () => ({
  KritzelPath: MockKritzelPath,
}));
jest.mock('../../classes/objects/line.class', () => ({
  KritzelLine: MockKritzelLine,
}));
jest.mock('../../classes/objects/shape.class', () => ({
  KritzelShape: MockKritzelShape,
}));

import { KritzelAwarenessCursors } from './kritzel-awareness-cursors';
import { KritzelCore } from '../../classes/core/core.class';

describe('KritzelAwarenessCursors', () => {
  let component: KritzelAwarenessCursors;
  let mockCore: KritzelCore;

  const createMockCore = (overrides: Partial<{
    scale: number;
    translateX: number;
    translateY: number;
    viewportWidth: number;
    viewportHeight: number;
    localClientId: number | null;
  }> = {}) => {
    const defaults = {
      scale: 1,
      translateX: 0,
      translateY: 0,
      viewportWidth: 1000,
      viewportHeight: 800,
      localClientId: 1,
    };
    const config = { ...defaults, ...overrides };

    return {
      store: {
        state: {
          scale: config.scale,
          translateX: config.translateX,
          translateY: config.translateY,
          viewportWidth: config.viewportWidth,
          viewportHeight: config.viewportHeight,
        },
        objects: {
          hasAwareness: true,
          localClientId: config.localClientId,
          onAwarenessChange: jest.fn(),
          onObjectsChange: jest.fn(),
          findById: jest.fn(),
        },
      },
    } as unknown as KritzelCore;
  };

  const createAwarenessStates = (entries: Array<{
    clientId: number;
    user?: { id: string; name: string; color: string };
    cursor?: { x: number; y: number } | null;
    activeObjectId?: string | null;
  }>): Map<number, Record<string, unknown>> => {
    const map = new Map<number, Record<string, unknown>>();
    for (const entry of entries) {
      map.set(entry.clientId, {
        user: entry.user,
        cursor: entry.cursor ?? null,
        activeObjectId: entry.activeObjectId ?? null,
      });
    }
    return map;
  };

  beforeEach(() => {
    mockCore = createMockCore();
    component = new KritzelAwarenessCursors();
    component.core = mockCore;
    component.showEdgeIndicators = true;
    component.edgeIndicatorPadding = 40;
  });

  afterEach(() => {
    component.disconnectedCallback();
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('componentDidLoad', () => {
    it('should subscribe to awareness changes', () => {
      component.componentDidLoad();

      expect(mockCore.store.objects.onAwarenessChange).toHaveBeenCalledTimes(1);
      expect(mockCore.store.objects.onAwarenessChange).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('handleAwarenessChange', () => {
    it('should exclude local client cursor', () => {
      component.componentDidLoad();

      const callback = (mockCore.store.objects.onAwarenessChange as jest.Mock).mock.calls[0][0];
      const states = createAwarenessStates([
        { clientId: 1, user: { id: 'self', name: 'Me', color: '#ff0000' }, cursor: { x: 100, y: 100 } },
        { clientId: 2, user: { id: 'other', name: 'Other', color: '#00ff00' }, cursor: { x: 200, y: 200 } },
      ]);

      callback(states);

      expect(component.remoteCursors.size).toBe(1);
      expect(component.remoteCursors.has(1)).toBe(false);
      expect(component.remoteCursors.has(2)).toBe(true);
    });

    it('should skip entries without user data', () => {
      component.componentDidLoad();

      const callback = (mockCore.store.objects.onAwarenessChange as jest.Mock).mock.calls[0][0];
      const states = createAwarenessStates([
        { clientId: 2, cursor: { x: 200, y: 200 } },
      ]);

      callback(states);

      expect(component.remoteCursors.size).toBe(0);
    });

    it('should store remote cursors with null cursor position', () => {
      component.componentDidLoad();

      const callback = (mockCore.store.objects.onAwarenessChange as jest.Mock).mock.calls[0][0];
      const states = createAwarenessStates([
        { clientId: 2, user: { id: 'other', name: 'Other', color: '#00ff00' }, cursor: null },
      ]);

      callback(states);

      expect(component.remoteCursors.size).toBe(1);
      expect(component.remoteCursors.get(2)?.cursor).toBeNull();
    });

    it('should remove cursors for disconnected clients', () => {
      component.componentDidLoad();

      const callback = (mockCore.store.objects.onAwarenessChange as jest.Mock).mock.calls[0][0];

      // First update with two clients
      callback(createAwarenessStates([
        { clientId: 2, user: { id: 'a', name: 'Alice', color: '#ff0000' }, cursor: { x: 100, y: 100 } },
        { clientId: 3, user: { id: 'b', name: 'Bob', color: '#00ff00' }, cursor: { x: 200, y: 200 } },
      ]));

      expect(component.remoteCursors.size).toBe(2);

      // Second update without client 3
      callback(createAwarenessStates([
        { clientId: 2, user: { id: 'a', name: 'Alice', color: '#ff0000' }, cursor: { x: 150, y: 150 } },
      ]));

      expect(component.remoteCursors.size).toBe(1);
      expect(component.remoteCursors.has(3)).toBe(false);
    });
  });

  describe('stale cursor cleanup', () => {
    it('should remove cursors older than 30 seconds', () => {
      jest.useFakeTimers();
      component.componentDidLoad();

      const callback = (mockCore.store.objects.onAwarenessChange as jest.Mock).mock.calls[0][0];
      callback(createAwarenessStates([
        { clientId: 2, user: { id: 'other', name: 'Other', color: '#00ff00' }, cursor: { x: 100, y: 100 } },
      ]));

      expect(component.remoteCursors.size).toBe(1);

      // Advance past the remove threshold (30s) + cleanup interval (3s)
      jest.advanceTimersByTime(33_000);

      expect(component.remoteCursors.size).toBe(0);
    });
  });

  describe('worldToScreen', () => {
    it('should project world coordinates to screen coordinates at scale 1', () => {
      const result = (component as any).worldToScreen(100, 200);

      expect(result).toEqual({ x: 100, y: 200 });
    });

    it('should apply scale and translation', () => {
      mockCore = createMockCore({ scale: 2, translateX: 50, translateY: 100 });
      component.core = mockCore;

      const result = (component as any).worldToScreen(100, 200);

      expect(result).toEqual({ x: 250, y: 500 });
    });

    it('should handle negative translations (panned right/down)', () => {
      mockCore = createMockCore({ scale: 1, translateX: -200, translateY: -300 });
      component.core = mockCore;

      const result = (component as any).worldToScreen(100, 200);

      expect(result).toEqual({ x: -100, y: -100 });
    });
  });

  describe('isInViewport', () => {
    it('should return true for coordinates inside viewport', () => {
      const result = (component as any).isInViewport(500, 400);

      expect(result).toBe(true);
    });

    it('should return true for coordinates at viewport origin', () => {
      const result = (component as any).isInViewport(0, 0);

      expect(result).toBe(true);
    });

    it('should return true for coordinates at viewport edge', () => {
      const result = (component as any).isInViewport(1000, 800);

      expect(result).toBe(true);
    });

    it('should return false for coordinates outside viewport', () => {
      expect((component as any).isInViewport(-1, 400)).toBe(false);
      expect((component as any).isInViewport(500, -1)).toBe(false);
      expect((component as any).isInViewport(1001, 400)).toBe(false);
      expect((component as any).isInViewport(500, 801)).toBe(false);
    });
  });

  describe('clampToEdge', () => {
    it('should clamp coordinates to left edge', () => {
      const result = (component as any).clampToEdge(-100, 400);

      expect(result.x).toBe(40); // edgeIndicatorPadding
      expect(result.y).toBe(400);
    });

    it('should clamp coordinates to top edge', () => {
      const result = (component as any).clampToEdge(500, -200);

      expect(result.x).toBe(500);
      expect(result.y).toBe(40);
    });

    it('should clamp coordinates to right edge', () => {
      const result = (component as any).clampToEdge(1500, 400);

      expect(result.x).toBe(960); // viewportWidth - padding
      expect(result.y).toBe(400);
    });

    it('should clamp coordinates to bottom edge', () => {
      const result = (component as any).clampToEdge(500, 1200);

      expect(result.x).toBe(500);
      expect(result.y).toBe(760); // viewportHeight - padding
    });

    it('should compute correct angle for off-screen cursor', () => {
      // Cursor far to the right: angle should be ~0 (pointing right)
      const result = (component as any).clampToEdge(2000, 400);

      expect(result.angle).toBeCloseTo(0, 1);
    });

    it('should compute correct angle for cursor below viewport', () => {
      // Cursor far below: angle should be ~π/2 (pointing down)
      const result = (component as any).clampToEdge(500, 2000);

      expect(result.angle).toBeCloseTo(Math.PI / 2, 1);
    });
  });

  describe('getInitials', () => {
    it('should return two initials for full name', () => {
      expect((component as any).getInitials('John Doe')).toBe('JD');
    });

    it('should return single initial for single name', () => {
      expect((component as any).getInitials('Alice')).toBe('A');
    });

    it('should use first and last for multi-part names', () => {
      expect((component as any).getInitials('John Michael Doe')).toBe('JD');
    });

    it('should handle empty string', () => {
      expect((component as any).getInitials('?')).toBe('?');
    });

    it('should uppercase initials', () => {
      expect((component as any).getInitials('john doe')).toBe('JD');
    });
  });

  describe('disconnectedCallback', () => {
    it('should clear cleanup interval', () => {
      jest.useFakeTimers();
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      component.componentDidLoad();
      component.disconnectedCallback();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('componentDidLoad - objects change subscription', () => {
    it('should subscribe to objects changes', () => {
      component.componentDidLoad();

      expect(mockCore.store.objects.onObjectsChange).toHaveBeenCalledTimes(1);
      expect(mockCore.store.objects.onObjectsChange).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('handleAwarenessChange - activeObjectId', () => {
    it('should store activeObjectId from awareness state', () => {
      component.componentDidLoad();

      const callback = (mockCore.store.objects.onAwarenessChange as jest.Mock).mock.calls[0][0];
      const states = createAwarenessStates([
        { clientId: 2, user: { id: 'other', name: 'Other', color: '#00ff00' }, cursor: { x: 200, y: 200 }, activeObjectId: 'path-42' },
      ]);

      callback(states);

      expect(component.remoteCursors.get(2)?.activeObjectId).toBe('path-42');
    });

    it('should store null activeObjectId when not set', () => {
      component.componentDidLoad();

      const callback = (mockCore.store.objects.onAwarenessChange as jest.Mock).mock.calls[0][0];
      const states = createAwarenessStates([
        { clientId: 2, user: { id: 'other', name: 'Other', color: '#00ff00' }, cursor: { x: 200, y: 200 } },
      ]);

      callback(states);

      expect(component.remoteCursors.get(2)?.activeObjectId).toBeNull();
    });
  });

  describe('getActiveObjectTip', () => {
    it('should return null when object is not found', () => {
      (mockCore.store.objects.findById as jest.Mock).mockReturnValue(undefined);

      const result = (component as any).getActiveObjectTip('nonexistent-id');

      expect(result).toBeNull();
    });

    it('should return world coords for a KritzelPath last point', () => {
      const mockPath = Object.create(MockKritzelPath.prototype);
      Object.assign(mockPath, {
        points: [[10, 20], [30, 40]],
        x: 5,
        y: 10,
        translateX: 100,
        translateY: 200,
        scale: 2,
        isCompleted: false,
      });
      (mockCore.store.objects.findById as jest.Mock).mockReturnValue(mockPath);

      const result = (component as any).getActiveObjectTip('path-1');

      expect(result).toEqual({
        x: (30 - 5) / 2 + 100,
        y: (40 - 10) / 2 + 200,
      });
    });

    it('should return null for a completed KritzelPath', () => {
      const mockPath = Object.create(MockKritzelPath.prototype);
      Object.assign(mockPath, {
        points: [[10, 20]],
        translateX: 0,
        translateY: 0,
        scale: 1,
        isCompleted: true,
      });
      (mockCore.store.objects.findById as jest.Mock).mockReturnValue(mockPath);

      const result = (component as any).getActiveObjectTip('path-1');

      expect(result).toBeNull();
    });

    it('should return world coords for a KritzelLine end point', () => {
      const mockLine = Object.create(MockKritzelLine.prototype);
      Object.assign(mockLine, {
        endX: 50,
        endY: 60,
        x: 5,
        y: 10,
        translateX: 10,
        translateY: 20,
        scale: 2,
        isCompleted: false,
      });
      (mockCore.store.objects.findById as jest.Mock).mockReturnValue(mockLine);

      const result = (component as any).getActiveObjectTip('line-1');

      expect(result).toEqual({
        x: (50 - 5) / 2 + 10,
        y: (60 - 10) / 2 + 20,
      });
    });

    it('should return null for a completed KritzelLine', () => {
      const mockLine = Object.create(MockKritzelLine.prototype);
      Object.assign(mockLine, {
        endX: 50,
        endY: 60,
        translateX: 0,
        translateY: 0,
        scale: 1,
        isCompleted: true,
      });
      (mockCore.store.objects.findById as jest.Mock).mockReturnValue(mockLine);

      const result = (component as any).getActiveObjectTip('line-1');

      expect(result).toBeNull();
    });

    it('should return null for a KritzelShape (falls back to awareness cursor)', () => {
      const mockShape = Object.create(MockKritzelShape.prototype);
      Object.assign(mockShape, {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        scale: 2,
        translateX: 300,
        translateY: 400,
      });
      (mockCore.store.objects.findById as jest.Mock).mockReturnValue(mockShape);

      const result = (component as any).getActiveObjectTip('shape-1');

      expect(result).toBeNull();
    });

    it('should return null for an unrecognized object type', () => {
      (mockCore.store.objects.findById as jest.Mock).mockReturnValue({ id: 'unknown', type: 'custom' });

      const result = (component as any).getActiveObjectTip('unknown');

      expect(result).toBeNull();
    });
  });

  describe('hasActiveDrawingCursors', () => {
    it('should return false when no cursor has activeObjectId', () => {
      component.componentDidLoad();

      const callback = (mockCore.store.objects.onAwarenessChange as jest.Mock).mock.calls[0][0];
      callback(createAwarenessStates([
        { clientId: 2, user: { id: 'other', name: 'Other', color: '#00ff00' }, cursor: { x: 200, y: 200 } },
      ]));

      expect((component as any).hasActiveDrawingCursors()).toBe(false);
    });

    it('should return true when at least one cursor has activeObjectId', () => {
      component.componentDidLoad();

      const callback = (mockCore.store.objects.onAwarenessChange as jest.Mock).mock.calls[0][0];
      callback(createAwarenessStates([
        { clientId: 2, user: { id: 'other', name: 'Other', color: '#00ff00' }, cursor: { x: 200, y: 200 }, activeObjectId: 'path-1' },
      ]));

      expect((component as any).hasActiveDrawingCursors()).toBe(true);
    });
  });
});
