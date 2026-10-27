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
  KritzelObjectTitlebarMenuState,
  KritzelTitlebarElement,
  KritzelTitlebarMenu,
  KritzelTitlebarMenuItem,
  KritzelTitlebarSection,
  KritzelTitlebarValue,
} from '../../interfaces/object-titlebar.interface';
import { KritzelTermKey } from '../../interfaces/localization.interface';
import { KritzelIconName } from '../registries/icon-registry.class';

/** Marks titlebar elements that resolve to their owner object (the drag surface). */
export const KRITZEL_TITLEBAR_OWNER_ATTRIBUTE = 'data-titlebar-owner-id';
/** Marks interactive titlebar elements; pointer input on them never reaches the active tool. */
export const KRITZEL_TITLEBAR_CONTROL_ATTRIBUTE = 'data-kritzel-titlebar-control';
/** Marks an editable title; its value is the id of the title element. */
export const KRITZEL_TITLEBAR_EDITABLE_TITLE_ATTRIBUTE = 'data-kritzel-titlebar-editable-title';
/** Marks the input used to rename an object; keyboard input in it never reaches canvas shortcuts. */
export const KRITZEL_TITLEBAR_TITLE_INPUT_ATTRIBUTE = 'data-kritzel-titlebar-title-input';

const DEFAULT_LEFT_ELEMENTS: KritzelTitlebarElement[] = [{ id: 'title', type: 'title' }];
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

/** The open titlebar menu. */
interface KritzelOpenTitlebarMenu {
  ownerId: string;
  elementId: string;
  section: KritzelTitlebarSection;
  items: KritzelTitlebarMenuItem[];
  anchor: HTMLElement;
  anchorRect: DOMRect;
  /** Camera when the menu opened; the menu closes once it moves. */
  viewport: { scale: number; translateX: number; translateY: number };
  /** Whether the owner was active when the menu opened; the menu closes once that changes. */
  isActive: boolean;
}

/** Size of the titlebar band, read from the theme on every render. */
export interface KritzelTitlebarMetrics {
  height: number;
  offset: number;
}

/** An element with all of its dynamic values evaluated for one titlebar. */
export interface KritzelResolvedTitlebarElement {
  element: KritzelTitlebarElement;
  section: KritzelTitlebarSection;
  text?: string;
  icon?: KritzelIconName;
  label?: string;
  tooltip?: string;
  isDisabled?: boolean;
  isPressed?: boolean;
  /** Whether a title element can be edited to rename its object. */
  isEditable?: boolean;
  /** Whether the menu of a menu element is open. */
  isMenuOpen?: boolean;
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
  /** Id of the title element currently being edited, if any. */
  editingElementId?: string;
  sections: Record<KritzelTitlebarSection, KritzelResolvedTitlebarElement[]>;
}

/**
 * Resolves which objects show a titlebar, what their titlebars contain, and handles
 * titlebar button clicks and menus. The configuration is read live from the engine's
 * `objectTitlebar` prop, so late prop updates from framework wrappers always apply.
 */
