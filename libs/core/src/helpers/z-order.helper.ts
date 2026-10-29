import type { KritzelBaseObject } from '../classes/objects/base-object.class';
import { KritzelGroup } from '../classes/objects/group.class';

/**
 * Minimal view of an object needed to plan z-order changes.
 */
export interface KritzelZOrderItem {
  id: string;
  zIndex: number;
  isGroup: boolean;
  childIds: string[];
}

/**
 * Z-order operations that move layers relative to their siblings.
 */
export type KritzelZOrderOperation = 'forward' | 'backward' | 'front' | 'back';

/**
 * Result of planning a new group.
 */
export interface KritzelGroupZOrderPlan {
  /** Ids of the objects to group, ordered bottom to top. */
  childIds: string[];
  /** The group that contains all grouped objects and receives the new group, or null for the top level. */
  parentId: string | null;
  /** zIndex for the new group object, or null when it has no visible member. */
  groupZIndex: number | null;
  /** New zIndex values of existing objects, keyed by id. */
  updates: Map<string, number>;
}

/**
 * Plans z-order changes for objects and groups.
 *
 * Model: visible (non-group) objects have unique zIndex values, the visible members of a group form one
 * contiguous run in the stack (nested groups inside their parent's run), and a group object's own zIndex
 * equals the highest zIndex of its visible members. A group is therefore one layer: it is ranked by its top
 * member and always moves together with all of its descendants. Data that does not follow the model yet
 * (ties, interleaved or empty groups) is tolerated and normalized when a z-order operation touches it.
 *
 * All planning functions are pure; they return the zIndex values that have to change, keyed by id.
 */
export class KritzelZOrderHelper {
  /**
   * Compares two objects by stacking order. On equal zIndex a group sorts above its tied top member,
   * so its (empty) wrapper and outline paint over its children.
   */
  static compareStackOrder(a: KritzelBaseObject<any>, b: KritzelBaseObject<any>): number {
    return a.zIndex - b.zIndex || Number(KritzelZOrderHelper.isGroup(a)) - Number(KritzelZOrderHelper.isGroup(b));
  }

  /**
   * Plans a z-order operation for the given objects. Every root moves as one layer within its parent:
   * a top-level object or group among the top-level layers, a grouped object among its group's children.
   * Multiple selected layers step individually (each passes the next unselected layer).
   * @param items - All objects of the workspace in store order.
   * @param rootIds - Ids of the objects to move (e.g. the current selection).
   * @param operation - The z-order operation.
   * @returns New zIndex values keyed by object id; empty when nothing has to change.
   */
  static reorder(items: KritzelZOrderItem[], rootIds: string[], operation: KritzelZOrderOperation): Map<string, number> {
    const planner = new KritzelZOrderPlanner(items);
    planner.reorder(planner.tree.resolveRoots(rootIds), operation);
    return planner.finish();
  }

  /**
   * Plans grouping the given objects. Objects from different groups are grouped at the deepest level that
   * contains all of them (e.g. an inner group selected with a top-level object groups its top-level group),
   * so every object keeps a single parent. Their members are made contiguous at the position of the topmost
   * object; objects that were stacked in between end up below the group.
   * @param items - All objects of the workspace in store order.
   * @param rootIds - Ids of the objects to group.
   * @returns The plan, or null when fewer than two independent objects remain.
   */
  static planGroup(items: KritzelZOrderItem[], rootIds: string[]): KritzelGroupZOrderPlan | null {
    const planner = new KritzelZOrderPlanner(items);
    const resolved = planner.tree.resolveRoots(rootIds);
    if (resolved.length < 2) {
      return null;
    }

    const { parentId, roots } = planner.tree.liftToCommonScope(resolved);
    if (roots.length < 2) {
      return null;
    }

    const childIds = planner.group(roots);
    const updates = planner.finish();
    const visibleMembers = childIds.flatMap(id => planner.tree.visibleMembers(id));
    const groupZIndex = visibleMembers.length > 0 ? Math.max(...visibleMembers.map(id => updates.get(id) ?? planner.tree.item(id).zIndex)) : null;

    return { childIds, parentId, groupZIndex, updates };
  }

