import { KritzelCore } from '../core/core.class';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelGroup } from '../objects/group.class';
import { KritzelClassHelper } from '../../helpers/class.helper';
import {
  KRITZEL_TITLEBAR_DEFAULT_HEIGHT,
  KRITZEL_TITLEBAR_DEFAULT_HIDE_BELOW_WIDTH,
  KRITZEL_TITLEBAR_DEFAULT_OFFSET,
  KritzelObjectTitlebarHelper,
} from '../../helpers/object-titlebar.helper';
import {
  KritzelObjectTitlebarConfig,
  KritzelObjectTitlebarContext,
  KritzelTitlebarItem,
  KritzelTitlebarSection,
  KritzelTitlebarValue,
} from '../../interfaces/object-titlebar.interface';
import { KritzelTermKey } from '../../interfaces/localization.interface';
import { KritzelIconName } from '../registries/icon-registry.class';

/** Marks titlebar elements that resolve to their owner object (the drag surface). */
export const KRITZEL_TITLEBAR_OWNER_ATTRIBUTE = 'data-titlebar-owner-id';
/** Marks interactive titlebar elements; pointer input on them never reaches the active tool. */
export const KRITZEL_TITLEBAR_CONTROL_ATTRIBUTE = 'data-kritzel-titlebar-control';

const DEFAULT_LEFT_ITEMS: KritzelTitlebarItem[] = [{ id: 'title', type: 'title' }];
const SECTIONS: KritzelTitlebarSection[] = ['left', 'center', 'right'];

const OBJECT_TYPE_TERMS: Record<string, KritzelTermKey> = {
  KritzelShape: 'objectType.shape',
  KritzelText: 'objectType.text',
  KritzelImage: 'objectType.image',
  KritzelPath: 'objectType.path',
  KritzelLine: 'objectType.line',
  KritzelGroup: 'objectType.group',
  KritzelIframeObject: 'objectType.iframe',
  KritzelDynamicObject: 'objectType.dynamic',
};

/** Icons from the default registry that represent each object type. */
export const KRITZEL_OBJECT_TYPE_ICONS: Record<string, KritzelIconName> = {
  KritzelShape: 'shapes',
  KritzelText: 'type',
  KritzelImage: 'image',
  KritzelPath: 'pen',
  KritzelLine: 'arrow',
  KritzelGroup: 'group',
  KritzelIframeObject: 'layoutTemplate',
  KritzelDynamicObject: 'braces',
};

/** Default titlebar: the object's type icon followed by its title. */
export const KRITZEL_DEFAULT_OBJECT_TITLEBAR: KritzelObjectTitlebarConfig = {
  left: [
    { id: 'type-icon', type: 'icon', icon: context => KRITZEL_OBJECT_TYPE_ICONS[context.objectType] ?? 'square' },
    { id: 'title', type: 'title' },
  ],
};

/** Size of the titlebar band, read from the theme on every render. */
export interface KritzelTitlebarMetrics {
  height: number;
  offset: number;
}

/** An item with all of its dynamic values evaluated for one titlebar. */
export interface KritzelResolvedTitlebarItem {
  item: KritzelTitlebarItem;
  section: KritzelTitlebarSection;
  text?: string;
  icon?: KritzelIconName;
  label?: string;
  tooltip?: string;
  isDisabled?: boolean;
  isPressed?: boolean;
}

/** Everything needed to render one titlebar. */
export interface KritzelResolvedTitlebar {
  owner: KritzelBaseObject<any>;
  context: KritzelObjectTitlebarContext;
  isActive: boolean;
  /** CSS transform of the anchor inside the origin layer. */
  transform: string;
  /** Titlebar width in screen pixels. */
  width: number;
  sections: Record<KritzelTitlebarSection, KritzelResolvedTitlebarItem[]>;
}

