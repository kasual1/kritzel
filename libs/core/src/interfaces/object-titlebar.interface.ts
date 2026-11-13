import { UpdrawBaseObject } from '../classes/objects/base-object.class';
import { UpdrawIconName } from '../classes/registries/icon-registry.class';
import { UpdrawTermKey, UpdrawTermVars } from './localization.interface';

/**
 * A static value or a function resolving it from the titlebar context.
 *
 * Functions are evaluated synchronously on every render, so they must be pure and cheap.
 * Unlike {@link ContextMenuItem} predicates, promises are not supported.
 */
export type UpdrawTitlebarValue<T> = T | ((context: UpdrawObjectTitlebarContext) => T);

/** Section of the titlebar an element is rendered in. */
export type UpdrawTitlebarSection = 'left' | 'center' | 'right';

/** Information about the object a titlebar belongs to, passed to dynamic element values and actions. */
export interface UpdrawObjectTitlebarContext {
  /** The owner of the titlebar: a top-level object or group for which `objectConfig.hasTitlebar` is true. */
  object: UpdrawBaseObject;
  /** The owner's class name, e.g. `'UpdrawGroup'`. */
  objectType: string;
  /** The owner's children when it is a group, otherwise an empty array. */
  children: UpdrawBaseObject[];
  /** Whether the owner, or something inside it, is part of the local selection. */
  isActive: boolean;
  /** The resolved title (item text, config resolver, object name, or localized type label). */
  title: string;
  /** Unrotated size in world units, including padding. */
  size: { width: number; height: number };
  /** The object's own width and height, i.e. the CSS pixel size of embedded content. */
  contentSize: { width: number; height: number };
  /** Width of the titlebar in screen pixels. */
  barWidth: number;
  /** Translates a term key through the engine's active locale; other strings are returned verbatim. */
  t: (key: UpdrawTermKey | (string & NonNullable<unknown>), vars?: UpdrawTermVars) => string;
}

interface UpdrawTitlebarElementBase {
  /** Stable identifier, used as render key, `data-element-id` and in `objectTitlebarAction` events. */
  id: string;
  isVisible?: UpdrawTitlebarValue<boolean>;
  /** Restricts the element to the active or inactive state. Defaults to `'always'`. */
  showWhen?: 'always' | 'active' | 'inactive';
  /** Hides the element while the titlebar is narrower than this many screen pixels. */
  minBarWidth?: number;
  /** Additional `part` name for styling the element with `::part()`. */
  part?: string;
}

/** Displays the resolved title of the owner. */
export interface UpdrawTitlebarTitle extends UpdrawTitlebarElementBase {
  type: 'title';
  /** Overrides the resolved title for this element. A title with `text` cannot be edited. */
  text?: UpdrawTitlebarValue<string>;
  /**
   * Lets users rename the object by clicking the title of its active titlebar again.
   * The new name is stored in the object's `name`; an empty name falls back to the default title.
   * Defaults to `false`.
   */
  isEditable?: UpdrawTitlebarValue<boolean>;
}

/** Displays arbitrary text, e.g. the object's width. */
export interface UpdrawTitlebarText extends UpdrawTitlebarElementBase {
  type: 'text';
  text: UpdrawTitlebarValue<string>;
  tone?: 'default' | 'muted' | 'strong';
}

/** Displays a non-interactive icon from the icon registry. */
export interface UpdrawTitlebarIcon extends UpdrawTitlebarElementBase {
  type: 'icon';
  icon: UpdrawTitlebarValue<UpdrawIconName>;
}

/** An interactive button. Clicking it never starts a drag or changes the selection. */
export interface UpdrawTitlebarButton extends UpdrawTitlebarElementBase {
  type: 'button';
  icon?: UpdrawTitlebarValue<UpdrawIconName>;
  /** Button text. Term keys are translated through the active locale, other strings are used verbatim. */
  label?: UpdrawTermKey | (string & NonNullable<unknown>);
  /** Tooltip and accessible label. Term keys are translated through the active locale. */
  tooltip?: UpdrawTermKey | (string & NonNullable<unknown>);
  variant?: 'ghost' | 'filled' | 'outlined';
  isDisabled?: UpdrawTitlebarValue<boolean>;
  isPressed?: UpdrawTitlebarValue<boolean>;
  /** Called on click. The `objectTitlebarAction` event is emitted either way. */
  action?: (context: UpdrawObjectTitlebarContext, event: MouseEvent) => void;
}