  /**
   * Plans ungrouping groups. Their members keep their stacking order; members that share a zIndex get unique values.
   * @param items - All objects of the workspace in store order.
   * @param groupIds - Ids of the groups that are dissolved.
   * @returns New zIndex values keyed by object id; empty when nothing has to change.
   */
  static planUngroup(items: KritzelZOrderItem[], groupIds: string[]): Map<string, number> {
    const planner = new KritzelZOrderPlanner(items);
    planner.ungroup(groupIds);
    return planner.finish(new Set(groupIds));
  }

  /**
   * Assigns zIndex values to an object that is about to be inserted, including all of its pending
   * descendants: visible objects get consecutive values (children bottom to top, in the given order)
   * and every group gets the value of its topmost visible member.
   * @param object - The object to allocate values for.
   * @param start - The first free zIndex.
   * @param getChildren - Returns the children of a group in bottom-to-top order.
   * @returns The next free zIndex.
   */
  static allocate(object: KritzelBaseObject<any>, start: number, getChildren: (group: KritzelGroup) => KritzelBaseObject<any>[]): number {
    if (!KritzelZOrderHelper.isGroup(object)) {
      object.zIndex = start;
      return start + 1;
    }

    let next = start;
    for (const child of getChildren(object)) {
      next = KritzelZOrderHelper.allocate(child, next, getChildren);
    }

    // An empty group still takes a slot so it does not tie with an unrelated object.
    object.zIndex = next > start ? next - 1 : next++;
    return next;
  }

  /**
   * Returns the zIndex at which an object is visible: its own zIndex, or for a group the highest
   * zIndex of its visible descendants (falling back to the group's own value when it has none).
   * @param object - The object to rank.
   * @param getChildren - Returns the children of a group.
   */
  static stackAnchor(object: KritzelBaseObject<any>, getChildren: (group: KritzelGroup) => KritzelBaseObject<any>[]): number {
    if (!KritzelZOrderHelper.isGroup(object)) {
      return object.zIndex;
    }

    const anchors = getChildren(object)
      .filter(child => !KritzelZOrderHelper.isGroup(child) || getChildren(child).length > 0)
      .map(child => KritzelZOrderHelper.stackAnchor(child, getChildren));
    return anchors.length > 0 ? Math.max(...anchors) : object.zIndex;
  }

  /**
   * Maps an object to the minimal z-order view used for planning.
   */
  static toItem(object: KritzelBaseObject<any>): KritzelZOrderItem {
    const isGroup = KritzelZOrderHelper.isGroup(object);
    return { id: object.id, zIndex: object.zIndex, isGroup, childIds: isGroup ? [...(object.childIds ?? [])] : [] };
  }

  private static isGroup(object: KritzelBaseObject<any>): object is KritzelGroup {
    return object instanceof KritzelGroup;
  }
}

/**
 * Group hierarchy derived from the items' childIds. Dangling ids, second parents and cycles are ignored.
 */
class KritzelZOrderTree {
  private readonly byId = new Map<string, KritzelZOrderItem>();
  private readonly parentOf = new Map<string, string>();
  private readonly kids = new Map<string, string[]>();
  private readonly visibleMemo = new Map<string, string[]>();

  constructor(readonly items: KritzelZOrderItem[]) {
    items.forEach(item => this.byId.set(item.id, item));

    for (const group of items) {
      if (!group.isGroup) {
        continue;
      }
      for (const childId of group.childIds) {
        if (this.byId.has(childId) && !this.parentOf.has(childId) && !this.isAncestorOrSelf(childId, group.id)) {
          this.parentOf.set(childId, group.id);
        }
      }
    }

    for (const group of items) {
      if (group.isGroup) {
        this.kids.set(group.id, [...new Set(group.childIds.filter(id => this.parentOf.get(id) === group.id))]);
      }
    }
  }

  has(id: string): boolean {
    return this.byId.has(id);
  }

  item(id: string): KritzelZOrderItem {
    return this.byId.get(id);
  }

  isVisible(id: string): boolean {
    return !this.byId.get(id).isGroup;
  }

  parent(id: string): string | undefined {
    return this.parentOf.get(id);
  }

  children(id: string): string[] {
    return this.kids.get(id) ?? [];
  }