export class KritzelObjectTitlebarManager {
  private readonly _core: KritzelCore;
  private readonly _warnedElements = new Set<string>();
  private _hasReportedMissingHasTitlebar = false;
  private _editingTitle: { ownerId: string; elementId: string } | null = null;
  private _openMenu: KritzelOpenTitlebarMenu | null = null;
  /** Latest input value of the title being edited, committed if the edit ends without a blur. */
  private _titleDraft: string | null = null;

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
    this._warnedElements.clear();
    this._hasReportedMissingHasTitlebar = false;
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
   * (not children of a candidate group) for which `objectConfig.hasTitlebar` is true.
   * A group's bounds contain its children, so a visible child's group is always a candidate.
   */
  getOwners(candidates: KritzelBaseObject<any>[]): KritzelBaseObject<any>[] {
    const objectConfigManager = this._core.objectConfigManager;
    if (!objectConfigManager.isConfigured('hasTitlebar')) {
      if (this.isEnabled && !this._hasReportedMissingHasTitlebar) {
        this._hasReportedMissingHasTitlebar = true;
        console.info("[KritzelObjectTitlebar] No titlebars are rendered because `objectConfig.hasTitlebar` is not set, e.g. `objectConfig = { hasTitlebar: object => object.__class__ === 'KritzelGroup' }`.");
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
        objectConfigManager.hasTitlebar(candidate),
    );
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
      this.closeMenu();
      return [];
    }

    const state = this._core.store.state;
    const viewport = { scale: state.scale, translateX: state.translateX, translateY: state.translateY };
    const hideBelowWidth = config.hideBelowWidth ?? KRITZEL_TITLEBAR_DEFAULT_HIDE_BELOW_WIDTH;
    // Without owners the loop renders nothing, but an open edit or menu must still end below.
    const owners = this.getOwners(candidates);

    const activeOwnerIds = this.getActiveOwnerIds(candidates);
    const titlebars: KritzelResolvedTitlebar[] = [];
    const editing = this._editingTitle;

    for (const owner of owners) {
      const isActive = activeOwnerIds.has(owner.id);
      // A titlebar being edited stays visible until the edit ends.
      const isEditing = editing?.ownerId === owner.id;
      if (config.visibility === 'active' && !isActive && !isEditing) {
        continue;
      }

      const anchor = KritzelObjectTitlebarHelper.getAnchor(owner, viewport, config.rotation ?? 'follow');
      if (!(anchor.width >= hideBelowWidth) && !isEditing) {
        continue;
      }

      const context = this.createContext(owner, isActive, anchor.width);
      const sections = {
        left: this.resolveElements(config.left ?? DEFAULT_LEFT_ELEMENTS, 'left', context),
        center: this.resolveElements(config.center ?? [], 'center', context),
        right: this.resolveElements(config.right ?? [], 'right', context),
      };
      const isEditedElementShown = isEditing && SECTIONS.some(section => sections[section].some(resolved => resolved.element.id === editing.elementId && resolved.isEditable));
      titlebars.push({
        owner,
        context,
        isActive,
        transform: KritzelObjectTitlebarHelper.getTransform(anchor, viewport.scale),
        width: anchor.width,
        editingElementId: isEditedElementShown ? editing.elementId : undefined,
        sections,
      });
    }

    // An edit whose title is no longer rendered or whose object is no longer selected ends, keeping
    // what was typed. Usually the input's blur has already committed it.
    if (editing && !this.isTitleEditStillValid(editing, titlebars)) {
      const draft = this._titleDraft;
      if (draft === null) {
        this._editingTitle = null;
      } else {
        this.commitTitleEditing(draft);
      }
      for (const titlebar of titlebars) {
        titlebar.editingElementId = undefined;
      }
    }

    const menu = this._openMenu;
    if (menu && !this.isMenuStillValid(menu, titlebars)) {
      this.closeMenu();
      for (const titlebar of titlebars) {
        for (const resolved of titlebar.sections[menu.section]) {
          resolved.isMenuOpen = false;
        }
      }
    }

    return titlebars;
  }

  /** Builds the context passed to dynamic element values and actions. */
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
   * Runs a titlebar button or toggles a titlebar menu. Disabled elements are ignored. A button calls its
   * `action` and emits `objectTitlebarAction`; a menu opens or closes and emits `objectTitlebarMenuStateChange`.
   * Does nothing while the engine is disabled.
   */
  invokeElement(ownerId: string, section: KritzelTitlebarSection, elementId: string, event: MouseEvent, anchor: HTMLElement): void {
    if (this._core.store.isDisabled) {
      return;
    }

    const config = this.config;
    const owner = this.findOwnerById(ownerId);
    const element = this.getSectionElements(config, section).find(candidate => candidate.id === elementId);
    if (!config || !owner || !element || (element.type !== 'button' && element.type !== 'menu')) {
      return;
    }

    const context = this.createLiveContext(owner);
    if (this.evaluate(element.isDisabled, context, false, element.id)) {
      return;
    }

    if (element.type === 'menu') {
      this.toggleMenu(owner, section, element, context, anchor);
      return;
    }

    try {
      element.action?.(context, event);
    } catch (error) {
      console.error(`[KritzelObjectTitlebar] Action of element "${element.id}" failed:`, error);
    }

    this.emitAction(owner, section, element.id, anchor.getBoundingClientRect());
  }