/**
 * Resolves which objects show a titlebar, what their titlebars contain, and handles
 * titlebar button clicks. The configuration is read live from the engine's
 * `objectTitlebar` prop, so late prop updates from framework wrappers always apply.
 */
export class KritzelObjectTitlebarManager {
  private readonly _core: KritzelCore;
  private readonly _warnedItems = new Set<string>();
  private readonly _reportedShowFor = new Set<'missing' | 'failed'>();

  constructor(core: KritzelCore) {
    this._core = core;
  }

  /** The current titlebar configuration, or `undefined` when titlebars are disabled. */
  get config(): KritzelObjectTitlebarConfig | undefined {
    return this._core.engine?.objectTitlebar ?? undefined;
  }

  /** Whether titlebars are configured. */
  get isEnabled(): boolean {
    return !!this.config;
  }

  /** Clears the warnings already reported, so a new configuration reports its own problems. */
  resetWarnings(): void {
    this._warnedItems.clear();
    this._reportedShowFor.clear();
  }

  /** Reads the titlebar height and offset tokens, falling back to defaults for non-pixel values. */
  getMetrics(style: Pick<CSSStyleDeclaration, 'getPropertyValue'> | null | undefined): KritzelTitlebarMetrics {
    return {
      height: KritzelObjectTitlebarHelper.parsePixels(style?.getPropertyValue('--kritzel-titlebar-height'), KRITZEL_TITLEBAR_DEFAULT_HEIGHT),
      offset: KritzelObjectTitlebarHelper.parsePixels(style?.getPropertyValue('--kritzel-titlebar-offset'), KRITZEL_TITLEBAR_DEFAULT_OFFSET),
    };
  }

  /** World units by which the render query must be widened so titlebars hanging into view are rendered. */
  getCullingPadding(metrics: KritzelTitlebarMetrics): number {
    if (!this.isEnabled) {
      return 0;
    }
    return KritzelObjectTitlebarHelper.getCullingPadding(metrics.height, metrics.offset, this._core.store.state.scale);
  }

  /**
   * Returns the objects that own a titlebar among the given candidates: top-level objects
   * (not children of a candidate group) accepted by the config's `showFor`.
   * A group's bounds contain its children, so a visible child's group is always a candidate.
   */
  getOwners(candidates: KritzelBaseObject<any>[]): KritzelBaseObject<any>[] {
    const showFor = this.config?.showFor;
    if (typeof showFor !== 'function') {
      if (this.isEnabled && !this._reportedShowFor.has('missing')) {
        this._reportedShowFor.add('missing');
        console.info("[KritzelObjectTitlebar] No titlebars are rendered because `objectTitlebar.showFor` is not set, e.g. `showFor: object => object.__class__ === 'KritzelGroup'`.");
      }
      return [];
    }

    const childIds = new Set<string>();
    for (const candidate of candidates) {
      if (KritzelClassHelper.isInstanceOf<KritzelGroup>(candidate, 'KritzelGroup')) {
        for (const childId of candidate.childIds) {
          childIds.add(childId);
        }
      }
    }

    return candidates.filter(
      candidate =>
        !candidate.markedForRemoval &&
        !childIds.has(candidate.id) &&
        !KritzelClassHelper.isInstanceOf(candidate, 'KritzelSelectionGroup') &&
        !KritzelClassHelper.isInstanceOf(candidate, 'KritzelSelectionBox') &&
        this.isShownFor(showFor, candidate),
    );
  }