  ancestors(id: string): string[] {
    const result: string[] = [];
    for (let parent = this.parentOf.get(id); parent !== undefined; parent = this.parentOf.get(parent)) {
      result.push(parent);
    }
    return result;
  }

  /** Visible (non-group) objects in the subtree of the given object, including itself. */
  visibleMembers(id: string): string[] {
    let members = this.visibleMemo.get(id);
    if (!members) {
      members = this.isVisible(id) ? [id] : this.children(id).flatMap(childId => this.visibleMembers(childId));
      this.visibleMemo.set(id, members);
    }
    return members;
  }

  hasVisibleMembers(id: string): boolean {
    return this.visibleMembers(id).length > 0;
  }

  /** The layers inside a scope: top-level objects for the root scope (null), otherwise the group's children. */
  unitsOf(scope: string | null): string[] {
    return scope === null ? this.items.filter(item => !this.parentOf.has(item.id)).map(item => item.id) : this.children(scope);
  }

  /** Known ids without duplicates and without objects whose ancestor is also included. */
  resolveRoots(ids: string[]): string[] {
    const known = [...new Set(ids)].filter(id => this.byId.has(id));
    const included = new Set(known);
    return known.filter(id => !this.ancestors(id).some(ancestor => included.has(ancestor)));
  }

  /** Replaces each root with its ancestor directly inside the deepest group that contains all roots. */
  liftToCommonScope(roots: string[]): { parentId: string | null; roots: string[] } {
    const paths = roots.map(id => [...this.ancestors(id).reverse(), id]);
    let depth = 0;
    while (paths.length > 0 && paths.every(path => depth < path.length - 1 && path[depth] === paths[0][depth])) {
      depth++;
    }
    return {
      parentId: depth > 0 ? paths[0][depth - 1] : null,
      roots: [...new Set(paths.map(path => path[depth]))],
    };
  }

  private isAncestorOrSelf(candidate: string, id: string): boolean {
    for (let current: string | undefined = id; current !== undefined; current = this.parentOf.get(current)) {
      if (current === candidate) {
        return true;
      }
    }
    return false;
  }
}

/**
 * Plans a single z-order change. Works on the stacking order of the visible objects: units are moved by
 * removing their visible members and re-inserting them as one contiguous block, and every object whose
 * order changed is renumbered afterwards, reusing the values of the region it moved in.
 */
class KritzelZOrderPlanner {
  readonly tree: KritzelZOrderTree;

  /** Visible object ids, bottom to top. */
  private order: string[];
  private position = new Map<string, number>();
  private readonly current = new Map<string, number>();

  /** Objects whose position changed and that get values reused from their region. */
  private readonly touched = new Set<string>();
  /** Objects moved to the very top/bottom of the root scope that get values beyond all others. */
  private readonly fresh = new Set<string>();
  /** Members of the moved units; preferred to change over bystanders when values have to be repaired. */
  private readonly moving = new Set<string>();