  /** The state of the titlebar menu, as emitted with `objectTitlebarMenuStateChange`. */
  get menuState(): KritzelObjectTitlebarMenuState {
    const menu = this._openMenu;
    if (!menu) {
      return { isVisible: false, items: [] };
    }
    return {
      isVisible: true,
      objectId: menu.ownerId,
      elementId: menu.elementId,
      section: menu.section,
      items: menu.items,
      anchor: menu.anchor,
      anchorRect: menu.anchorRect,
    };
  }

  /** Closes the open titlebar menu, if any. */
  closeMenu(): void {
    if (!this._openMenu) {
      return;
    }
    this._openMenu = null;
    this._core.engine?.emitObjectTitlebarMenuStateChange(this.menuState);
    this._core.rerender();
  }

  /**
   * Selects an item of the open titlebar menu: closes the menu, calls the item's `action` and emits
   * `objectTitlebarAction` with its id as `menuItemId`. Hidden, disabled and unknown items are ignored.
   */
  selectMenuItem(menuItemId: string): void {
    const menu = this._openMenu;
    if (!menu || this._core.store.isDisabled) {
      return;
    }

    const owner = this.findOwnerById(menu.ownerId);
    const element = this.getSectionElements(this.config, menu.section).find(candidate => candidate.id === menu.elementId);
    if (!owner || element?.type !== 'menu') {
      this.closeMenu();
      return;
    }

    // Values are evaluated again, so an item disabled since the menu opened cannot be selected.
    const context = this.createLiveContext(owner);
    const menuItem = this.resolveMenuItems(element, context).find(candidate => candidate.id === menuItemId);
    if (!menuItem || menuItem.isDisabled) {
      return;
    }

    this.closeMenu();
    try {
      menuItem.action?.(context, menuItem);
    } catch (error) {
      console.error(`[KritzelObjectTitlebar] Action of menu item "${menuItemId}" in "${element.id}" failed:`, error);
    }

    this.emitAction(owner, menu.section, element.id, menu.anchorRect, menuItemId);
  }

  private toggleMenu(owner: KritzelBaseObject<any>, section: KritzelTitlebarSection, element: KritzelTitlebarMenu, context: KritzelObjectTitlebarContext, anchor: HTMLElement): void {
    const isOpen = this._openMenu?.ownerId === owner.id && this._openMenu.elementId === element.id;
    if (isOpen) {
      this.closeMenu();
      return;
    }

    const { scale, translateX, translateY } = this._core.store.state;
    this._openMenu = {
      ownerId: owner.id,
      elementId: element.id,
      section,
      items: this.resolveMenuItems(element, context),
      anchor,
      anchorRect: anchor.getBoundingClientRect(),
      viewport: { scale, translateX, translateY },
      isActive: context.isActive,
    };
    this._core.engine?.emitObjectTitlebarMenuStateChange(this.menuState);
    this._core.rerender();
  }

  /** Resolves the visible items of a menu, with labels translated and `isDisabled` evaluated. */
  private resolveMenuItems(element: KritzelTitlebarMenu, context: KritzelObjectTitlebarContext): KritzelTitlebarMenuItem[] {
    const items = this.evaluate(element.items, context, [], element.id);
    if (!Array.isArray(items)) {
      return [];
    }
    return items
      .filter(menuItem => this.evaluate(menuItem.isVisible, context, true, element.id))
      .map(menuItem => ({
        ...menuItem,
        label: this.translate(menuItem.label),
        isVisible: true,
        isDisabled: this.evaluate(menuItem.isDisabled, context, false, element.id),
      }));
  }

  /**
   * Whether the open menu can stay open: its object still shows the menu element and was neither selected
   * nor deselected, and the camera has not moved, since the menu is anchored to where the button was.
   * Menus also open on inactive titlebars, because clicking a titlebar button never changes the selection.
   */
  private isMenuStillValid(menu: KritzelOpenTitlebarMenu, titlebars: KritzelResolvedTitlebar[]): boolean {
    const { scale, translateX, translateY } = this._core.store.state;
    const hasViewportChanged = scale !== menu.viewport.scale || translateX !== menu.viewport.translateX || translateY !== menu.viewport.translateY;
    const titlebar = titlebars.find(candidate => candidate.owner.id === menu.ownerId);
    const isShown = !!titlebar && !titlebar.editingElementId && titlebar.sections[menu.section].some(resolved => resolved.element.id === menu.elementId);
    return !hasViewportChanged && isShown && titlebar.isActive === menu.isActive;
  }