  /** Evaluates `showFor` for one object. Only a synchronous `true` counts; failures are reported once. */
  private isShownFor(showFor: (object: KritzelBaseObject) => boolean, object: KritzelBaseObject<any>): boolean {
    try {
      const result: unknown = showFor(object);
      if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
        this.reportShowForFailure('`showFor` must be synchronous; promises are not supported.');
        return false;
      }
      return result === true;
    } catch (error) {
      this.reportShowForFailure(error);
      return false;
    }
  }

  private reportShowForFailure(error: unknown): void {
    if (this._reportedShowFor.has('failed')) {
      return;
    }
    this._reportedShowFor.add('failed');
    console.warn('[KritzelObjectTitlebar] `showFor` failed; objects it fails for get no titlebar:', error);
  }

  /**
   * Returns the ids of titlebar owners that are active: selected themselves, or containing
   * a selected object (nested groups resolve selection to their direct parent).
   */
  getActiveOwnerIds(candidates: KritzelBaseObject<any>[]): Set<string> {
    const selectedIds = this._core.store.selectionGroup?.objectIds ?? [];
    const active = new Set<string>();
    if (selectedIds.length === 0) {
      return active;
    }

    const parentOf = new Map<string, string>();
    for (const candidate of candidates) {
      if (KritzelClassHelper.isInstanceOf<KritzelGroup>(candidate, 'KritzelGroup')) {
        for (const childId of candidate.childIds) {
          parentOf.set(childId, candidate.id);
        }
      }
    }

    for (const selectedId of selectedIds) {
      let currentId: string | undefined = selectedId;
      const visited = new Set<string>();
      while (currentId && !visited.has(currentId)) {
        active.add(currentId);
        visited.add(currentId);
        currentId = parentOf.get(currentId);
      }
    }

    return active;
  }

  /** Resolves the titlebars to render for the given candidate objects. */
  resolveTitlebars(candidates: KritzelBaseObject<any>[]): KritzelResolvedTitlebar[] {
    const config = this.config;
    if (!config) {
      return [];
    }

    const state = this._core.store.state;
    const viewport = { scale: state.scale, translateX: state.translateX, translateY: state.translateY };
    const hideBelowWidth = config.hideBelowWidth ?? KRITZEL_TITLEBAR_DEFAULT_HIDE_BELOW_WIDTH;
    const owners = this.getOwners(candidates);
    if (owners.length === 0) {
      return [];
    }

    const activeOwnerIds = this.getActiveOwnerIds(candidates);
    const titlebars: KritzelResolvedTitlebar[] = [];

    for (const owner of owners) {
      const isActive = activeOwnerIds.has(owner.id);
      if (config.visibility === 'active' && !isActive) {
        continue;
      }

      const anchor = KritzelObjectTitlebarHelper.getAnchor(owner, viewport, config.rotation ?? 'follow');
      if (!(anchor.width >= hideBelowWidth)) {
        continue;
      }

      const context = this.createContext(owner, isActive, anchor.width);
      titlebars.push({
        owner,
        context,
        isActive,
        transform: KritzelObjectTitlebarHelper.getTransform(anchor, viewport.scale),
        width: anchor.width,
        sections: {
          left: this.resolveItems(config.left ?? DEFAULT_LEFT_ITEMS, 'left', context),
          center: this.resolveItems(config.center ?? [], 'center', context),
          right: this.resolveItems(config.right ?? [], 'right', context),
        },
      });
    }

    return titlebars;
  }

  /** Builds the context passed to dynamic item values and actions. */
  createContext(owner: KritzelBaseObject<any>, isActive: boolean, barWidth: number): KritzelObjectTitlebarContext {
    const bounds = owner.boundingBox;
    const translate = this.translate;
    const title = this.resolveTitle(owner);

    return {
      object: owner,
      objectType: owner.__class__,
      // Resolving group children scans the store, so only do it when a callback asks for them.
      get children(): KritzelBaseObject[] {
        return KritzelClassHelper.isInstanceOf<KritzelGroup>(owner, 'KritzelGroup') ? owner.children : [];
      },
      isActive,
      title,
      size: { width: bounds.width, height: bounds.height },
      contentSize: { width: owner.width, height: owner.height },
      barWidth,
      t: translate,
    };
  }

  /** Resolves an object's title: config resolver, then object name, then a localized type label. */
  resolveTitle(owner: KritzelBaseObject<any>): string {
    const resolver = this.config?.title;
    if (resolver) {
      try {
        const title = resolver(owner);
        if (typeof title === 'string' && title.length > 0) {
          return title;
        }
      } catch (error) {
        this.warnOnce('title', error);
      }
    }

    if (typeof owner.name === 'string' && owner.name.length > 0) {
      return owner.name;
    }

    return this.translate(OBJECT_TYPE_TERMS[owner.__class__] ?? 'objectType.object');
  }

  /**
   * Finds the object whose titlebar surface was pressed. Presses on titlebar controls return `null`
   * unless `includeControls` is set, e.g. for the context menu of a right-clicked button.
   * Uses the event path and falls back to hit testing: long-press callbacks receive the original
   * event after dispatch, when `composedPath()` is empty, and pointer capture retargets later
   * events such as `contextmenu` to the engine host.
   */
  getOwnerFromEvent(
    event: Pick<PointerEvent, 'clientX' | 'clientY'> & { composedPath?: () => EventTarget[] },
    options: { includeControls?: boolean } = {},
  ): KritzelBaseObject<any> | null {
    if (!this.isEnabled) {
      return null;
    }

    for (const target of event.composedPath?.() ?? []) {
      if (!options.includeControls && this.hasAttribute(target, KRITZEL_TITLEBAR_CONTROL_ATTRIBUTE)) {
        return null;
      }
      if (this.hasAttribute(target, KRITZEL_TITLEBAR_OWNER_ATTRIBUTE)) {
        return this.findOwnerById((target as Element).getAttribute(KRITZEL_TITLEBAR_OWNER_ATTRIBUTE));
      }
    }

    const shadowRoot = this._core.engine?.host?.shadowRoot;
    const topmost = shadowRoot?.elementsFromPoint?.(event.clientX, event.clientY)?.[0];
    if (!topmost) {
      return null;
    }
    if (!options.includeControls && topmost.closest(`[${KRITZEL_TITLEBAR_CONTROL_ATTRIBUTE}]`)) {
      return null;
    }
    const surface = topmost.closest(`[${KRITZEL_TITLEBAR_OWNER_ATTRIBUTE}]`);
    return this.findOwnerById(surface?.getAttribute(KRITZEL_TITLEBAR_OWNER_ATTRIBUTE));
  }

  /** Whether the event originated on an interactive titlebar control. */
  isControlEvent(event: { composedPath?: () => EventTarget[] }): boolean {
    const path = event.composedPath?.() ?? [];
    return path.some(target => this.hasAttribute(target, KRITZEL_TITLEBAR_CONTROL_ATTRIBUTE));
  }

  /**
   * Runs a titlebar button: evaluates `isDisabled`, calls its `action`, and emits the
   * `objectTitlebarAction` event. Does nothing while the engine is disabled.
   */
  invokeItem(ownerId: string, section: KritzelTitlebarSection, itemId: string, event: MouseEvent, anchorRect: DOMRect): void {
    if (this._core.store.isDisabled) {
      return;
    }

    const config = this.config;
    const owner = this.findOwnerById(ownerId);
    const item = this.getSectionItems(config, section).find(candidate => candidate.id === itemId);
    if (!config || !owner || !item || item.type !== 'button') {
      return;
    }

    const state = this._core.store.state;
    const anchor = KritzelObjectTitlebarHelper.getAnchor(owner, { scale: state.scale, translateX: state.translateX, translateY: state.translateY }, config.rotation ?? 'follow');
    const isActive = this.getActiveOwnerIds(this._core.store.allObjects).has(owner.id);
    const context = this.createContext(owner, isActive, anchor.width);

    if (this.evaluate(item.isDisabled, context, false, item.id)) {
      return;
    }

    try {
      item.action?.(context, event);
    } catch (error) {
      console.error(`[KritzelObjectTitlebar] Action of item "${item.id}" failed:`, error);
    }

    this._core.engine?.emitObjectTitlebarAction({
      itemId: item.id,
      section,
      objectId: owner.id,
      objectType: owner.__class__,
      workspaceId: owner.workspaceId,
      anchorRect,
    });
  }

  private readonly translate = (key: string, vars?: Record<string, string | number>): string => {
    return this._core.localizationManager.translate(key as KritzelTermKey, vars);
  };

  private resolveItems(items: KritzelTitlebarItem[], section: KritzelTitlebarSection, context: KritzelObjectTitlebarContext): KritzelResolvedTitlebarItem[] {
    const resolved: KritzelResolvedTitlebarItem[] = [];

    for (const item of items) {
      const showWhen = item.showWhen ?? 'always';
      if ((showWhen === 'active' && !context.isActive) || (showWhen === 'inactive' && context.isActive)) {
        continue;
      }
      if (item.minBarWidth !== undefined && context.barWidth < item.minBarWidth) {
        continue;
      }
      if (!this.evaluate(item.isVisible, context, true, item.id)) {
        continue;
      }

      switch (item.type) {
        case 'title':
          resolved.push({ item, section, text: item.text === undefined ? context.title : this.evaluate(item.text, context, context.title, item.id) });
          break;
        case 'text':
          resolved.push({ item, section, text: this.evaluate(item.text, context, '', item.id) });
          break;
        case 'icon':
          resolved.push({ item, section, icon: this.evaluate(item.icon, context, undefined, item.id) });
          break;
        case 'button':
          resolved.push({
            item,
            section,
            icon: this.evaluate(item.icon, context, undefined, item.id),
            label: item.label === undefined ? undefined : this.translate(item.label),
            tooltip: item.tooltip === undefined ? undefined : this.translate(item.tooltip),
            isDisabled: this.evaluate(item.isDisabled, context, false, item.id),
            isPressed: this.evaluate(item.isPressed, context, false, item.id),
          });
          break;
        default:
          resolved.push({ item, section });
      }
    }

    return resolved;
  }

  /**
   * Evaluates a static or dynamic value. Failing callbacks and promises (which are not
   * supported because values are evaluated during render) resolve to the fallback.
   */
  private evaluate<T>(value: KritzelTitlebarValue<T> | undefined, context: KritzelObjectTitlebarContext, fallback: T, itemId: string): T {
    if (value === undefined) {
      return fallback;
    }
    if (typeof value !== 'function') {
      return value;
    }

    try {
      const result = (value as (context: KritzelObjectTitlebarContext) => T)(context);
      if (result && typeof (result as unknown as PromiseLike<T>).then === 'function') {
        this.warnOnce(itemId, 'Titlebar values must be synchronous; promises are not supported.');
        return (typeof fallback === 'boolean' ? false : fallback) as T;
      }
      return result ?? fallback;
    } catch (error) {
      this.warnOnce(itemId, error);
      return (typeof fallback === 'boolean' ? false : fallback) as T;
    }
  }

  private warnOnce(itemId: string, error: unknown): void {
    if (this._warnedItems.has(itemId)) {
      return;
    }
    this._warnedItems.add(itemId);
    console.warn(`[KritzelObjectTitlebar] Item "${itemId}" could not be resolved:`, error);
  }

  private getSectionItems(config: KritzelObjectTitlebarConfig | undefined, section: KritzelTitlebarSection): KritzelTitlebarItem[] {
    if (!config || !SECTIONS.includes(section)) {
      return [];
    }
    if (section === 'left') {
      return config.left ?? DEFAULT_LEFT_ITEMS;
    }
    return config[section] ?? [];
  }

  private findOwnerById(id: string | null | undefined): KritzelBaseObject<any> | null {
    if (!id) {
      return null;
    }
    return this._core.store.objects?.findById(id) ?? null;
  }

  private hasAttribute(target: EventTarget, attribute: string): boolean {
    return typeof (target as Element)?.hasAttribute === 'function' && (target as Element).hasAttribute(attribute);
  }
}