  constructor(items: KritzelZOrderItem[]) {
    this.tree = new KritzelZOrderTree(items);
    items.forEach(item => this.current.set(item.id, item.zIndex));
    this.order = items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !item.isGroup)
      .sort((a, b) => a.item.zIndex - b.item.zIndex || a.index - b.index)
      .map(({ item }) => item.id);
    this.reindex();
  }

  reorder(roots: string[], operation: KritzelZOrderOperation): void {
    const scopes = new Map<string | null, Set<string>>();
    for (const root of roots) {
      this.markMoving(root);
      if (!this.tree.hasVisibleMembers(root)) {
        continue;
      }
      const scope = this.tree.parent(root) ?? null;
      if (!scopes.has(scope)) {
        scopes.set(scope, new Set());
      }
      scopes.get(scope).add(root);
    }

    // Deepest scopes first so a parent moves together with its already reordered children.
    const depth = (scope: string | null) => (scope === null ? -1 : this.tree.ancestors(scope).length);
    const sortedScopes = [...scopes.keys()].sort((a, b) => depth(b) - depth(a));

    for (const scope of sortedScopes) {
      const selected = scopes.get(scope);
      const units = this.sortByAnchor(this.tree.unitsOf(scope).filter(id => this.tree.hasVisibleMembers(id)));

      switch (operation) {
        case 'front':
          this.toFront(scope, [...selected], units);
          break;
        case 'back':
          this.toBack(scope, [...selected], units);
          break;
        case 'forward':
          this.stepForward(scope, selected, units);
          break;
        case 'backward':
          this.stepBackward(scope, selected, units);
          break;
      }
    }
  }

  /** Makes the given roots contiguous at the position of the topmost one; returns them bottom to top. */
  group(roots: string[]): string[] {
    roots.forEach(root => this.markMoving(root));
    const visibleRoots = this.sortByAnchor(roots.filter(id => this.tree.hasVisibleMembers(id)));
    const emptyRoots = roots.filter(id => !this.tree.hasVisibleMembers(id));

    if (visibleRoots.length > 0) {
      const top = this.topmost(visibleRoots);
      this.place(visibleRoots, visibleRoots.flatMap(id => this.band(id)), this.position.get(top));
    }

    return [...visibleRoots, ...emptyRoots];
  }

  /** Keeps the stacking order and only separates members of the groups that share a zIndex. */
  ungroup(groupIds: string[]): void {
    const groups = groupIds.filter(id => this.tree.has(id) && !this.tree.isVisible(id));
    const members = [...new Set(groups.flatMap(id => this.tree.visibleMembers(id)))];
    const counts = new Map<number, number>();
    members.forEach(id => counts.set(this.current.get(id), (counts.get(this.current.get(id)) ?? 0) + 1));
    members.filter(id => counts.get(this.current.get(id)) > 1).forEach(id => this.touched.add(id));
  }

  /**
   * Computes the new values: positional reuse for touched objects, fresh values beyond the extremes for
   * root front/back moves, then the derived values of affected groups.
   * @param removedGroupIds - Groups that are about to be removed and need no value.
   */
  finish(removedGroupIds: Set<string> = new Set()): Map<string, number> {
    const values = new KritzelZOrderValueAssigner(this.order, this.current, this.touched, this.fresh, this.moving, this.tree.items).assign();

    const groups = new Set<string>();
    for (const id of [...this.touched, ...this.fresh]) {
      this.tree.ancestors(id).forEach(ancestor => groups.add(ancestor));
    }
    this.moving.forEach(id => !this.tree.isVisible(id) && groups.add(id));
    removedGroupIds.forEach(id => groups.delete(id));

    for (const groupId of groups) {
      const members = this.tree.visibleMembers(groupId);
      if (members.length > 0) {
        values.set(groupId, Math.max(...members.map(id => values.get(id))));
      }
    }

    const updates = new Map<string, number>();
    values.forEach((zIndex, id) => zIndex !== this.current.get(id) && updates.set(id, zIndex));
    return updates;
  }

  private stepForward(scope: string | null, selected: Set<string>, units: string[]): void {
    for (let i = units.length - 1; i >= 0; i--) {
      const unit = units[i];
      if (!selected.has(unit)) {
        continue;
      }
      if (i === units.length - 1) {
        // Already on top: only normalizes ties or interleaving.
        this.toFront(scope, [unit], units);
        continue;
      }
      const above = units[i + 1];
      if (selected.has(above)) {
        continue;
      }
      this.place([unit, above], [...this.band(above), ...this.band(unit)], this.position.get(this.topmost([above])));
      units[i] = above;
      units[i + 1] = unit;
    }
  }

  private stepBackward(scope: string | null, selected: Set<string>, units: string[]): void {
    for (let i = 0; i < units.length; i++) {
      const unit = units[i];
      if (!selected.has(unit)) {
        continue;
      }
      if (i === 0) {
        // Already at the bottom: only normalizes ties or interleaving.
        this.toBack(scope, [unit], units);
        continue;
      }
      const below = units[i - 1];
      if (selected.has(below)) {
        continue;
      }
      this.place([unit, below], [...this.band(unit), ...this.band(below)], this.position.get(this.topmost([below])));
      units[i] = below;
      units[i - 1] = unit;
    }
  }

  private toFront(scope: string | null, selected: string[], units: string[]): void {
    const selectedSet = new Set(selected);
    if (units.every(unit => selectedSet.has(unit))) {
      return;
    }
    const sorted = this.sortByAnchor(selected);
    const block = sorted.flatMap(id => this.band(id));

    if (scope === null) {
      this.place(sorted, block, this.order.length, false).forEach(id => this.fresh.add(id));
    } else {
      // Right above the scope's topmost member, so nothing in the scope moves down.
      this.place(sorted, block, this.position.get(this.topmost(units)) + 1);
    }
  }

  private toBack(scope: string | null, selected: string[], units: string[]): void {
    const selectedSet = new Set(selected);
    if (units.every(unit => selectedSet.has(unit))) {
      return;
    }
    const sorted = this.sortByAnchor(selected);
    const block = sorted.flatMap(id => this.band(id));

    if (scope === null) {
      this.place(sorted, block, 0, false).forEach(id => this.fresh.add(id));
    } else {
      this.place(sorted, block, this.position.get(this.bottommost(units)));
    }
  }

  /**
   * Removes the visible members of `units` and inserts `block` before every remaining object whose old
   * position is at least `boundary`. Objects that changed sides relative to a moved object are marked as touched.
   * @returns The ids of the moved objects.
   */
  private place(units: string[], block: string[], boundary: number, markPassed = true): Set<string> {
    const removed = new Set(units.flatMap(id => this.tree.visibleMembers(id)));
    const removedPositions = [...removed].map(id => this.position.get(id));
    const minRemoved = Math.min(...removedPositions);
    const maxRemoved = Math.max(...removedPositions);

    // Fast path: a contiguous block that stays in its own range passes nothing else.
    if (removed.size === maxRemoved - minRemoved + 1 && boundary >= minRemoved && boundary <= maxRemoved + 1) {
      block.forEach((id, offset) => {
        this.order[minRemoved + offset] = id;
        this.position.set(id, minRemoved + offset);
      });
      removed.forEach(id => this.touched.add(id));
      return removed;
    }

    const rest = this.order.filter(id => !removed.has(id));
    const slot = rest.filter(id => this.position.get(id) < boundary).length;

    if (markPassed) {
      rest.forEach((id, rank) => {
        const oldPosition = this.position.get(id);
        if ((rank < slot && oldPosition > minRemoved) || (rank >= slot && oldPosition < maxRemoved)) {
          this.touched.add(id);
        }
      });
    }

    this.order = [...rest.slice(0, slot), ...block, ...rest.slice(slot)];
    this.reindex();
    removed.forEach(id => this.touched.add(id));
    return removed;
  }

  /** The visible members of a unit as one contiguous block, nested groups consolidated recursively. */
  private band(id: string): string[] {
    if (this.tree.isVisible(id)) {
      return [id];
    }
    return this.sortByAnchor(this.tree.children(id).filter(childId => this.tree.hasVisibleMembers(childId))).flatMap(childId => this.band(childId));
  }

  /** Sorts units by their topmost visible member. */
  private sortByAnchor(units: string[]): string[] {
    const anchors = new Map(units.map(id => [id, this.position.get(this.topmost([id]))]));
    return [...units].sort((a, b) => anchors.get(a) - anchors.get(b));
  }

  private topmost(units: string[]): string {
    return this.extreme(units, (a, b) => a > b);
  }

  private bottommost(units: string[]): string {
    return this.extreme(units, (a, b) => a < b);
  }

  private extreme(units: string[], isBetter: (a: number, b: number) => boolean): string {
    let best: string | null = null;
    for (const unit of units) {
      for (const id of this.tree.visibleMembers(unit)) {
        if (best === null || isBetter(this.position.get(id), this.position.get(best))) {
          best = id;
        }
      }
    }
    return best;
  }

  private markMoving(root: string): void {
    const visit = (id: string) => {
      this.moving.add(id);
      this.tree.children(id).forEach(visit);
    };
    visit(root);
  }

  private reindex(): void {
    this.position = new Map(this.order.map((id, index) => [id, index]));
  }
}