  /** Builds the context of an owner outside of a render, e.g. for a click. */
  private createLiveContext(owner: KritzelBaseObject<any>): KritzelObjectTitlebarContext {
    const state = this._core.store.state;
    const anchor = KritzelObjectTitlebarHelper.getAnchor(owner, { scale: state.scale, translateX: state.translateX, translateY: state.translateY }, this.config?.rotation ?? 'follow');
    const isActive = this.getActiveOwnerIds(this._core.store.allObjects).has(owner.id);
    return this.createContext(owner, isActive, anchor.width);
  }

  private emitAction(owner: KritzelBaseObject<any>, section: KritzelTitlebarSection, elementId: string, anchorRect: DOMRect, menuItemId?: string): void {
    this._core.engine?.emitObjectTitlebarAction({
      elementId,
      ...(menuItemId === undefined ? {} : { menuItemId }),
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

  private resolveElements(elements: KritzelTitlebarElement[], section: KritzelTitlebarSection, context: KritzelObjectTitlebarContext): KritzelResolvedTitlebarElement[] {
    const resolved: KritzelResolvedTitlebarElement[] = [];

    for (const element of elements) {
      const showWhen = element.showWhen ?? 'always';
      if ((showWhen === 'active' && !context.isActive) || (showWhen === 'inactive' && context.isActive)) {
        continue;
      }
      if (element.minBarWidth !== undefined && context.barWidth < element.minBarWidth) {
        continue;
      }
      if (!this.evaluate(element.isVisible, context, true, element.id)) {
        continue;
      }

      switch (element.type) {
        case 'title':
          resolved.push({
            element,
            section,
            text: element.text === undefined ? context.title : this.evaluate(element.text, context, context.title, element.id),
            isEditable: element.text === undefined && this.evaluate(element.isEditable, context, false, element.id),
          });
          break;
        case 'text':
          resolved.push({ element, section, text: this.evaluate(element.text, context, '', element.id) });
          break;
        case 'icon':
          resolved.push({ element, section, icon: this.evaluate(element.icon, context, undefined, element.id) });
          break;
        case 'button':
          resolved.push({
            element,
            section,
            icon: this.evaluate(element.icon, context, undefined, element.id),
            label: element.label === undefined ? undefined : this.translate(element.label),
            tooltip: element.tooltip === undefined ? undefined : this.translate(element.tooltip),
            isDisabled: this.evaluate(element.isDisabled, context, false, element.id),
            isPressed: this.evaluate(element.isPressed, context, false, element.id),
          });
          break;
        case 'menu':
          resolved.push({
            element,
            section,
            icon: this.evaluate(element.icon, context, undefined, element.id),
            label: element.label === undefined ? undefined : this.translate(element.label),
            tooltip: element.tooltip === undefined ? undefined : this.translate(element.tooltip),
            isDisabled: this.evaluate(element.isDisabled, context, false, element.id),
            isMenuOpen: this._openMenu?.ownerId === context.object.id && this._openMenu.elementId === element.id,
          });
          break;
        default:
          resolved.push({ element, section });
      }
    }

    return resolved;
  }

  /**
   * Evaluates a static or dynamic value. Failing callbacks and promises (which are not
   * supported because values are evaluated during render) resolve to the fallback.
   */
  private evaluate<T>(value: KritzelTitlebarValue<T> | undefined, context: KritzelObjectTitlebarContext, fallback: T, elementId: string): T {
    if (value === undefined) {
      return fallback;
    }
    if (typeof value !== 'function') {
      return value;
    }

    try {
      const result = (value as (context: KritzelObjectTitlebarContext) => T)(context);
      if (result && typeof (result as unknown as PromiseLike<T>).then === 'function') {
        this.warnOnce(elementId, 'Titlebar values must be synchronous; promises are not supported.');
        return (typeof fallback === 'boolean' ? false : fallback) as T;
      }
      return result ?? fallback;
    } catch (error) {
      this.warnOnce(elementId, error);
      return (typeof fallback === 'boolean' ? false : fallback) as T;
    }
  }

  private warnOnce(elementId: string, error: unknown): void {
    if (this._warnedElements.has(elementId)) {
      return;
    }
    this._warnedElements.add(elementId);
    console.warn(`[KritzelObjectTitlebar] Element "${elementId}" could not be resolved:`, error);
  }

  private getSectionElements(config: KritzelObjectTitlebarConfig | undefined, section: KritzelTitlebarSection): KritzelTitlebarElement[] {
    if (!config || !SECTIONS.includes(section)) {
      return [];
    }
    if (section === 'left') {
      return config.left ?? DEFAULT_LEFT_ELEMENTS;
    }
    return config[section] ?? [];
  }

  /** The title being edited, if any. */
  get editingTitle(): { ownerId: string; elementId: string } | null {
    return this._editingTitle;
  }

  /**
   * Finds the editable title that was pressed, using the event path and falling back to hit testing.
   * @returns The owner and title element id, or `null` when the press was not on an editable title
   */
  getEditableTitleFromEvent(event: Pick<PointerEvent, 'clientX' | 'clientY'> & { composedPath?: () => EventTarget[] }): { ownerId: string; elementId: string } | null {
    if (!this.isEnabled) {
      return null;
    }

    let title = (event.composedPath?.() ?? []).find(target => this.hasAttribute(target, KRITZEL_TITLEBAR_EDITABLE_TITLE_ATTRIBUTE)) as Element | undefined;
    if (!title) {
      const topmost = this._core.engine?.host?.shadowRoot?.elementsFromPoint?.(event.clientX, event.clientY)?.[0];
      title = topmost?.closest(`[${KRITZEL_TITLEBAR_EDITABLE_TITLE_ATTRIBUTE}]`) ?? undefined;
    }

    const ownerId = title?.closest(`[${KRITZEL_TITLEBAR_OWNER_ATTRIBUTE}]`)?.getAttribute(KRITZEL_TITLEBAR_OWNER_ATTRIBUTE);
    const elementId = title?.getAttribute(KRITZEL_TITLEBAR_EDITABLE_TITLE_ATTRIBUTE);
    return ownerId && elementId ? { ownerId, elementId } : null;
  }

  /** Whether the event originated in the input used to rename an object. */
  isTitleInputEvent(event: { composedPath?: () => EventTarget[] }): boolean {
    const path = event.composedPath?.() ?? [];
    return path.some(target => this.hasAttribute(target, KRITZEL_TITLEBAR_TITLE_INPUT_ATTRIBUTE));
  }

  /** Starts renaming an object through the given title element of its titlebar. */
  startTitleEditing(ownerId: string, elementId: string): void {
    if (this._core.store.isDisabled || !this.findOwnerById(ownerId)) {
      return;
    }
    this.closeMenu();
    this._editingTitle = { ownerId, elementId };
    this._titleDraft = null;
    this._core.rerender();
  }

  /** Records the current input value of the title being edited. */
  setTitleDraft(value: string): void {
    if (this._editingTitle) {
      this._titleDraft = value;
    }
  }

  /**
   * Ends renaming and stores the trimmed value as the object's name. An empty value clears the
   * name, so the title falls back to the default. Does nothing when no edit is in progress.
   */
  commitTitleEditing(value: string): void {
    const editing = this._editingTitle;
    if (!editing) {
      return;
    }
    this._editingTitle = null;
    this._titleDraft = null;

    const owner = this.findOwnerById(editing.ownerId);
    const name = value.trim() || undefined;
    if (owner && owner.name !== name) {
      // Assigned directly: core.updateObject skips undefined values, which clear the name.
      owner.name = name;
      owner.onAfterUpdate(['name']);
      this._core.store.objects.update(owner);
      this._core.engine?.emitObjectsChange();
      this._core.engine?.emitObjectsUpdated([{ object: owner, changedProperties: ['name'] }]);
    }
    this._core.rerender();
  }

  /** Ends renaming without changing the object's name. */
  cancelTitleEditing(): void {
    if (!this._editingTitle) {
      return;
    }
    this._editingTitle = null;
    this._titleDraft = null;
    this._core.rerender();
  }

  private isTitleEditStillValid(editing: { ownerId: string; elementId: string }, titlebars: KritzelResolvedTitlebar[]): boolean {
    const owner = this.findOwnerById(editing.ownerId);
    const isSelected = !!this._core.store.selectionGroup?.objectIds.includes(editing.ownerId);
    return !!owner && !owner.markedForRemoval && isSelected && titlebars.some(titlebar => titlebar.editingElementId === editing.elementId && titlebar.owner.id === editing.ownerId);
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
