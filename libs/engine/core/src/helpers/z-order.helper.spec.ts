import { KritzelZOrderHelper, KritzelZOrderItem, KritzelZOrderOperation } from './z-order.helper';
import type { KritzelBaseObject } from '../classes/objects/base-object.class';
import type { KritzelGroup } from '../classes/objects/group.class';

// Items are listed in store order; the order matters for tied zIndex values.
const obj = (id: string, zIndex: number): KritzelZOrderItem => ({ id, zIndex, isGroup: false, childIds: [] });
const grp = (id: string, zIndex: number, childIds: string[]): KritzelZOrderItem => ({ id, zIndex, isGroup: true, childIds });

const reorder = (items: KritzelZOrderItem[], ids: string[], operation: KritzelZOrderOperation) =>
  Object.fromEntries(KritzelZOrderHelper.reorder(items, ids, operation));

const ungroup = (items: KritzelZOrderItem[], groupId: string) => Object.fromEntries(KritzelZOrderHelper.planUngroup(items, [groupId]));

/** Applies planned values. Written objects move to the end of the store order, so ties cannot rely on it. */
function applyUpdates(
  items: KritzelZOrderItem[],
  updates: Map<string, number>,
  change: { add?: KritzelZOrderItem; removeId?: string } = {},
): KritzelZOrderItem[] {
  const remaining = items.filter(item => item.id !== change.removeId);
  const unchanged = remaining.filter(item => !updates.has(item.id));
  const changed = remaining.filter(item => updates.has(item.id)).map(item => ({ ...item, zIndex: updates.get(item.id) }));
  return [...unchanged, ...changed, ...(change.add ? [change.add] : [])];
}

/** Visible (non-group) ids bottom to top as rendered: by zIndex, ties in store order. */
function visibleRenderOrder(items: KritzelZOrderItem[]): string[] {
  return items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !item.isGroup)
    .sort((a, b) => a.item.zIndex - b.item.zIndex || a.index - b.index)
    .map(({ item }) => item.id);
}

const zIndexOf = (items: KritzelZOrderItem[]) => Object.fromEntries(items.map(item => [item.id, item.zIndex]));