/**
 * Turns a new stacking order into zIndex values with as few changes as possible.
 */
class KritzelZOrderValueAssigner {
  private readonly values: Map<string, number>;
  private readonly isTouched: boolean[];
  private readonly proposed: number[];

  constructor(
    private readonly order: string[],
    private readonly current: Map<string, number>,
    touched: Set<string>,
    private readonly fresh: Set<string>,
    private readonly moving: Set<string>,
    private readonly items: KritzelZOrderItem[],
  ) {
    this.values = new Map(current);
    this.isTouched = order.map(id => touched.has(id) && !fresh.has(id));
    this.proposed = order.map(id => current.get(id));
  }

  assign(): Map<string, number> {
    this.assignFresh();

    // Touched runs reuse the values of their region in the new order ("swap" semantics).
    for (const [start, end] of this.runs()) {
      const sorted = this.order.slice(start, end + 1).map(id => this.current.get(id)).sort((a, b) => a - b);
      sorted.forEach((value, offset) => (this.proposed[start + offset] = value));
    }

    this.makeRoom();

    for (const [start, end] of this.runs()) {
      const solved = this.isValidRun(start, end) ? this.proposed.slice(start, end + 1) : this.solveRun(start, end, this.proposed);
      solved.forEach((value, offset) => this.values.set(this.order[start + offset], value));
    }

    return this.values;
  }

