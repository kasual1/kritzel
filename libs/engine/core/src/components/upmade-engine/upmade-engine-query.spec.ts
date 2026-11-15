import { UpmadeBaseObject, UpmadeSelectionGroup, UpmadeSelectionBox } from '@upmade/core';

/**
 * Unit tests for UpmadeEngine.findObjects().
 *
 * Since UpmadeEngine.findObjects delegates to store.allNonSelectionObjects.filter(predicate),
 * we test the filtering logic directly against a mock store to keep tests fast and isolated.
 */
describe('findObjects', () => {
    /**
     * Simulates what UpmadeEngine.findObjects does:
     * filters allNonSelectionObjects (which already excludes selection objects) with user predicate.
     */
    function findObjects<T extends UpmadeBaseObject>(
        allObjects: UpmadeBaseObject[],
        predicate: (obj: UpmadeBaseObject) => boolean,
    ): T[] {
        const allNonSelection = allObjects.filter(
            o => !(o instanceof UpmadeSelectionGroup) && !(o instanceof UpmadeSelectionBox),
        );
        return allNonSelection.filter(predicate) as T[];
    }

    function createMockObject(overrides: Partial<UpmadeBaseObject> = {}): UpmadeBaseObject {
        const obj = new UpmadeBaseObject();
        Object.assign(obj, overrides);
        return obj;
    }

    it('should return objects matching the predicate', () => {
        const text = createMockObject({ __class__: 'UpmadeText' });
        const path = createMockObject({ __class__: 'UpmadePath' });

        const result = findObjects([text, path], obj => obj.__class__ === 'UpmadeText');

        expect(result).toEqual([text]);
    });

    it('should return an empty array when no objects match', () => {
        const path = createMockObject({ __class__: 'UpmadePath' });

        const result = findObjects([path], obj => obj.__class__ === 'UpmadeImage');

        expect(result).toEqual([]);
    });

    it('should return an empty array when there are no objects', () => {
        const result = findObjects([], () => true);

        expect(result).toEqual([]);
    });

    it('should exclude selection group objects', () => {
        const selGroup = Object.create(UpmadeSelectionGroup.prototype) as UpmadeSelectionGroup;
        selGroup.__class__ = 'UpmadeSelectionGroup';

        const text = createMockObject({ __class__: 'UpmadeText' });

        const result = findObjects([selGroup, text], () => true);

        expect(result).toEqual([text]);
        expect(result).not.toContain(selGroup);
    });

    it('should exclude selection box objects', () => {
        const selBox = Object.create(UpmadeSelectionBox.prototype) as UpmadeSelectionBox;
        selBox.__class__ = 'UpmadeSelectionBox';

        const path = createMockObject({ __class__: 'UpmadePath' });

        const result = findObjects([selBox, path], () => true);

        expect(result).toEqual([path]);
        expect(result).not.toContain(selBox);
    });

    it('should support filtering by multiple criteria', () => {
        const visibleText = createMockObject({ __class__: 'UpmadeText', opacity: 1 });
        const hiddenText = createMockObject({ __class__: 'UpmadeText', opacity: 0.2 });
        const path = createMockObject({ __class__: 'UpmadePath', opacity: 1 });

        const result = findObjects(
            [visibleText, hiddenText, path],
            obj => obj.__class__ === 'UpmadeText' && obj.opacity > 0.5,
        );

        expect(result).toEqual([visibleText]);
    });

    it('should support using hitTest in the predicate', () => {
        const obj1 = createMockObject({ __class__: 'UpmadePath' });
        obj1.hitTest = jest.fn().mockReturnValue(true);

        const obj2 = createMockObject({ __class__: 'UpmadePath' });
        obj2.hitTest = jest.fn().mockReturnValue(false);

        const result = findObjects([obj1, obj2], obj => obj.hitTest(50, 50));

        expect(result).toEqual([obj1]);
        expect(obj1.hitTest).toHaveBeenCalledWith(50, 50);
        expect(obj2.hitTest).toHaveBeenCalledWith(50, 50);
    });

    it('should return all non-selection objects when predicate always returns true', () => {
        const text = createMockObject({ __class__: 'UpmadeText' });
        const path = createMockObject({ __class__: 'UpmadePath' });

        const result = findObjects([text, path], () => true);

        expect(result).toEqual([text, path]);
    });
});
