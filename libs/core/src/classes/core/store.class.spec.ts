import { KritzelStore } from './store.class';
import { KritzelEngineState } from '../../interfaces/engine-state.interface';
import { KritzelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelText } from '../objects/text.class';
import { KritzelShape } from '../objects/shape.class';
import { KritzelPath } from '../objects/path.class';
import { KritzelLine } from '../objects/line.class';
import { KritzelDynamicObject } from '../objects/dynamic-object.class';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelGroup } from '../objects/group.class';

type TestState = Omit<KritzelEngineState, 'objects'> & { objects: NonNullable<KritzelEngineState['objects']> };

describe('KritzelStore', () => {
  let store: KritzelStore;
  let mockState: TestState;

  const createMockState = (): KritzelEngineState => {
    return {
      scale: 1,
      translateX: 0,
      translateY: 0,
      viewportWidth: 1000,
      viewportHeight: 800,
      host: {
        getBoundingClientRect: jest.fn().mockReturnValue({ left: 10, top: 20 }),
      },
      isEnabled: true,
      isReady: true,
      activeWorkspace: { id: 'workspace-1' },
      pointers: new Map(),
      objects: null,
      contextMenuItems: [],
      workspaces: [],
      debugInfo: {} as any,
      cursor: { icon: '' } as any,
    } as unknown as KritzelEngineState;
  };

  beforeEach(() => {
    const state = createMockState();
    store = new KritzelStore(state);
    mockState = store.state as TestState;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with the provided state', () => {
      expect(store.state).toBe(mockState);
    });

    it('should initialize state.objects as a KritzelObjectMap', () => {
      expect(mockState.objects).toBeDefined();
      expect(mockState.objects.totalCount).toBe(0);
    });
  });

  describe('state getter', () => {
    it('should return the internal state', () => {
      expect(store.state).toBe(mockState);
    });
  });

  describe('currentZIndex', () => {
    it('should return 1 when there are no objects', () => {
      expect(store.currentZIndex).toBe(1);
    });

    it('should return max zIndex + 1 from non-selection objects', () => {
      const obj1 = new KritzelBaseObject<Element>();
      obj1.zIndex = 5;
      const obj2 = new KritzelBaseObject<Element>();
      obj2.zIndex = 10;

      mockState.objects.insert(obj1);
      mockState.objects.insert(obj2);

      expect(store.currentZIndex).toBe(11);
    });

    it('should ignore SelectionGroup objects when calculating zIndex', () => {
      const obj = new KritzelBaseObject<Element>();
      obj.zIndex = 5;

      const selGroup = new KritzelSelectionGroup();
      selGroup.zIndex = 99999;

      mockState.objects.insert(obj);
      mockState.objects.insert(selGroup);

      expect(store.currentZIndex).toBe(6);
    });

    it('should ignore SelectionBox objects when calculating zIndex', () => {
      const obj = new KritzelBaseObject<Element>();
      obj.zIndex = 3;

      const selBox = new KritzelSelectionBox();
      selBox.zIndex = 99999;

      mockState.objects.insert(obj);
      mockState.objects.insert(selBox);

      expect(store.currentZIndex).toBe(4);
    });
  });

  describe('totalObjectCount', () => {
    it('should return 0 when there are no objects', () => {
      expect(store.totalObjectCount).toBe(0);
    });

    it('should return the total count of all objects', () => {
      const obj1 = new KritzelBaseObject<Element>();
      const obj2 = new KritzelBaseObject<Element>();
      mockState.objects.insert(obj1);
      mockState.objects.insert(obj2);

      expect(store.totalObjectCount).toBe(2);
    });
  });

  describe('allObjects', () => {
    it('should return an empty array when there are no objects', () => {
      expect(store.allObjects).toEqual([]);
    });

    it('should return all objects', () => {
      const obj1 = new KritzelBaseObject<Element>();
      const obj2 = new KritzelBaseObject<Element>();
      mockState.objects.insert(obj1);
      mockState.objects.insert(obj2);

      const result = store.allObjects;
      expect(result).toHaveLength(2);
      expect(result).toContain(obj1);
      expect(result).toContain(obj2);
    });
  });

  describe('objectsInViewport', () => {
    it('should return an empty array when there are no objects', () => {
      expect(store.objectsInViewport).toEqual([]);
    });

    it('should include SelectionGroup objects in viewport', () => {
      const obj = new KritzelBaseObject<Element>();
      obj.translateX = 50;
      obj.translateY = 50;
      obj.width = 100;
      obj.height = 100;
      obj.zIndex = 1;

      const selGroup = new KritzelSelectionGroup();
      selGroup.translateX = 50;
      selGroup.translateY = 50;
      selGroup.width = 100;
      selGroup.height = 100;
      selGroup.zIndex = 2;

      mockState.objects.insert(obj);
      mockState.objects.insert(selGroup);

      const result = store.objectsInViewport;
      expect(result).toContain(obj);
      expect(result).toContain(selGroup);
    });

    it('should include SelectionBox objects in viewport', () => {
      const obj = new KritzelBaseObject<Element>();
      obj.translateX = 50;
      obj.translateY = 50;
      obj.width = 100;
      obj.height = 100;
      obj.zIndex = 1;

      const selBox = new KritzelSelectionBox();
      selBox.translateX = 50;
      selBox.translateY = 50;
      selBox.width = 100;
      selBox.height = 100;
      selBox.zIndex = 2;

      mockState.objects.insert(obj);
      mockState.objects.insert(selBox);

      const result = store.objectsInViewport;
      expect(result).toContain(obj);
      expect(result).toContain(selBox);
    });

    it('should sort objects by zIndex', () => {
      const objA = new KritzelBaseObject<Element>();
      objA.translateX = 10;
      objA.translateY = 10;
      objA.width = 50;
      objA.height = 50;
      objA.zIndex = 10;

      const objB = new KritzelBaseObject<Element>();
      objB.translateX = 20;
      objB.translateY = 20;
      objB.width = 50;
      objB.height = 50;
      objB.zIndex = 2;

      mockState.objects.insert(objA);
      mockState.objects.insert(objB);

      const result = store.objectsInViewport;
      expect(result[0].zIndex).toBeLessThanOrEqual(result[result.length - 1].zIndex);
    });

    describe('group tied with its top member', () => {
      const createObject = (zIndex: number): KritzelBaseObject<Element> => {
        const object = new KritzelBaseObject<Element>();
        object.zIndex = zIndex;
        return object;
      };

      // A group's zIndex equals the zIndex of its top member.
      const createStack = () => {
        const bottom = createObject(1);
        const top = createObject(2);
        const above = createObject(3);
        const group = new KritzelGroup();
        group.childIds = [bottom.id, top.id];
        group.zIndex = 2;
        return { bottom, top, group, above };
      };

      it('should place the group after its top member when the query returns the group first', () => {
        const { bottom, top, group, above } = createStack();
        jest.spyOn(mockState.objects, 'query').mockReturnValue([above, group, top, bottom]);

        expect(store.objectsInViewport).toEqual([bottom, top, group, above]);
      });

      it('should place the group after its top member when the query returns the member first', () => {
        const { bottom, top, group, above } = createStack();
        jest.spyOn(mockState.objects, 'query').mockReturnValue([top, bottom, above, group]);

        expect(store.objectsInViewport).toEqual([bottom, top, group, above]);
      });

      it('should keep the result sorted by non-decreasing zIndex', () => {
        const { bottom, top, group, above } = createStack();
        jest.spyOn(mockState.objects, 'query').mockReturnValue([group, above, top, bottom]);

        const result = store.objectsInViewport;
        for (let i = 1; i < result.length; i++) {
          expect(result[i].zIndex).toBeGreaterThanOrEqual(result[i - 1].zIndex);
        }
      });
    });
  });

  describe('objectsToRender', () => {
    it('should include objectsInViewport', () => {
      const obj = new KritzelBaseObject<Element>();
      obj.translateX = 50;
      obj.translateY = 50;
      obj.width = 100;
      obj.height = 100;
      obj.zIndex = 1;

      mockState.objects.insert(obj);

      const result = store.objectsInViewport;
      expect(result).toContain(obj);
    });

    it('should include selection group when present', () => {
      const selGroup = new KritzelSelectionGroup();
      selGroup.translateX = 50;
      selGroup.translateY = 50;
      selGroup.width = 100;
      selGroup.height = 100;
      selGroup.zIndex = 99999;

      mockState.objects.insert(selGroup);
      store.setSelectionGroup(selGroup);

      expect(store.selectionGroup).toBe(selGroup);
      expect(store.objectsInViewport).toContain(selGroup);
    });

    it('should include selection box when present', () => {
      const selBox = new KritzelSelectionBox();
      selBox.translateX = 50;
      selBox.translateY = 50;
      selBox.width = 100;
      selBox.height = 100;
      selBox.zIndex = 99999;

      mockState.objects.insert(selBox);
      store.setSelectionBox(selBox);

      expect(store.selectionBox).toBe(selBox);
      expect(store.objectsInViewport).toContain(selBox);
    });

    it('should sort all rendered objects by zIndex', () => {
      const obj1 = new KritzelBaseObject<Element>();
      obj1.translateX = 50;
      obj1.translateY = 50;
      obj1.width = 100;
      obj1.height = 100;
      obj1.zIndex = 5;

      const obj2 = new KritzelBaseObject<Element>();
      obj2.translateX = 50;
      obj2.translateY = 50;
      obj2.width = 100;
      obj2.height = 100;
      obj2.zIndex = 10;

      mockState.objects.insert(obj1);
      mockState.objects.insert(obj2);

      const result = store.objectsInViewport;
      for (let i = 1; i < result.length; i++) {
        expect(result[i].zIndex).toBeGreaterThanOrEqual(result[i - 1].zIndex);
      }
    });
  });

  describe('allNonSelectionObjects', () => {
    it('should return objects excluding SelectionGroup and SelectionBox', () => {
      const obj = new KritzelBaseObject<Element>();
      const selGroup = new KritzelSelectionGroup();
      const selBox = new KritzelSelectionBox();

      mockState.objects.insert(obj);
      mockState.objects.insert(selGroup);
      mockState.objects.insert(selBox);

      const result = store.allNonSelectionObjects;
      expect(result).toContain(obj);
      expect(result).not.toContain(selGroup);
      expect(result).not.toContain(selBox);
    });

    it('should return an empty array when only selection objects exist', () => {
      const selGroup = new KritzelSelectionGroup();
      mockState.objects.insert(selGroup);

      expect(store.allNonSelectionObjects).toEqual([]);
    });
  });

  describe('selectedObjects', () => {
    it('should return only objects where isSelected is true', () => {
      const selected = new KritzelBaseObject<Element>();
      selected.isSelected = true;

      const unselected = new KritzelBaseObject<Element>();
      unselected.isSelected = false;

      mockState.objects.insert(selected);
      mockState.objects.insert(unselected);

      const result = store.selectedObjects;
      expect(result).toContain(selected);
      expect(result).not.toContain(unselected);
    });

    it('should exclude SelectionGroup even if it is selected', () => {
      const selGroup = new KritzelSelectionGroup();
      selGroup.isSelected = true;

      mockState.objects.insert(selGroup);

      expect(store.selectedObjects).toEqual([]);
    });

    it('should return empty array when no objects are selected', () => {
      const obj = new KritzelBaseObject<Element>();
      obj.isSelected = false;
      mockState.objects.insert(obj);

      expect(store.selectedObjects).toEqual([]);
    });
  });

  describe('selectionBox', () => {
    it('should return null when no SelectionBox exists', () => {
      expect(store.selectionBox).toBeNull();
    });

    it('should return the SelectionBox when one exists', () => {
      const selBox = new KritzelSelectionBox();
      mockState.objects.insert(selBox);

      expect(store.selectionBox).toBe(selBox);
    });

    it('should cache the result for subsequent calls', () => {
      const selBox = new KritzelSelectionBox();
      mockState.objects.insert(selBox);

      const filterSpy = jest.spyOn(mockState.objects, 'filter');

      const first = store.selectionBox;
      const second = store.selectionBox;

      expect(first).toBe(selBox);
      expect(second).toBe(selBox);
      // filter should only be called once due to caching
      expect(filterSpy).toHaveBeenCalledTimes(1);

      filterSpy.mockRestore();
    });

    it('should refresh cache after invalidation', () => {
      const selBox = new KritzelSelectionBox();
      mockState.objects.insert(selBox);

      const filterSpy = jest.spyOn(mockState.objects, 'filter');

      store.selectionBox; // first call fills cache
      store.invalidateSelectionCache();
      store.selectionBox; // should query again

      expect(filterSpy).toHaveBeenCalledTimes(2);

      filterSpy.mockRestore();
    });
  });

  describe('selectionGroup', () => {
    it('should return null when no SelectionGroup exists', () => {
      expect(store.selectionGroup).toBeNull();
    });

    it('should return the SelectionGroup when one exists', () => {
      const selGroup = new KritzelSelectionGroup();
      mockState.objects.insert(selGroup);

      expect(store.selectionGroup).toBe(selGroup);
    });

    it('should cache the result for subsequent calls', () => {
      const selGroup = new KritzelSelectionGroup();
      mockState.objects.insert(selGroup);

      const filterSpy = jest.spyOn(mockState.objects, 'filter');

      const first = store.selectionGroup;
      const second = store.selectionGroup;

      expect(first).toBe(selGroup);
      expect(second).toBe(selGroup);
      expect(filterSpy).toHaveBeenCalledTimes(1);

      filterSpy.mockRestore();
    });

    it('should refresh cache after invalidation', () => {
      const selGroup = new KritzelSelectionGroup();
      mockState.objects.insert(selGroup);

      const filterSpy = jest.spyOn(mockState.objects, 'filter');

      store.selectionGroup; // first call fills cache
      store.invalidateSelectionCache();
      store.selectionGroup; // should query again

      expect(filterSpy).toHaveBeenCalledTimes(2);

      filterSpy.mockRestore();
    });

    it('should return only the local user\'s selection group when localUserId is set', () => {
      const localGroup = new KritzelSelectionGroup();
      (localGroup as any).userId = 'user-a';

      const remoteGroup = new KritzelSelectionGroup();
      (remoteGroup as any).userId = 'user-b';

      mockState.objects.insert(localGroup);
      mockState.objects.insert(remoteGroup);

      store.setLocalUserId('user-a');

      expect(store.selectionGroup).toBe(localGroup);
    });

    it('should return null when no selection group matches localUserId', () => {
      const remoteGroup = new KritzelSelectionGroup();
      (remoteGroup as any).userId = 'user-b';

      mockState.objects.insert(remoteGroup);

      store.setLocalUserId('user-a');

      expect(store.selectionGroup).toBeNull();
    });

    it('should fall back to first group when localUserId is null', () => {
      const groupA = new KritzelSelectionGroup();
      (groupA as any).userId = 'user-a';

      const groupB = new KritzelSelectionGroup();
      (groupB as any).userId = 'user-b';

      mockState.objects.insert(groupA);
      mockState.objects.insert(groupB);

      store.setLocalUserId(null);

      expect(store.selectionGroup).toBe(groupA);
    });
  });

  describe('selectedGroups', () => {
    it('should return an empty array when nothing is selected', () => {
      expect(store.selectedGroups).toEqual([]);
    });

    it('should return only the groups of the selection', () => {
      const group = Object.assign(Object.create(KritzelGroup.prototype), { id: 'group', __class__: 'KritzelGroup' });
      const path = Object.assign(Object.create(KritzelPath.prototype), { id: 'path', __class__: 'KritzelPath' });
      const selGroup = new KritzelSelectionGroup();
      Object.defineProperty(selGroup, 'objects', { get: () => [group, path] });
      mockState.objects.insert(selGroup);

      expect(store.selectedGroups).toEqual([group]);
    });
  });

  describe('setLocalUserId', () => {
    it('should invalidate selection cache when called', () => {
      const selGroup = new KritzelSelectionGroup();
      (selGroup as any).userId = 'user-a';
      mockState.objects.insert(selGroup);

      const filterSpy = jest.spyOn(mockState.objects, 'filter');

      store.setLocalUserId('user-a');
      store.selectionGroup; // should query with userId filter

      expect(filterSpy).toHaveBeenCalled();

      filterSpy.mockRestore();
    });
  });

  describe('setSelectionBox', () => {
    it('should directly set the cached selection box', () => {
      const selBox = new KritzelSelectionBox();
      store.setSelectionBox(selBox);

      expect(store.selectionBox).toBe(selBox);
    });

    it('should set cached selection box to null', () => {
      const selBox = new KritzelSelectionBox();
      store.setSelectionBox(selBox);
      store.setSelectionBox(null);

      expect(store.selectionBox).toBeNull();
    });

    it('should bypass filter lookup on subsequent access', () => {
      const selBox = new KritzelSelectionBox();
      const filterSpy = jest.spyOn(mockState.objects, 'filter');

      store.setSelectionBox(selBox);
      store.selectionBox;

      expect(filterSpy).not.toHaveBeenCalled();

      filterSpy.mockRestore();
    });
  });

  describe('setSelectionGroup', () => {
    it('should directly set the cached selection group', () => {
      const selGroup = new KritzelSelectionGroup();
      store.setSelectionGroup(selGroup);

      expect(store.selectionGroup).toBe(selGroup);
    });

    it('should set cached selection group to null', () => {
      const selGroup = new KritzelSelectionGroup();
      store.setSelectionGroup(selGroup);
      store.setSelectionGroup(null);

      expect(store.selectionGroup).toBeNull();
    });

    it('should bypass filter lookup on subsequent access', () => {
      const selGroup = new KritzelSelectionGroup();
      const filterSpy = jest.spyOn(mockState.objects, 'filter');

      store.setSelectionGroup(selGroup);
      store.selectionGroup;

      expect(filterSpy).not.toHaveBeenCalled();

      filterSpy.mockRestore();
    });
  });

  describe('invalidateSelectionCache', () => {
    it('should invalidate both selection caches', () => {
      const selBox = new KritzelSelectionBox();
      const selGroup = new KritzelSelectionGroup();
      store.setSelectionBox(selBox);
      store.setSelectionGroup(selGroup);

      const filterSpy = jest.spyOn(mockState.objects, 'filter');

      store.invalidateSelectionCache();

      // Accessing after invalidation should trigger filter lookups
      store.selectionBox;
      store.selectionGroup;

      expect(filterSpy).toHaveBeenCalledTimes(2);

      filterSpy.mockRestore();
    });
  });

  describe('activeText', () => {
    it('should return null when no text is being edited', () => {
      expect(store.activeText).toBeNull();
    });

    it('should return the text object that is being edited', () => {
      const text = new KritzelText();
      text.isEditing = true;
      mockState.objects.insert(text);

      expect(store.activeText).toBe(text);
    });

    it('should not return a text object that is not being edited', () => {
      const text = new KritzelText();
      text.isEditing = false;
      mockState.objects.insert(text);

      expect(store.activeText).toBeNull();
    });
  });

  describe('activeShape', () => {
    it('should return null when no shape is being edited', () => {
      expect(store.activeShape).toBeNull();
    });

    it('should return the shape object that is being edited', () => {
      const shape = new KritzelShape();
      shape.isEditing = true;
      mockState.objects.insert(shape);

      expect(store.activeShape).toBe(shape);
    });

    it('should not return a shape object that is not being edited', () => {
      const shape = new KritzelShape();
      shape.isEditing = false;
      mockState.objects.insert(shape);

      expect(store.activeShape).toBeNull();
    });
  });

  describe('activeInteractiveDynamicObject', () => {
    it('should return null when no selected dynamic object has focused input-like content', () => {
      const dynamicObject = new KritzelDynamicObject();
      dynamicObject.isSelected = true;
      dynamicObject.isInteractive = true;
      jest.spyOn(dynamicObject, 'hasFocusedInputElement').mockReturnValue(false);
      mockState.objects.insert(dynamicObject);

      expect(store.activeInteractiveDynamicObject).toBeNull();
    });

    it('should return the selected dynamic object with focused input-like content', () => {
      const dynamicObject = new KritzelDynamicObject();
      dynamicObject.isSelected = true;
      dynamicObject.isInteractive = true;
      jest.spyOn(dynamicObject, 'hasFocusedInputElement').mockReturnValue(true);
      mockState.objects.insert(dynamicObject);

      expect(store.activeInteractiveDynamicObject).toBe(dynamicObject);
    });

    it('should ignore dynamic objects that are not selected even when input-like content is focused', () => {
      const dynamicObject = new KritzelDynamicObject();
      dynamicObject.isSelected = false;
      dynamicObject.isInteractive = true;
      jest.spyOn(dynamicObject, 'hasFocusedInputElement').mockReturnValue(true);
      mockState.objects.insert(dynamicObject);

      expect(store.activeInteractiveDynamicObject).toBeNull();
    });
  });

  describe('currentPath', () => {
    it('should return null when no path is being drawn', () => {
      expect(store.currentPath).toBeNull();
    });

    it('should return the path that is not yet completed', () => {
      const path = new KritzelPath();
      path.isCompleted = false;
      mockState.objects.insert(path);

      expect(store.currentPath).toBe(path);
    });

    it('should not return a completed path', () => {
      const path = new KritzelPath();
      path.isCompleted = true;
      mockState.objects.insert(path);

      expect(store.currentPath).toBeNull();
    });
  });

  describe('currentLine', () => {
    it('should return null when no line is being drawn', () => {
      expect(store.currentLine).toBeNull();
    });

    it('should return the line that is not yet completed', () => {
      const line = new KritzelLine();
      line.isCompleted = false;
      mockState.objects.insert(line);

      expect(store.currentLine).toBe(line);
    });

    it('should not return a completed line', () => {
      const line = new KritzelLine();
      line.isCompleted = true;
      mockState.objects.insert(line);

      expect(store.currentLine).toBeNull();
    });
  });

  describe('offsetX', () => {
    it('should return the left bounding rect of the host element', () => {
      expect(store.offsetX).toBe(10);
    });
  });

  describe('offsetY', () => {
    it('should return the top bounding rect of the host element', () => {
      expect(store.offsetY).toBe(20);
    });
  });

  describe('isDisabled', () => {
    it('should return false when enabled and ready with active workspace', () => {
      expect(store.isDisabled).toBe(false);
    });

    it('should return true when isEnabled is false', () => {
      mockState.isEnabled = false;
      expect(store.isDisabled).toBe(true);
    });

    it('should return true when isReady is false', () => {
      mockState.isReady = false;
      expect(store.isDisabled).toBe(true);
    });

    it('should return true when activeWorkspace is null', () => {
      mockState.activeWorkspace = null;
      expect(store.isDisabled).toBe(true);
    });
  });

  describe('isPointerDown', () => {
    it('should return false when no pointers are active', () => {
      expect(store.isPointerDown).toBe(false);
    });

    it('should return true when pointers are active', () => {
      mockState.pointers.set(1, {} as PointerEvent);
      expect(store.isPointerDown).toBe(true);
    });
  });

  describe('onStateChange', () => {
    it('should register a listener for a state property', () => {
      const listener = jest.fn();
      store.onStateChange('scale', listener);

      store.setState('scale', 2);
      expect(listener).toHaveBeenCalledWith(2, 1, 'scale');
    });

    it('should support multiple listeners for the same property', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      store.onStateChange('scale', listener1);
      store.onStateChange('scale', listener2);

      store.setState('scale', 3);
      expect(listener1).toHaveBeenCalledWith(3, 1, 'scale');
      expect(listener2).toHaveBeenCalledWith(3, 1, 'scale');
    });

    it('should support listeners for different properties', () => {
      const scaleListener = jest.fn();
      const translateXListener = jest.fn();
      store.onStateChange('scale', scaleListener);
      store.onStateChange('translateX', translateXListener);

      store.setState('scale', 2);
      expect(scaleListener).toHaveBeenCalled();
      expect(translateXListener).not.toHaveBeenCalled();
    });
  });

  describe('getState', () => {
    it('should return the current value of a state property', () => {
      expect(store.getState('scale')).toBe(1);
      expect(store.getState('translateX')).toBe(0);
      expect(store.getState('viewportWidth')).toBe(1000);
    });
  });

  describe('setState', () => {
    it('should update the state property value', () => {
      store.setState('scale', 2);
      expect(store.state.scale).toBe(2);
    });

    it('should notify listeners when value changes', () => {
      const listener = jest.fn();
      store.onStateChange('scale', listener);

      store.setState('scale', 2);
      expect(listener).toHaveBeenCalledWith(2, 1, 'scale');
    });

    it('should not notify listeners when value stays the same', () => {
      const listener = jest.fn();
      store.onStateChange('scale', listener);

      store.setState('scale', 1); // same as initial value
      expect(listener).not.toHaveBeenCalled();
    });

    it('should pass old and new values to listener', () => {
      const listener = jest.fn();
      store.onStateChange('translateX', listener);

      store.setState('translateX', 50);
      expect(listener).toHaveBeenCalledWith(50, 0, 'translateX');

      store.setState('translateX', 100);
      expect(listener).toHaveBeenCalledWith(100, 50, 'translateX');
    });
  });
  describe('getObjectsInViewport', () => {
    it('queries the viewport in world units without padding by default', () => {
      mockState.scale = 2;
      mockState.translateX = -100;
      mockState.translateY = 50;
      const query = jest.spyOn(mockState.objects, 'query').mockReturnValue([]);

      void store.objectsInViewport;

      expect(query).toHaveBeenCalledWith({ x: 50, y: -25, z: 2, width: 500, height: 400, depth: 100 });
    });

    it('widens the query by the padding on every side', () => {
      mockState.scale = 2;
      mockState.translateX = -100;
      mockState.translateY = 50;
      const query = jest.spyOn(mockState.objects, 'query').mockReturnValue([]);

      store.getObjectsInViewport(17);

      expect(query).toHaveBeenCalledWith({ x: 33, y: -42, z: 2, width: 534, height: 434, depth: 100 });
    });
  });
});