  /** Root front/back moves get values beyond every other object, keeping already valid values. */
  private assignFresh(): void {
    if (this.fresh.size === 0) {
      return;
    }

    const ids = this.order.filter(id => this.fresh.has(id));
    const sorted = ids.map(id => this.current.get(id)).sort((a, b) => a - b);
    const others = this.items.filter(item => !this.fresh.has(item.id) && !(item.isGroup && this.moving.has(item.id))).map(item => item.zIndex);
    const keep = ids.map(() => true);

    const solved = this.fresh.has(this.order[this.order.length - 1])
      ? solveSequence(sorted, others.length > 0 ? Math.max(...others) : -Infinity, Infinity, keep)
      : solveSequence(sorted, -Infinity, others.length > 0 ? Math.min(...others) : Infinity, keep);
    ids.forEach((id, index) => this.values.set(id, solved[index]));
  }

  /**
   * Only needed for tied input: widens runs that have fewer free integers than objects by absorbing
   * untouched neighbours on the side that causes fewer changes.
   */
  private makeRoom(): void {
    for (let guard = 0; guard <= this.order.length; guard++) {
      const crowded = this.runs().find(([start, end]) => !this.hasRoom(start, end));
      if (!crowded) {
        return;
      }

      const up = this.extend(crowded, 1);
      const down = this.extend(crowded, -1);
      const upCost = this.extensionCost(up);
      const downCost = this.extensionCost(down);
      const chosen = upCost <= downCost ? up : down;
      if (!chosen || chosen.absorbed.length === 0) {
        return;
      }
      for (const index of chosen.absorbed) {
        this.isTouched[index] = true;
        this.proposed[index] = this.current.get(this.order[index]);
      }
    }
  }

  private extend([start, end]: number[], direction: 1 | -1): { start: number; end: number; absorbed: number[] } | null {
    const n = this.order.length;
    const absorbed: number[] = [];
    let a = start;
    let b = end;

    while (!this.hasRoom(a, b)) {
      const next = direction === 1 ? b + 1 : a - 1;
      if (next < 0 || next >= n || this.fresh.has(this.order[next])) {
        return null;
      }
      if (!this.isTouched[next]) {
        absorbed.push(next);
      }
      if (direction === 1) {
        b = next;
        while (b + 1 < n && this.isTouched[b + 1]) b++;
      } else {
        a = next;
        while (a - 1 >= 0 && this.isTouched[a - 1]) a--;
      }
    }

    return { start: a, end: b, absorbed };
  }

  private extensionCost(extension: { start: number; end: number; absorbed: number[] } | null): number {
    if (!extension) {
      return Infinity;
    }
    const proposed = [...this.proposed];
    extension.absorbed.forEach(index => (proposed[index] = this.current.get(this.order[index])));
    const solved = this.solveRun(extension.start, extension.end, proposed);
    return solved.filter((value, offset) => value !== this.current.get(this.order[extension.start + offset])).length;
  }