describe('KritzelZOrderHelper', () => {
  describe('reorder: ungrouped objects', () => {
    const board = () => [obj('s1', 1), obj('s2', 2), obj('s3', 3)];

    it('U1: forward swaps values with the object above', () => {
      expect(reorder(board(), ['s1'], 'forward')).toEqual({ s2: 1, s1: 2 });
    });

    it('U1: backward swaps values with the object below', () => {
      expect(reorder(board(), ['s3'], 'backward')).toEqual({ s3: 2, s2: 3 });
    });

    it('U1: front moves above the topmost value', () => {
      expect(reorder(board(), ['s1'], 'front')).toEqual({ s1: 4 });
    });

    it('U1: back moves below the lowest value', () => {
      expect(reorder(board(), ['s3'], 'back')).toEqual({ s3: 0 });
    });

    it('U1: back of the middle object only writes the moved object', () => {
      expect(reorder([obj('rect', 1), obj('ell', 2), obj('tri', 3)], ['ell'], 'back')).toEqual({ ell: 0 });
    });

    it('U2: forward reuses the values across a gap', () => {
      expect(reorder([obj('obj', 3), obj('other', 5)], ['obj'], 'forward')).toEqual({ other: 3, obj: 5 });
    });

    it('U2: forward of the topmost object changes nothing', () => {
      expect(reorder([obj('obj', 6), obj('other', 5)], ['obj'], 'forward')).toEqual({});
    });

    it('U2: backward swaps values with the object below', () => {
      expect(reorder([obj('obj', 3), obj('other', 2)], ['obj'], 'backward')).toEqual({ obj: 2, other: 3 });
    });

    it('U3: forward then backward restores all values', () => {
      const items = [obj('below', 1), obj('obj', 3), obj('other', 5)];
      const forward = KritzelZOrderHelper.reorder(items, ['obj'], 'forward');
      expect(Object.fromEntries(forward)).toEqual({ other: 3, obj: 5 });

      const moved = applyUpdates(items, forward);
      const backward = KritzelZOrderHelper.reorder(moved, ['obj'], 'backward');
      expect(zIndexOf(applyUpdates(moved, backward))).toEqual({ below: 1, obj: 3, other: 5 });
    });

    it('U4: forward of a tied object that is already on top in store order separates the tie', () => {
      expect(reorder([obj('other', 3), obj('obj', 3)], ['obj'], 'forward')).toEqual({ obj: 4 });
    });

    it('U4: backward of a tied object that is already at the bottom in store order separates the tie', () => {
      expect(reorder([obj('obj', 5), obj('other', 5)], ['obj'], 'backward')).toEqual({ obj: 4 });
    });

    it('U5: front goes right above the highest value', () => {
      expect(reorder([obj('obj', 1), obj('other', 10)], ['obj'], 'front')).toEqual({ obj: 11 });
    });

    it('U5: back goes right below the lowest value', () => {
      expect(reorder([obj('obj', 5), obj('other', 3)], ['obj'], 'back')).toEqual({ obj: 2 });
    });

    it('U6: each selected object steps past its own neighbour', () => {
      const items = [obj('A', 1), obj('B', 2), obj('C', 3), obj('D', 4), obj('E', 5)];
      expect(reorder(items, ['A', 'D'], 'forward')).toEqual({ B: 1, A: 2, E: 4, D: 5 });
    });

    it('U6: a selection blocked at the top changes nothing', () => {
      expect(reorder([obj('X', 1), obj('U', 2), obj('V', 3)], ['U', 'V'], 'forward')).toEqual({});
    });

    it('U7: front keeps the relative order of the selected objects', () => {
      expect(reorder([obj('X', 1), obj('Y', 2), obj('Z', 3)], ['X', 'Z'], 'front')).toEqual({ X: 3, Z: 4 });
    });

    it('U7: ties between bystanders stay untouched', () => {
      const items = [obj('X', 1), obj('Y', 2), obj('P', 5), obj('Q', 5), obj('Z', 9), obj('W', 10)];
      expect(reorder(items, ['X', 'Z'], 'forward')).toEqual({ Y: 1, X: 2, W: 9, Z: 10 });
    });

    it('front with every object selected changes nothing', () => {
      expect(reorder([obj('X', 1), obj('Y', 2)], ['X', 'Y'], 'front')).toEqual({});
    });

    it('U8: an unknown id changes nothing', () => {
      expect(reorder([obj('Y', 3)], ['N'], 'forward')).toEqual({});
    });

    it('U8: forward out of a tie writes the passed object only', () => {
      expect(reorder([obj('X', 5), obj('Y', 5), obj('Z', 6)], ['X'], 'forward')).toEqual({ Y: 4 });
    });
  });

  describe('reorder: groups', () => {
    // a=1, b=2, G{a,b}=2, X=3
    const g1 = () => [obj('a', 1), obj('b', 2), grp('G', 2, ['a', 'b']), obj('X', 3)];
    // x=1, c=2, d=3, H{c,d}=3, y=4, G{x,H,y}=4, Z=5
    const g5 = () => [obj('x', 1), obj('c', 2), obj('d', 3), grp('H', 3, ['c', 'd']), obj('y', 4), grp('G', 4, ['x', 'H', 'y']), obj('Z', 5)];

    it('G1: forward moves the whole group past the object above', () => {
      expect(reorder(g1(), ['G'], 'forward')).toEqual({ X: 1, a: 2, b: 3, G: 3 });
    });

    it('G1: backward of the object above the group passes the whole group', () => {
      expect(reorder(g1(), ['X'], 'backward')).toEqual({ X: 1, a: 2, b: 3, G: 3 });
    });

    it('G1: front moves all members above the highest value', () => {
      expect(reorder(g1(), ['G'], 'front')).toEqual({ a: 4, b: 5, G: 5 });
    });

    it('G1: forward of the top child inside its group changes nothing', () => {
      expect(reorder(g1(), ['b'], 'forward')).toEqual({});
    });

    it('G1: forward of a child stays inside its group', () => {
      expect(reorder(g1(), ['a'], 'forward')).toEqual({ b: 1, a: 2 });
    });

    it('G2: forward of an object passes the whole group above it', () => {
      const items = [obj('X', 1), obj('a', 2), obj('b', 3), grp('G', 3, ['a', 'b']), obj('Y', 4)];
      expect(reorder(items, ['X'], 'forward')).toEqual({ a: 1, b: 2, G: 2, X: 3 });
    });

    it('G2: back moves all members below the lowest value', () => {
      const items = [obj('X', 1), obj('a', 2), obj('b', 3), grp('G', 3, ['a', 'b'])];
      expect(reorder(items, ['G'], 'back')).toEqual({ a: -1, b: 0, G: 0 });
    });

    describe('G3: front/back of a child stays within its group', () => {
      const items = () => [obj('a', 1), obj('b', 2), obj('c', 3), grp('P', 3, ['a', 'b', 'c']), obj('X', 4)];

      it('front', () => {
        expect(reorder(items(), ['a'], 'front')).toEqual({ b: 1, c: 2, a: 3 });
      });

      it('back', () => {
        expect(reorder(items(), ['c'], 'back')).toEqual({ c: 1, a: 2, b: 3 });
      });
    });

    it('G4: a group passes another group', () => {
      const items = [obj('a', 1), obj('b', 2), grp('A', 2, ['a', 'b']), obj('c', 3), obj('d', 4), grp('B', 4, ['c', 'd'])];
      expect(reorder(items, ['A'], 'forward')).toEqual({ c: 1, d: 2, B: 2, a: 3, b: 4, A: 4 });
    });

    it('G5: a nested group steps within its parent group', () => {
      expect(reorder(g5(), ['H'], 'forward')).toEqual({ y: 2, c: 3, d: 4, H: 4 });
    });

    it('G5: an outer group moves together with its nested group', () => {
      expect(reorder(g5(), ['G'], 'forward')).toEqual({ Z: 1, x: 2, c: 3, d: 4, H: 4, y: 5, G: 5 });
    });

    it('G5: selecting a group together with its descendants moves the group once', () => {
      expect(reorder(g5(), ['G', 'x', 'H', 'c', 'd', 'y'], 'forward')).toEqual({ Z: 1, x: 2, c: 3, d: 4, H: 4, y: 5, G: 5 });
    });

    it('G6: front of two groups keeps their order and band', () => {
      const items = [obj('a', 1), obj('b', 2), grp('A', 2, ['a', 'b']), obj('X', 3), obj('c', 4), obj('d', 5), grp('B', 5, ['c', 'd']), obj('Y', 6)];
      expect(reorder(items, ['A', 'B'], 'front')).toEqual({ a: 7, b: 8, A: 8, c: 9, d: 10, B: 10 });
    });

    it('G7: roots in different scopes each step within their own scope', () => {
      const items = [obj('x', 1), obj('c', 2), obj('d', 3), grp('H', 3, ['c', 'd']), obj('y', 4), grp('G', 4, ['x', 'H', 'y']), obj('X', 5), obj('Z', 6)];
      expect(reorder(items, ['H', 'X'], 'forward')).toEqual({ y: 2, c: 3, d: 4, H: 4, Z: 5, X: 6 });
    });
  });

  describe('planGroup', () => {
    it('GR1: grouping adjacent objects writes nothing', () => {
      const plan = KritzelZOrderHelper.planGroup([obj('W', 0), obj('a', 1), obj('b', 2), obj('X', 3), obj('Y', 4)], ['a', 'b']);

      expect(Object.fromEntries(plan.updates)).toEqual({});
      expect(plan.groupZIndex).toBe(2);
      expect(plan.childIds).toEqual(['a', 'b']);
      expect(plan.parentId).toBeNull();
    });

    it('returns the children bottom to top regardless of selection order', () => {
      const plan = KritzelZOrderHelper.planGroup([obj('W', 0), obj('a', 1), obj('b', 2), obj('X', 3)], ['b', 'a']);
      expect(plan.childIds).toEqual(['a', 'b']);
    });

    it('GR2: interleaved objects drop below the group', () => {
      const plan = KritzelZOrderHelper.planGroup([obj('a', 1), obj('X', 2), obj('b', 3), obj('Y', 4)], ['a', 'b']);

      expect(Object.fromEntries(plan.updates)).toEqual({ X: 1, a: 2 });
      expect(plan.groupZIndex).toBe(3);
      expect(plan.childIds).toEqual(['a', 'b']);
    });

    it('GR3: a group selected together with its children is grouped as one root', () => {
      const plan = KritzelZOrderHelper.planGroup([obj('a', 1), obj('b', 2), grp('H', 2, ['a', 'b']), obj('X', 3)], ['a', 'b', 'H', 'X']);

      expect(Object.fromEntries(plan.updates)).toEqual({});
      expect(plan.groupZIndex).toBe(3);
      expect(plan.childIds).toEqual(['H', 'X']);
    });

    it('GR4: returns null when fewer than two independent objects remain', () => {
      const plan = KritzelZOrderHelper.planGroup([obj('a', 1), obj('b', 2), grp('H', 2, ['a', 'b']), obj('X', 3)], ['H', 'a', 'b']);
      expect(plan).toBeNull();
    });

    it('GR5: grouping a group with a distant object moves the group up to it', () => {
      const plan = KritzelZOrderHelper.planGroup([obj('a', 1), obj('b', 2), grp('H', 2, ['a', 'b']), obj('X', 3), obj('c', 4)], ['H', 'c']);

      expect(Object.fromEntries(plan.updates)).toEqual({ X: 1, a: 2, b: 3, H: 3 });
      expect(plan.groupZIndex).toBe(4);
      expect(plan.childIds).toEqual(['H', 'c']);
    });

    it('puts empty groups after the visible roots', () => {
      const plan = KritzelZOrderHelper.planGroup([obj('a', 1), grp('E', 5, ['gone']), obj('X', 2)], ['E', 'a']);

      expect(Object.fromEntries(plan.updates)).toEqual({});
      expect(plan.groupZIndex).toBe(1);
      expect(plan.childIds).toEqual(['a', 'E']);
    });

    it('returns a null group zIndex when no root has visible members', () => {
      const plan = KritzelZOrderHelper.planGroup([grp('E1', 1, []), grp('E2', 2, ['gone']), obj('X', 3)], ['E1', 'E2']);

      expect(plan.groupZIndex).toBeNull();
      expect(plan.childIds).toEqual(['E1', 'E2']);
    });
  });

  describe('planGroup: nested groups', () => {
    // G{x, H{c, d}, y} and a top-level X.
    const board = () => [obj('x', 1), obj('c', 2), obj('d', 3), grp('H', 3, ['c', 'd']), obj('y', 4), grp('G', 4, ['x', 'H', 'y']), obj('X', 5)];

    it('groups objects of the same group inside that group', () => {
      const plan = KritzelZOrderHelper.planGroup(board(), ['c', 'd']);

      expect(plan.parentId).toBe('H');
      expect(plan.childIds).toEqual(['c', 'd']);
      expect(plan.groupZIndex).toBe(3);
      expect(Object.fromEntries(plan.updates)).toEqual({});
    });

    it('restacks siblings within their parent group', () => {
      const plan = KritzelZOrderHelper.planGroup(board(), ['y', 'x']);

      expect(plan.parentId).toBe('G');
      expect(plan.childIds).toEqual(['x', 'y']);
      expect(plan.groupZIndex).toBe(4);
      expect(Object.fromEntries(plan.updates)).toEqual({ c: 1, d: 2, H: 2, x: 3 });
    });

    it('groups objects from different groups at their common level', () => {
      const plan = KritzelZOrderHelper.planGroup(board(), ['c', 'y']);

      expect(plan.parentId).toBe('G');
      expect(plan.childIds).toEqual(['H', 'y']);
      expect(Object.fromEntries(plan.updates)).toEqual({});
    });

    it('groups an inner group selected with a top-level object as its top-level group', () => {
      const plan = KritzelZOrderHelper.planGroup(board(), ['H', 'X']);

      expect(plan.parentId).toBeNull();
      expect(plan.childIds).toEqual(['G', 'X']);
      expect(plan.groupZIndex).toBe(5);
      expect(Object.fromEntries(plan.updates)).toEqual({});
    });
  });

  describe('planUngroup', () => {
    it('separates members of several dissolved groups that share a zIndex', () => {
      // Pasted by older versions: children above their group, colliding with the next group.
      const items = [grp('G1', 10, ['a', 'b']), obj('a', 11), obj('b', 12), grp('G2', 11, ['c', 'd']), obj('c', 12), obj('d', 13)];

      expect(Object.fromEntries(KritzelZOrderHelper.planUngroup(items, ['G1', 'G2']))).toEqual({ c: 13, d: 14 });
    });

    it('separates tied members within each of several dissolved groups', () => {
      const items = [obj('a', 2), obj('b', 2), grp('G1', 2, ['a', 'b']), obj('c', 7), obj('d', 7), grp('G2', 7, ['c', 'd']), obj('z', 9)];

      expect(Object.fromEntries(KritzelZOrderHelper.planUngroup(items, ['G1', 'G2']))).toEqual({ b: 3, d: 8 });
    });

    it('UG1: ungrouping a well-formed group writes nothing', () => {
      expect(ungroup([obj('c1', 1), obj('c2', 2), grp('G', 2, ['c1', 'c2']), obj('P', 4), obj('Q', 4)], 'G')).toEqual({});
    });

    it('UG2: separates tied members and keeps the visible order', () => {
      const items = [obj('P', 0), obj('c1', 2), obj('c2', 2), obj('c3', 2), grp('G', 2, ['c1', 'c2', 'c3']), obj('Z3', 3), obj('Z4', 4), obj('Z5', 5)];
      const updates = KritzelZOrderHelper.planUngroup(items, ['G']);
      const after = applyUpdates(items, updates, { removeId: 'G' });
      const z = zIndexOf(after);
      const visibleValues = after.map(item => item.zIndex);

      expect(updates.has('G')).toBe(false);
      expect(z.c1).toBeLessThan(z.c2);
      expect(z.c2).toBeLessThan(z.c3);
      expect(new Set(visibleValues).size).toBe(visibleValues.length);
      expect(visibleRenderOrder(after)).toEqual(visibleRenderOrder(items));
    });

    it('ignores ids that are unknown or not a group', () => {
      const items = [obj('a', 1), obj('b', 1)];
      expect(ungroup(items, 'missing')).toEqual({});
      expect(ungroup(items, 'a')).toEqual({});
    });
  });

  describe('reorder: legacy data', () => {
    it('L1: a group above its interleaved members is consolidated', () => {
      const items = [obj('A1', 1), obj('B', 2), obj('A2', 3), obj('D', 4), grp('G', 5, ['A1', 'A2'])];
      expect(reorder(items, ['G'], 'forward')).toEqual({ B: 1, D: 2, A1: 3, A2: 4, G: 4 });
    });

    it('L2: forward passes a group ranked by its top member, not by its own value', () => {
      const items = [obj('U', 0), obj('a', 1), obj('b', 2), obj('X', 3), grp('GA', 4, ['a', 'b'])];
      expect(reorder(items, ['U'], 'forward')).toEqual({ a: 0, b: 1, GA: 1, U: 2 });
    });

    it('L3: forward of an interleaved top group only consolidates it', () => {
      const items = [obj('a', 1), obj('X', 2), obj('b', 3), grp('A', 4, ['a', 'b'])];
      expect(reorder(items, ['A'], 'forward')).toEqual({ a: 3, b: 4 });
    });

    it('L4: backward past a group stored below its children with a tie', () => {
      const items = [grp('P', 10, ['c1', 'c2']), obj('c1', 11), obj('R', 11), obj('c2', 12), obj('Y', 13)];
      expect(reorder(items, ['Y'], 'backward')).toEqual({ R: 10, Y: 11, c1: 12, c2: 13, P: 13 });
    });

    it('L5: an empty group is never a neighbour', () => {
      const items = [obj('U', 1), grp('E', 2, ['gone']), obj('X', 3)];
      expect(reorder(items, ['U'], 'forward')).toEqual({ X: 1, U: 3 });
    });

    describe('L6: front/back of a child in an interleaved group', () => {
      const items = () => [obj('a', 1), obj('X', 2), obj('b', 3), grp('P', 3, ['a', 'b']), obj('Y', 4)];

      it('front', () => {
        expect(reorder(items(), ['a'], 'front')).toEqual({ X: 1, b: 2, a: 3 });
      });

      it('back', () => {
        expect(reorder(items(), ['b'], 'back')).toEqual({ b: 1, a: 2, X: 3, P: 2 });
      });
    });

    it('repairs fully tied group members when an object passes the group', () => {
      const items = [obj('P', 0), obj('U', 1), obj('c1', 2), obj('c2', 2), obj('c3', 2), grp('G', 2, ['c1', 'c2', 'c3']), obj('Z3', 3), obj('Z4', 4)];
      expect(reorder(items, ['U'], 'forward')).toEqual({ c1: 1, c3: 3, G: 3, U: 4, Z3: 5, Z4: 6 });
    });

    it('front goes above a legacy group object stored at max + 1', () => {
      const items = [obj('a', 1), obj('b', 2), obj('X', 3), grp('G', 4, ['a', 'b']), obj('Y', 0)];
      expect(reorder(items, ['Y'], 'front')).toEqual({ Y: 5 });
    });

    it('tolerates self references and cycles in childIds', () => {
      const items = [grp('G1', 1, ['G1', 'G2', 'a']), grp('G2', 2, ['G1', 'b']), obj('a', 1), obj('b', 2), obj('c', 3)];
      const operations: KritzelZOrderOperation[] = ['forward', 'backward', 'front', 'back'];

      for (const operation of operations) {
        const after = applyUpdates(items, KritzelZOrderHelper.reorder(items, ['G1', 'G2', 'c'], operation));
        const visibleValues = after.filter(item => !item.isGroup).map(item => item.zIndex);
        expect(new Set(visibleValues).size).toBe(visibleValues.length);
      }
    });
  });

  describe('compareStackOrder', () => {
    const object = (id: string, zIndex: number) => ({ id, zIndex, __class__: 'KritzelShape' }) as unknown as KritzelBaseObject;
    const group = (id: string, zIndex: number) => ({ id, zIndex, __class__: 'KritzelGroup', childIds: [] }) as unknown as KritzelBaseObject;

    it('sorts a group after a non-group with the same zIndex', () => {
      expect(KritzelZOrderHelper.compareStackOrder(group('G', 2), object('b', 2))).toBeGreaterThan(0);
      expect(KritzelZOrderHelper.compareStackOrder(object('b', 2), group('G', 2))).toBeLessThan(0);
    });

    it('sorts by zIndex otherwise', () => {
      expect(KritzelZOrderHelper.compareStackOrder(group('G', 1), object('b', 2))).toBeLessThan(0);
      expect(KritzelZOrderHelper.compareStackOrder(object('a', 3), group('G', 2))).toBeGreaterThan(0);
      expect(KritzelZOrderHelper.compareStackOrder(object('a', 2), object('b', 2))).toBe(0);
    });

    it('keeps the input order of tied non-groups when sorting', () => {
      const sorted = [group('G', 2), object('b', 2), object('c', 2), object('a', 1)].sort(KritzelZOrderHelper.compareStackOrder);
      expect(sorted.map(item => item.id)).toEqual(['a', 'b', 'c', 'G']);
    });
  });

  describe('allocate / stackAnchor / toItem', () => {
    interface FakeObject {
      id: string;
      zIndex: number;
      __class__: string;
      childIds?: string[];
      kids?: FakeObject[];
    }

    const fakeObject = (id: string, zIndex = 0): FakeObject => ({ id, zIndex, __class__: 'KritzelShape' });
    const fakeGroup = (id: string, kids: FakeObject[], zIndex = 0): FakeObject => ({
      id,
      zIndex,
      __class__: 'KritzelGroup',
      childIds: kids.map(kid => kid.id),
      kids,
    });
    const asObject = (fake: FakeObject) => fake as unknown as KritzelBaseObject;
    const getChildren = (group: KritzelGroup) => ((group as unknown as FakeObject).kids ?? []) as unknown as KritzelBaseObject[];

    describe('allocate', () => {
      it('assigns consecutive values bottom to top and gives groups their top member value', () => {
        const r1 = fakeObject('r1');
        const r2 = fakeObject('r2');
        const r3 = fakeObject('r3');
        const r4 = fakeObject('r4');
        const inner = fakeGroup('inner', [r2, r3]);
        const group = fakeGroup('group', [r1, inner, r4]);

        const next = KritzelZOrderHelper.allocate(asObject(group), 5, getChildren);

        expect(next).toBe(9);
        expect({ r1: r1.zIndex, r2: r2.zIndex, r3: r3.zIndex, inner: inner.zIndex, r4: r4.zIndex, group: group.zIndex }).toEqual({
          r1: 5,
          r2: 6,
          r3: 7,
          inner: 7,
          r4: 8,
          group: 8,
        });
      });

      it('gives an empty group its own slot', () => {
        const empty = fakeGroup('empty', []);

        expect(KritzelZOrderHelper.allocate(asObject(empty), 3, getChildren)).toBe(4);
        expect(empty.zIndex).toBe(3);
      });

      it('gives a nested empty group its own slot between its siblings', () => {
        const a = fakeObject('a');
        const empty = fakeGroup('empty', []);
        const b = fakeObject('b');
        const group = fakeGroup('group', [a, empty, b]);

        expect(KritzelZOrderHelper.allocate(asObject(group), 1, getChildren)).toBe(4);
        expect({ a: a.zIndex, empty: empty.zIndex, b: b.zIndex, group: group.zIndex }).toEqual({ a: 1, empty: 2, b: 3, group: 3 });
      });

      it('assigns a plain object the start value', () => {
        const object = fakeObject('o', 42);

        expect(KritzelZOrderHelper.allocate(asObject(object), 7, getChildren)).toBe(8);
        expect(object.zIndex).toBe(7);
      });
    });

    describe('stackAnchor', () => {
      it('returns the own zIndex of a visible object', () => {
        expect(KritzelZOrderHelper.stackAnchor(asObject(fakeObject('o', 4)), getChildren)).toBe(4);
      });

      it('returns the highest zIndex of the visible descendants of a group, ignoring its own value', () => {
        const group = fakeGroup('G', [fakeObject('a', 1), fakeGroup('H', [fakeObject('b', 7), fakeObject('c', 3)], 2), fakeObject('d', 5)], 99);
        expect(KritzelZOrderHelper.stackAnchor(asObject(group), getChildren)).toBe(7);
      });

      it('falls back to the own zIndex of an empty group', () => {
        expect(KritzelZOrderHelper.stackAnchor(asObject(fakeGroup('E', [], 6)), getChildren)).toBe(6);
        expect(KritzelZOrderHelper.stackAnchor(asObject(fakeGroup('G', [fakeGroup('E', [], 9)], 6)), getChildren)).toBe(6);
      });
    });

    describe('toItem', () => {
      it('copies the childIds of a group', () => {
        const group = fakeGroup('G', [fakeObject('a'), fakeObject('b')], 2);
        const item = KritzelZOrderHelper.toItem(asObject(group));

        expect(item).toEqual({ id: 'G', zIndex: 2, isGroup: true, childIds: ['a', 'b'] });
        expect(item.childIds).not.toBe(group.childIds);
      });

      it('uses empty childIds for a non-group', () => {
        expect(KritzelZOrderHelper.toItem(asObject(fakeObject('o', 3)))).toEqual({ id: 'o', zIndex: 3, isGroup: false, childIds: [] });
      });
    });
  });

  describe('fuzz', () => {
    /** Deterministic PRNG (31-bit LCG) so failures are reproducible. */
    class Random {
      constructor(private state: number) {}

      next(): number {
        this.state = (Math.imul(this.state, 1103515245) + 12345) & 0x7fffffff;
        return this.state / 0x80000000;
      }

      int(min: number, max: number): number {
        return min + Math.floor(this.next() * (max - min + 1));
      }

      pick<T>(list: T[]): T {
        return list[Math.floor(this.next() * list.length)];
      }

      shuffle<T>(list: T[]): T[] {
        for (let i = list.length - 1; i > 0; i--) {
          const j = Math.floor(this.next() * (i + 1));
          [list[i], list[j]] = [list[j], list[i]];
        }
        return list;
      }
    }

    /** Ideal stacking model: sibling lists bottom to top. */
    interface ModelNode {
      id: string;
      kids?: ModelNode[];
    }

    const visibleIds = (node: ModelNode): string[] => (node.kids ? node.kids.flatMap(visibleIds) : [node.id]);
    const subtreeIds = (node: ModelNode): string[] => (node.kids ? [node.id, ...node.kids.flatMap(subtreeIds)] : [node.id]);
    const allGroups = (roots: ModelNode[]): ModelNode[] => roots.filter(node => node.kids).flatMap(node => [node, ...allGroups(node.kids)]);

    const findNode = (nodes: ModelNode[], id: string): ModelNode | null => {
      for (const node of nodes) {
        const found = node.id === id ? node : node.kids ? findNode(node.kids, id) : null;
        if (found) return found;
      }
      return null;
    };
    const siblingsOf = (roots: ModelNode[], id: string): ModelNode[] | null => {
      if (roots.some(node => node.id === id)) return roots;
      for (const group of allGroups(roots)) {
        if (group.kids.some(kid => kid.id === id)) return group.kids;
      }
      return null;
    };
    const ancestorsOf = (roots: ModelNode[], id: string): string[] => {
      const owner = allGroups(roots).find(group => group.kids.some(kid => kid.id === id));
      return owner ? [owner.id, ...ancestorsOf(roots, owner.id)] : [];
    };

    let idCounter = 0;

    function generateNode(random: Random, depth: number): ModelNode {
      if (depth < 3 && random.next() < 0.3) {
        const count = random.int(1, 3) + (depth === 0 ? 1 : 0);
        return { id: `g${idCounter++}`, kids: Array.from({ length: count }, () => generateNode(random, depth + 1)) };
      }
      return { id: `o${idCounter++}` };
    }

    /** Well-formed items: unique visible values with random gaps, group = top member, shuffled store and childIds. */
    function toWellFormedItems(random: Random, roots: ModelNode[]): KritzelZOrderItem[] {
      const values = new Map<string, number>();
      let value = random.int(-3, 5);
      for (const id of roots.flatMap(visibleIds)) {
        values.set(id, value);
        value += 1 + (random.next() < 0.3 ? random.int(1, 3) : 0);
      }
      const nodes = roots.flatMap(function walk(node: ModelNode): ModelNode[] {
        return node.kids ? [node, ...node.kids.flatMap(walk)] : [node];
      });
      const items = nodes.map(node =>
        node.kids
          ? grp(node.id, Math.max(...visibleIds(node).map(id => values.get(id))), random.shuffle(node.kids.map(kid => kid.id)))
          : obj(node.id, values.get(node.id)),
      );
      return random.shuffle(items);
    }

    /** Group hierarchy with the helper's rules: first parent wins, dangling ids and cycles are ignored. */
    function buildTree(items: KritzelZOrderItem[]) {
      const byId = new Map(items.map(item => [item.id, item]));
      const parentOf = new Map<string, string>();
      for (const group of items.filter(item => item.isGroup)) {
        for (const childId of group.childIds) {
          if (!byId.has(childId) || parentOf.has(childId)) continue;
          let cyclic = false;
          for (let ancestor: string | undefined = group.id; ancestor !== undefined; ancestor = parentOf.get(ancestor)) {
            cyclic = cyclic || ancestor === childId;
          }
          if (!cyclic) parentOf.set(childId, group.id);
        }
      }
      const visibleMembers = (id: string): string[] =>
        byId.get(id).isGroup ? [...new Set(byId.get(id).childIds)].filter(childId => parentOf.get(childId) === id).flatMap(visibleMembers) : [id];
      const roots = items.filter(item => !parentOf.has(item.id)).map(item => item.id);
      return { byId, parentOf, visibleMembers, roots };
    }

    /** Top-level units with visible members, sorted by their topmost visible member. */
    function rootAnchorOrder(items: KritzelZOrderItem[]): string[] {
      const tree = buildTree(items);
      const position = new Map(visibleRenderOrder(items).map((id, index) => [id, index]));
      const anchor = (id: string) => Math.max(...tree.visibleMembers(id).map(member => position.get(member)));
      return tree.roots.filter(id => tree.visibleMembers(id).length > 0).sort((a, b) => anchor(a) - anchor(b));
    }

    /** Checks I1 (unique visible values), I2 (contiguous group bands) and I3 (group value = top member). */
    function invariantViolation(items: KritzelZOrderItem[]): string | null {
      const tree = buildTree(items);
      const order = visibleRenderOrder(items);
      const values = order.map(id => tree.byId.get(id).zIndex);
      if (new Set(values).size !== values.length) {
        return 'I1: duplicate visible zIndex';
      }
      const position = new Map(order.map((id, index) => [id, index]));
      for (const group of items.filter(item => item.isGroup)) {
        const members = tree.visibleMembers(group.id);
        if (members.length === 0) {
          return `group ${group.id} has no visible members`;
        }
        const positions = members.map(id => position.get(id));
        if (Math.max(...positions) - Math.min(...positions) + 1 !== members.length) {
          return `I2: members of ${group.id} are not contiguous`;
        }
        const top = Math.max(...members.map(id => tree.byId.get(id).zIndex));
        if (group.zIndex !== top) {
          return `I3: ${group.id} has zIndex ${group.zIndex}, its top member ${top}`;
        }
      }
      return null;
    }

    const show = (items: KritzelZOrderItem[]) =>
      items.map(item => (item.isGroup ? `[${item.id}{${item.childIds.join(',')}}]:${item.zIndex}` : `${item.id}:${item.zIndex}`)).join(' ');

    /** Applies a z-order operation to the model; returns the ids that may be written (moved units and passed units). */
    function reorderModel(roots: ModelNode[], selection: string[], operation: KritzelZOrderOperation): Set<string> {
      const unique = [...new Set(selection)];
      const selected = unique.filter(id => !ancestorsOf(roots, id).some(ancestor => unique.includes(ancestor)));
      const byList = new Map<ModelNode[], Set<string>>();
      for (const id of selected) {
        const list = siblingsOf(roots, id);
        byList.set(list, (byList.get(list) ?? new Set()).add(id));
      }

      const allowed = new Set<string>();
      byList.forEach((chosen, list) => {
        const before = list.map(node => node.id);
        if (operation === 'forward') {
          for (let i = list.length - 2; i >= 0; i--) {
            if (chosen.has(list[i].id) && !chosen.has(list[i + 1].id)) [list[i], list[i + 1]] = [list[i + 1], list[i]];
          }
        } else if (operation === 'backward') {
          for (let i = 1; i < list.length; i++) {
            if (chosen.has(list[i].id) && !chosen.has(list[i - 1].id)) [list[i], list[i - 1]] = [list[i - 1], list[i]];
          }
        } else {
          const moved = list.filter(node => chosen.has(node.id));
          const others = list.filter(node => !chosen.has(node.id));
          if (others.length > 0) list.splice(0, list.length, ...(operation === 'front' ? [...others, ...moved] : [...moved, ...others]));
        }
        const after = list.map(node => node.id);

        chosen.forEach(id => subtreeIds(findNode(roots, id)).forEach(write => allowed.add(write)));
        // Root front/back only writes the moved objects; everything else may also write the units it passed.
        if (list === roots && (operation === 'front' || operation === 'back')) return;
        for (const other of before.filter(id => !chosen.has(id))) {
          const passed = [...chosen].some(id => (before.indexOf(other) < before.indexOf(id)) !== (after.indexOf(other) < after.indexOf(id)));
          if (passed) subtreeIds(findNode(roots, other)).forEach(write => allowed.add(write));
        }
      });
      return allowed;
    }

    /** Groups top-level model nodes at the slot of the topmost one; returns the allowed writes and child order. */
    function groupModel(roots: ModelNode[], selection: string[], groupId: string, renderOrder: string[]) {
      const position = new Map(renderOrder.map((id, index) => [id, index]));
      const anchor = (node: ModelNode) => Math.max(...visibleIds(node).map(id => position.get(id)));
      const chosen = roots.filter(node => selection.includes(node.id)).sort((a, b) => anchor(a) - anchor(b));
      const lowest = Math.min(...chosen.flatMap(visibleIds).map(id => position.get(id)));
      const topRoot = chosen[chosen.length - 1];
      const top = anchor(topRoot);

      const allowed = new Set(chosen.flatMap(subtreeIds));
      for (const node of roots.filter(root => !selection.includes(root.id))) {
        if (visibleIds(node).some(id => position.get(id) > lowest && position.get(id) < top)) subtreeIds(node).forEach(id => allowed.add(id));
      }

      const rest = roots.filter(node => !selection.includes(node.id));
      const slot = roots.slice(0, roots.indexOf(topRoot)).filter(node => !selection.includes(node.id)).length;
      rest.splice(slot, 0, { id: groupId, kids: chosen });
      roots.splice(0, roots.length, ...rest);
      return { allowed, childIds: chosen.map(node => node.id) };
    }

    it('keeps I1-I3 and the ideal stacking order on well-formed boards', () => {
      const random = new Random(1);
      const failures: string[] = [];
      const operations: KritzelZOrderOperation[] = ['forward', 'backward', 'front', 'back'];

      for (let board = 0; board < 250 && failures.length === 0; board++) {
        const roots = Array.from({ length: random.int(2, 9) }, () => generateNode(random, 0));
        let items = toWellFormedItems(random, roots);

        for (let step = 0; step < 25 && failures.length === 0; step++) {
          const before = items;
          const groups = allGroups(roots);
          const choice = random.next();
          let description: string;
          let updates: Map<string, number>;
          let allowed: Set<string>;

          if (choice < 0.12 && roots.length >= 2) {
            const selection = random.shuffle(roots.map(node => node.id)).slice(0, random.int(2, Math.min(3, roots.length)));
            const groupId = `N${idCounter++}`;
            const expected = groupModel(roots, selection, groupId, visibleRenderOrder(items));
            const plan = KritzelZOrderHelper.planGroup(items, selection);
            description = `group(${selection})`;
            if (!plan || plan.childIds.join() !== expected.childIds.join()) {
              failures.push(`${description}: childIds ${plan?.childIds} instead of ${expected.childIds} on ${show(before)}`);
              break;
            }
            updates = plan.updates;
            allowed = expected.allowed;
            items = applyUpdates(items, updates, { add: grp(groupId, plan.groupZIndex, plan.childIds) });
          } else if (choice < 0.2 && roots.some(node => node.kids)) {
            const group = random.pick(roots.filter(node => node.kids));
            description = `ungroup(${group.id})`;
            updates = KritzelZOrderHelper.planUngroup(items, [group.id]);
            allowed = new Set();
            roots.splice(roots.indexOf(group), 1, ...group.kids);
            items = applyUpdates(items, updates, { removeId: group.id });
          } else {
            const operation = random.pick(operations);
            const mode = random.next();
            let selection: string[];
            if (mode < 0.6 || groups.length === 0) {
              selection = random.shuffle(roots.map(node => node.id)).slice(0, random.int(1, Math.min(3, roots.length)));
            } else if (mode < 0.85) {
              selection = [random.pick(random.pick(groups).kids).id];
            } else {
              const group = random.pick(groups);
              selection = [group.id, ...group.kids.map(kid => kid.id)];
            }
            description = `${operation}(${selection})`;
            updates = KritzelZOrderHelper.reorder(items, selection, operation);
            allowed = reorderModel(roots, selection, operation);
            items = applyUpdates(items, updates);
          }

          const unexpected = [...updates.keys()].filter(id => !allowed.has(id));
          const violation =
            (unexpected.length > 0 ? `unexpected writes ${unexpected}` : null) ??
            invariantViolation(items) ??
            (visibleRenderOrder(items).join() !== roots.flatMap(visibleIds).join() ? `order ${visibleRenderOrder(items)} != ideal ${roots.flatMap(visibleIds)}` : null);
          if (violation) {
            failures.push(`${description}: ${violation}\n  before ${show(before)}\n  after  ${show(items)}`);
          }
        }
      }

      expect(failures).toEqual([]);
    });

    it('restores all values when a top-level unit steps forward and back again', () => {
      const random = new Random(2);
      const failures: string[] = [];

      for (let board = 0; board < 2000 && failures.length === 0; board++) {
        const roots = Array.from({ length: random.int(3, 9) }, () => generateNode(random, 0));
        const items = toWellFormedItems(random, roots);
        const unit = random.pick(roots.slice(0, -1)).id;

        const moved = applyUpdates(items, KritzelZOrderHelper.reorder(items, [unit], 'forward'));
        const restored = applyUpdates(moved, KritzelZOrderHelper.reorder(moved, [unit], 'backward'));

        const original = zIndexOf(items);
        if (restored.some(item => item.zIndex !== original[item.id])) {
          failures.push(`forward/backward(${unit})\n  before ${show(items)}\n  moved  ${show(moved)}\n  after  ${show(restored)}`);
        }
      }

      expect(failures).toEqual([]);
    });

    it('handles legacy boards without throwing, with unique written values and single-step moves', () => {
      const random = new Random(5);
      const failures: string[] = [];
      const operations = ['forward', 'backward', 'front', 'back', 'group', 'ungroup'] as const;

      /** Random values for every object (ties, group objects anywhere), empty groups, dangling ids, double parents. */
      const legacyBoard = (): KritzelZOrderItem[] => {
        const roots = Array.from({ length: random.int(2, 8) }, () => generateNode(random, 0));
        const nodes = roots.flatMap(function walk(node: ModelNode): ModelNode[] {
          return node.kids ? [node, ...node.kids.flatMap(walk)] : [node];
        });
        const items = nodes.map(node => (node.kids ? grp(node.id, random.int(0, 12), node.kids.map(kid => kid.id)) : obj(node.id, random.int(0, 12))));
        if (random.next() < 0.3) {
          items.push(grp(`E${idCounter++}`, random.int(0, 12), ['dangling']));
        }
        const groups = items.filter(item => item.isGroup);
        const visible = items.filter(item => !item.isGroup);
        if (random.next() < 0.1 && groups.length > 1 && visible.length > 0) {
          groups[1].childIds.push(random.pick(visible).id);
        }
        return random.shuffle(items);
      };

      for (let board = 0; board < 1000 && failures.length === 0; board++) {
        let items = legacyBoard();

        for (let step = 0; step < 10 && failures.length === 0; step++) {
          const tree = buildTree(items);
          const operation = random.pick([...operations]);
          const before = items;
          const anchorsBefore = rootAnchorOrder(items);
          const renderBefore = visibleRenderOrder(items);
          let selection: string[];
          let updates: Map<string, number>;

          try {
            if (operation === 'group') {
              if (tree.roots.length < 2) continue;
              selection = random.shuffle([...tree.roots]).slice(0, random.int(2, Math.min(3, tree.roots.length)));
              const plan = KritzelZOrderHelper.planGroup(items, selection);
              updates = plan.updates;
              const fallback = Math.max(...items.map(item => item.zIndex)) + 1;
              items = applyUpdates(items, updates, { add: grp(`N${idCounter++}`, plan.groupZIndex ?? fallback, plan.childIds) });
            } else if (operation === 'ungroup') {
              const groups = items.filter(item => item.isGroup);
              if (groups.length === 0) continue;
              selection = [random.pick(groups).id];
              updates = KritzelZOrderHelper.planUngroup(items, [selection[0]]);
              items = applyUpdates(items, updates, { removeId: selection[0] });
            } else {
              selection = random.next() < 0.7 ? [random.pick(tree.roots)] : [random.pick(items).id];
              updates = KritzelZOrderHelper.reorder(items, selection, operation);
              items = applyUpdates(items, updates);
            }
          } catch (error) {
            failures.push(`${operation}(${selection}) threw ${error}\n  board ${show(before)}`);
            break;
          }

          const report = (problem: string) => failures.push(`${operation}(${selection}): ${problem}\n  before ${show(before)}\n  after  ${show(items)}`);

          // Every written visible object ends up with a value no other visible object has.
          const counts = new Map<number, number>();
          items.filter(item => !item.isGroup).forEach(item => counts.set(item.zIndex, (counts.get(item.zIndex) ?? 0) + 1));
          const tied = items.filter(item => !item.isGroup && updates.has(item.id) && counts.get(item.zIndex) > 1);
          if (tied.length > 0) {
            report(`written objects tied: ${tied.map(item => item.id)}`);
            continue;
          }

          const unit = selection[0];
          const isTopLevelUnit = !tree.parentOf.has(unit) && tree.visibleMembers(unit).length > 0;
          if (!isTopLevelUnit || operation === 'group' || operation === 'ungroup') continue;

          // A single forward/backward step swaps the unit with exactly one neighbour (none at the edge).
          if (operation === 'forward' || operation === 'backward') {
            const index = anchorsBefore.indexOf(unit);
            const neighbour = operation === 'forward' ? index + 1 : index - 1;
            const expected = [...anchorsBefore];
            if (neighbour >= 0 && neighbour < expected.length) {
              [expected[index], expected[neighbour]] = [expected[neighbour], expected[index]];
            }
            if (rootAnchorOrder(items).join() !== expected.join()) {
              report(`anchor order ${rootAnchorOrder(items)} instead of ${expected}`);
              continue;
            }
          }

          // The unit's anchor never moves against the direction of the operation.
          const members = new Set(tree.visibleMembers(unit));
          const anchorPosition = (order: string[]) => Math.max(...order.map((id, index) => (members.has(id) ? index : -1)));
          const renderAfter = visibleRenderOrder(items);
          const upward = operation === 'forward' || operation === 'front';
          const wrongSide = renderBefore.filter(id => {
            if (members.has(id)) return false;
            const wasBelow = renderBefore.indexOf(id) < anchorPosition(renderBefore);
            const isBelow = renderAfter.indexOf(id) < anchorPosition(renderAfter);
            return upward ? wasBelow && !isBelow : !wasBelow && isBelow;
          });
          if (wrongSide.length > 0) {
            report(`anchor moved against the operation past ${wrongSide}`);
          }
        }
      }

      expect(failures).toEqual([]);
    });
  });
});