/** An entry of a {@link UpdrawTitlebarMenu}. */
export interface UpdrawTitlebarMenuItem {
  /** Stable identifier, reported as `menuItemId` in `objectTitlebarAction` events. */
  id: string;
  /** Term keys are translated through the active locale, other strings are used verbatim. */
  label: UpdrawTermKey | (string & NonNullable<unknown>);
  icon?: UpdrawIconName;
  isVisible?: UpdrawTitlebarValue<boolean>;
  isDisabled?: UpdrawTitlebarValue<boolean>;
  /** Called when the menu item is selected. The `objectTitlebarAction` event is emitted either way. */
  action?: (context: UpdrawObjectTitlebarContext, menuItem: UpdrawTitlebarMenuItem) => void;
}

/**
 * A button that opens a menu. The engine only tracks which menu is open and emits
 * `objectTitlebarMenuStateChange`; rendering the menu is up to the host, e.g. `updraw-editor`.
 * The menu closes when the camera moves, the object is deselected or its titlebar is hidden.
 */
export interface UpdrawTitlebarMenu extends UpdrawTitlebarElementBase {
  type: 'menu';
  icon?: UpdrawTitlebarValue<UpdrawIconName>;
  /** Button text. Term keys are translated through the active locale, other strings are used verbatim. */
  label?: UpdrawTermKey | (string & NonNullable<unknown>);
  /** Tooltip and accessible label. Term keys are translated through the active locale. */
  tooltip?: UpdrawTermKey | (string & NonNullable<unknown>);
  variant?: 'ghost' | 'filled' | 'outlined';
  isDisabled?: UpdrawTitlebarValue<boolean>;
  /** Menu items, resolved when the menu opens. */
  items: UpdrawTitlebarValue<UpdrawTitlebarMenuItem[]>;
}

/** Flexible empty space (`spacer`) or a thin divider (`separator`). */
export interface UpdrawTitlebarSpacer extends UpdrawTitlebarElementBase {
  type: 'spacer' | 'separator';
}

export type UpdrawTitlebarElement =
  | UpdrawTitlebarTitle
  | UpdrawTitlebarText
  | UpdrawTitlebarIcon
  | UpdrawTitlebarButton
  | UpdrawTitlebarMenu
  | UpdrawTitlebarSpacer;

/**
 * Content and appearance of the titlebar rendered above the objects for which
 * `objectConfig.hasTitlebar` is true. The same configuration applies to every object.
 */
export interface UpdrawObjectTitlebarConfig {
  /** Elements in the left section. Defaults to a single title element. */
  left?: UpdrawTitlebarElement[];
  center?: UpdrawTitlebarElement[];
  right?: UpdrawTitlebarElement[];
  /** Show titlebars always (default) or only while their object is selected. */
  visibility?: 'always' | 'active';
  /** Follow the object's rotation (default) or stay upright above its rotated bounding box. */
  rotation?: 'follow' | 'upright';
  /** Resolves the title of an object. Falls back to the object's name, then to a localized type label. */
  title?: (object: UpdrawBaseObject) => string | undefined;
  /** Whether dragging the titlebar moves its object. Defaults to `true`. */
  draggable?: boolean;
  /** Hides titlebars whose object is narrower than this many screen pixels. Defaults to 40. */
  hideBelowWidth?: number;
}

/** Payload of the `objectTitlebarAction` event emitted when a titlebar button or menu item is clicked. */
export interface UpdrawObjectTitlebarActionEvent {
  /** Id of the clicked button, or of the menu the selected menu item belongs to. */
  elementId: string;
  /** Id of the selected menu item, when a menu item was selected. */
  menuItemId?: string;
  section: UpdrawTitlebarSection;
  objectId: string;
  objectType: string;
  workspaceId: string;
  /** Client rect of the clicked button or menu button, e.g. for anchoring a popover. */
  anchorRect: DOMRect;
}

/** Payload of the `objectTitlebarMenuStateChange` event, emitted when a titlebar menu opens or closes. */
export interface UpdrawObjectTitlebarMenuState {
  isVisible: boolean;
  /** Owner of the titlebar whose menu is open. */
  objectId?: string;
  /** Id of the open menu element. */
  elementId?: string;
  section?: UpdrawTitlebarSection;
  /**
   * Visible menu items with their values resolved: labels translated and `isDisabled` evaluated.
   * Select one through the engine's `selectObjectTitlebarMenuItem` method.
   */
  items: UpdrawTitlebarMenuItem[];
  /** The menu button, for anchoring and returning focus to. Lives in the engine's shadow root. */
  anchor?: HTMLElement;
  /** Client rect of the menu button when the menu opened. */
  anchorRect?: DOMRect;
}