  private solveRun(start: number, end: number, proposed: number[]): number[] {
    const keepPreferred = this.order.slice(start, end + 1).map(id => !this.moving.has(id));
    return solveSequence(proposed.slice(start, end + 1), this.lower(start), this.upper(end), keepPreferred);
  }

  private isValidRun(start: number, end: number): boolean {
    let previous = this.lower(start);
    for (let i = start; i <= end; i++) {
      if (!(this.proposed[i] > previous)) {
        return false;
      }
      previous = this.proposed[i];
    }
    return previous < this.upper(end);
  }

  private hasRoom(start: number, end: number): boolean {
    return this.upper(end) - this.lower(start) - 1 >= end - start + 1;
  }

  private lower(start: number): number {
    return start > 0 ? this.valueAt(start - 1) : -Infinity;
  }

  private upper(end: number): number {
    return end < this.order.length - 1 ? this.valueAt(end + 1) : Infinity;
  }

  private valueAt(index: number): number {
    const id = this.order[index];
    return this.fresh.has(id) ? this.values.get(id) : this.current.get(id);
  }

  /** Maximal index ranges of consecutive touched objects. */
  private runs(): number[][] {
    const runs: number[][] = [];
    for (let i = 0; i < this.order.length; i++) {
      if (!this.isTouched[i]) {
        continue;
      }
      let end = i;
      while (end + 1 < this.order.length && this.isTouched[end + 1]) end++;
      runs.push([i, end]);
      i = end;
    }
    return runs;
  }
}

/**
 * Returns strictly increasing integers within the exclusive bounds (lower, upper) that keep as many proposed
 * values as possible (preferring entries flagged in `keepPreferred`) and fill the rest with the nearest free
 * values. Uses a weighted longest non-decreasing subsequence over `proposed[k] - k`, which guarantees enough
 * integers between kept values for the others.
 */
function solveSequence(proposed: number[], lower: number, upper: number, keepPreferred: boolean[]): number[] {
  const length = proposed.length;
  const minKey = lower + 1;
  const maxKey = upper - length;
  const keys = proposed.map((value, k) => value - k);
  const candidates = keys.map((_, k) => k).filter(k => keys[k] >= minKey && keys[k] <= maxKey);

  // Fenwick tree over key ranks holding the best chain ending at a key <= rank (ties: smallest index).
  const ranks = [...new Set(candidates.map(k => keys[k]))].sort((a, b) => a - b);
  const rankOf = new Map(ranks.map((key, index) => [key, index + 1]));
  const tree: { weight: number; index: number }[] = new Array(ranks.length + 1).fill(null);
  const isBetter = (a: { weight: number; index: number }, b: { weight: number; index: number } | null) =>
    b === null || a.weight > b.weight || (a.weight === b.weight && a.index < b.index);

  const previous = new Array<number>(length).fill(-1);
  let best: { weight: number; index: number } | null = null;

  for (const k of candidates) {
    let chain: { weight: number; index: number } | null = null;
    for (let r = rankOf.get(keys[k]); r > 0; r -= r & -r) {
      if (tree[r] && isBetter(tree[r], chain)) chain = tree[r];
    }
    const entry = { weight: length + 1 + (keepPreferred[k] ? 1 : 0) + (chain ? chain.weight : 0), index: k };
    previous[k] = chain ? chain.index : -1;
    for (let r = rankOf.get(keys[k]); r <= ranks.length; r += r & -r) {
      if (isBetter(entry, tree[r])) tree[r] = entry;
    }
    if (isBetter(entry, best)) best = entry;
  }

  const kept = new Set<number>();
  for (let k = best ? best.index : -1; k >= 0; k = previous[k]) {
    kept.add(k);
  }

  const result = new Array<number>(length);
  kept.forEach(k => (result[k] = proposed[k]));
  for (let k = 0; k < length; k++) {
    if (kept.has(k)) {
      continue;
    }
    let end = k;
    while (end < length && !kept.has(end)) end++;
    const below = k > 0 ? result[k - 1] : lower;
    const above = end < length ? result[end] : upper;
    for (let q = k; q < end; q++) {
      result[q] = Number.isFinite(below) ? below + (q - k + 1) : above - (end - q);
    }
    k = end - 1;
  }
  return result;
}
