import { KritzelWorkspace } from './workspace.class';
import { KritzelCore } from './core.class';

describe('KritzelWorkspace', () => {
  let mockCore: jest.Mocked<KritzelCore>;

  const createMockCore = (): jest.Mocked<KritzelCore> => {
    return {
      engine: {
        addObject: jest.fn(),
      },
    } as unknown as jest.Mocked<KritzelCore>;
  };

  beforeEach(() => {
    mockCore = createMockCore();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a workspace from a KritzelWorkspaceConfig object', () => {
      const workspace = new KritzelWorkspace({
        name: 'Configured Workspace',
        id: 'ws-config-1',
        viewport: { centerWorldX: 10, centerWorldY: 20, scale: 1.5 },
      });

      expect(workspace.id).toBe('ws-config-1');
      expect(workspace.name).toBe('Configured Workspace');
      expect(workspace.viewport).toEqual({ centerWorldX: 10, centerWorldY: 20, scale: 1.5 });
      expect(workspace.__class__).toBe('KritzelWorkspace');
    });

    it('should auto-generate an ID if omitted in KritzelWorkspaceConfig', () => {
      const workspace = new KritzelWorkspace({ name: 'Auto ID Workspace' });

      expect(workspace.id).toBeDefined();
      expect(typeof workspace.id).toBe('string');
      expect(workspace.id.length).toBeGreaterThan(0);
      expect(workspace.name).toBe('Auto ID Workspace');
    });

    it('should set default viewport values when none provided', () => {
      const workspace = new KritzelWorkspace({ name: 'Test' });

      expect(workspace.viewport).toEqual({
        centerWorldX: 0,
        centerWorldY: 0,
        scale: 1,
      });
    });

    it('should set default name when none provided', () => {
      const workspace = new KritzelWorkspace();

      expect(workspace.name).toBe('New Workspace');
      expect(workspace.id).toBeDefined();
    });

    it('should accept custom viewport values', () => {
      const viewport = { centerWorldX: 100, centerWorldY: 200, scale: 2 };
      const workspace = new KritzelWorkspace({ name: 'Test', viewport });

      expect(workspace.viewport).toEqual(viewport);
    });

    it('should set createdAt and updatedAt to current dates', () => {
      const before = new Date();
      const workspace = new KritzelWorkspace({ name: 'Test' });
      const after = new Date();

      expect(workspace.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(workspace.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(workspace.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(workspace.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('create', () => {
    it('should create a workspace from an object and assign core', () => {
      const obj = { id: 'ws-2', name: 'Created Workspace', viewport: { centerWorldX: 50, centerWorldY: 60, scale: 1.5 } };
      const workspace = KritzelWorkspace.create(mockCore, obj);

      expect(workspace.id).toBe('ws-2');
      expect(workspace.name).toBe('Created Workspace');
      expect(workspace.viewport).toEqual({ centerWorldX: 50, centerWorldY: 60, scale: 1.5 });
      expect(workspace._core).toBe(mockCore);
    });

    it('should return an instance of KritzelWorkspace', () => {
      const obj = { id: 'ws-3', name: 'Test' };
      const workspace = KritzelWorkspace.create(mockCore, obj);

      expect(workspace).toBeInstanceOf(KritzelWorkspace);
    });
  });

  describe('addObject', () => {
    it('should delegate to core.engine.addObject', () => {
      const workspace = KritzelWorkspace.create(mockCore, { id: 'ws-1', name: 'Test' });
      const mockObj = { id: 'obj-1', type: 'path' };

      workspace.addObject(mockObj);

      expect(mockCore.engine.addObject).toHaveBeenCalledWith(mockObj);
    });
  });

  describe('serialize', () => {
    it('should return a serialized representation', () => {
      const workspace = new KritzelWorkspace({ id: 'ws-1', name: 'Test Workspace', viewport: { centerWorldX: 10, centerWorldY: 20, scale: 1.5 } });
      const serialized = workspace.serialize();

      expect(serialized.__class__).toBe('KritzelWorkspace');
      expect(serialized.id).toBe('ws-1');
      expect(serialized.name).toBe('Test Workspace');
      expect(serialized.viewport).toEqual({ centerWorldX: 10, centerWorldY: 20, scale: 1.5 });
    });

    it('should serialize dates as ISO strings', () => {
      const workspace = new KritzelWorkspace({ id: 'ws-1', name: 'Test' });
      const serialized = workspace.serialize();

      expect(typeof serialized.createdAt).toBe('string');
      expect(typeof serialized.updatedAt).toBe('string');
      expect(new Date(serialized.createdAt as string).toISOString()).toBe(serialized.createdAt);
      expect(new Date(serialized.updatedAt as string).toISOString()).toBe(serialized.updatedAt);
    });
  });

  describe('deserialize', () => {
    it('should restore workspace properties from a plain object', () => {
      const workspace = new KritzelWorkspace();
      const data = {
        id: 'ws-restored',
        name: 'Restored Workspace',
        createdAt: '2025-01-15T10:00:00.000Z',
        updatedAt: '2025-01-16T12:00:00.000Z',
        viewport: { centerWorldX: 30, centerWorldY: 40, scale: 2 },
      };

      workspace.deserialize(data);

      expect(workspace.id).toBe('ws-restored');
      expect(workspace.name).toBe('Restored Workspace');
      expect(workspace.viewport).toEqual({ centerWorldX: 30, centerWorldY: 40, scale: 2 });
    });

    it('should convert date strings back to Date objects', () => {
      const workspace = new KritzelWorkspace();
      const data = {
        createdAt: '2025-01-15T10:00:00.000Z',
        updatedAt: '2025-01-16T12:00:00.000Z',
      };

      workspace.deserialize(data);

      expect(workspace.createdAt).toBeInstanceOf(Date);
      expect(workspace.updatedAt).toBeInstanceOf(Date);
      expect(workspace.createdAt.toISOString()).toBe('2025-01-15T10:00:00.000Z');
      expect(workspace.updatedAt.toISOString()).toBe('2025-01-16T12:00:00.000Z');
    });

    it('should return the workspace instance for chaining', () => {
      const workspace = new KritzelWorkspace();
      const result = workspace.deserialize({ createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

      expect(result).toBe(workspace);
    });
  });

  describe('serialize/deserialize roundtrip', () => {
    it('should preserve data through a serialize-deserialize cycle', () => {
      const original = new KritzelWorkspace({ id: 'ws-round', name: 'Roundtrip', viewport: { centerWorldX: 5, centerWorldY: 10, scale: 3 } });
      const serialized = original.serialize();

      const restored = new KritzelWorkspace();
      restored.deserialize(serialized);

      expect(restored.id).toBe(original.id);
      expect(restored.name).toBe(original.name);
      expect(restored.viewport).toEqual(original.viewport);
      expect(restored.createdAt.toISOString()).toBe(original.createdAt.toISOString());
      expect(restored.updatedAt.toISOString()).toBe(original.updatedAt.toISOString());
    });
  });
});
