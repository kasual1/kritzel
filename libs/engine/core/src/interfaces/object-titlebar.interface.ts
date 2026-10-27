import { KritzelBaseObject } from '../classes/objects/base-object.class';
import { KritzelIconName } from '../classes/registries/icon-registry.class';
import { KritzelTermKey, KritzelTermVars } from './localization.interface';

/**
 * A static value or a function resolving it from the titlebar context.
 *
 * Functions are evaluated synchronously on every render, so they must be pure and cheap.
 * Unlike {@link ContextMenuItem} predicates, promises are not supported.
 */
export type KritzelTitlebarValue<T> = T | ((context: KritzelObjectTitlebarContext) => T);

/** Section of the titlebar an element is rendered in. */
export type KritzelTitlebarSection = 'left' | 'center' | 'right';

/** Information about the object a titlebar belongs to, passed to dynamic element values and actions. */
export interface KritzelObjectTitlebarContext {
  /** The owner of the titlebar: a top-level object or group for which `objectConfig.hasTitlebar` is true. */
  object: KritzelBaseObject;
  /** The owner's class name, e.g. `'KritzelGroup'`. */
  objectType: string;
  /** The owner's children when it is a group, otherwise an empty array. */
  children: KritzelBaseObject[];
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
  t: (key: KritzelTermKey | (string & NonNullable<unknown>), vars?: KritzelTermVars) => string;
}

interface KritzelTitlebarElementBase {
  /** Stable identifier, used as render key, `data-element-id` and in `objectTitlebarAction` events. */
  id: string;
  isVisible?: KritzelTitlebarValue<boolean>;
  /** Restricts the element to the active or inactive state. Defaults to `'always'`. */
  showWhen?: 'always' | 'active' | 'inactive';
  /** Hides the element while the titlebar is narrower than this many screen pixels. */
  minBarWidth?: number;
  /** Additional `part` name for styling the element with `::part()`. */
  part?: string;
}

/** Displays the resolved title of the owner. */
export interface KritzelTitlebarTitle extends KritzelTitlebarElementBase {
  type: 'title';
  /** Overrides the resolved title for this element. A title with `text` cannot be edited. */
  text?: KritzelTitlebarValue<string>;
  /**
   * Lets users rename the object by clicking the title of its active titlebar again.
   * The new name is stored in the object's `name`; an empty name falls back to the default title.
   * Defaults to `false`.
   */
  isEditable?: KritzelTitlebarValue<boolean>;
}

/** Displays arbitrary text, e.g. the object's width. */
export interface KritzelTitlebarText extends KritzelTitlebarElementBase {
  type: 'text';
  text: KritzelTitlebarValue<string>;
  tone?: 'default' | 'muted' | 'strong';
}

/** Displays a non-interactive icon from the icon registry. */
export interface KritzelTitlebarIcon extends KritzelTitlebarElementBase {
  type: 'icon';
  icon: KritzelTitlebarValue<KritzelIconName>;
}

/** An interactive button. Clicking it never starts a drag or changes the selection. */
export interface KritzelTitlebarButton extends KritzelTitlebarElementBase {
  type: 'button';
  icon?: KritzelTitlebarValue<KritzelIconName>;
  /** Button text. Term keys are translated through the active locale, other strings are used verbatim. */
  label?: KritzelTermKey | (string & NonNullable<unknown>);
  /** Tooltip and accessible label. Term keys are translated through the active locale. */
  tooltip?: KritzelTermKey | (string & NonNullable<unknown>);
  variant?: 'ghost' | 'filled' | 'outlined';
  isDisabled?: KritzelTitlebarValue<boolean>;
  isPressed?: KritzelTitlebarValue<boolean>;
  /** Called on click. The `objectTitlebarAction` event is emitted either way. */
  action?: (context: KritzelObjectTitlebarContext, event: MouseEvent) => void;
}

/** An entry of a {@link KritzelTitlebarMenu}. */
export interface KritzelTitlebarMenuItem {
  /** Stable identifier, reported as `menuItemId` in `objectTitlebarAction` events. */
  id: string;
  /** Term keys are translated through the active locale, other strings are used verbatim. */
  label: KritzelTermKey | (string & NonNullable<unknown>);
  icon?: KritzelIconName;
  isVisible?: KritzelTitlebarValue<boolean>;
  isDisabled?: KritzelTitlebarValue<boolean>;
  /** Called when the menu item is selected. The `objectTitlebarAction` event is emitted either way. */
  action?: (context: KritzelObjectTitlebarContext, menuItem: KritzelTitlebarMenuItem) => void;
}

/**
 * A button that opens a menu. The engine only tracks which menu is open and emits
 * `objectTitlebarMenuStateChange`; rendering the menu is up to the host, e.g. `kritzel-editor`.
 * The menu closes when the camera moves, the object is deselected or its titlebar is hidden.
 */
export interface KritzelTitlebarMenu extends KritzelTitlebarElementBase {
  type: 'menu';
  icon?: KritzelTitlebarValue<KritzelIconName>;
  /** Button text. Term keys are translated through the active locale, other strings are used verbatim. */
  label?: KritzelTermKey | (string & NonNullable<unknown>);
  /** Tooltip and accessible label. Term keys are translated through the active locale. */
  tooltip?: KritzelTermKey | (string & NonNullable<unknown>);
  variant?: 'ghost' | 'filled' | 'outlined';
  isDisabled?: KritzelTitlebarValue<boolean>;
  /** Menu items, resolved when the menu opens. */
  items: KritzelTitlebarValue<KritzelTitlebarMenuItem[]>;
}

/** Flexible empty space (`spacer`) or a thin divider (`separator`). */
export interface KritzelTitlebarSpacer extends KritzelTitlebarElementBase {
  type: 'spacer' | 'separator';
}

export type KritzelTitlebarElement =
  | KritzelTitlebarTitle
  | KritzelTitlebarText
  | KritzelTitlebarIcon
  | KritzelTitlebarButton
  | KritzelTitlebarMenu
  | KritzelTitlebarSpacer;

/**
 * Content and appearance of the titlebar rendered above the objects for which
 * `objectConfig.hasTitlebar` is true. The same configuration applies to every object.
 */
export interface KritzelObjectTitlebarConfig {
  /** Elements in the left section. Defaults to a single title element. */
  left?: KritzelTitlebarElement[];
  center?: KritzelTitlebarElement[];
  right?: KritzelTitlebarElement[];
  /** Show titlebars always (default) or only while their object is selected. */
  visibility?: 'always' | 'active';
  /** Follow the object's rotation (default) or stay upright above its rotated bounding box. */
  rotation?: 'follow' | 'upright';
  /** Resolves the title of an object. Falls back to the object's name, then to a localized type label. */
  title?: (object: KritzelBaseObject) => string | undefined;
  /** Whether dragging the titlebar moves its object. Defaults to `true`. */
  draggable?: boolean;
  /** Hides titlebars whose object is narrower than this many screen pixels. Defaults to 40. */
  hideBelowWidth?: number;
}

/** Payload of the `objectTitlebarAction` event emitted when a titlebar button or menu item is clicked. */
export interface KritzelObjectTitlebarActionEvent {
  /** Id of the clicked button, or of the menu the selected menu item belongs to. */
  elementId: string;
  /** Id of the selected menu item, when a menu item was selected. */
  menuItemId?: string;
  section: KritzelTitlebarSection;
  objectId: string;
  objectType: string;
  workspaceId: string;
  /** Client rect of the clicked button or menu button, e.g. for anchoring a popover. */
  anchorRect: DOMRect;
}

/** Payload of the `objectTitlebarMenuStateChange` event, emitted when a titlebar menu opens or closes. */
export interface KritzelObjectTitlebarMenuState {
  isVisible: boolean;
  /** Owner of the titlebar whose menu is open. */
  objectId?: string;
  /** Id of the open menu element. */
  elementId?: string;
  section?: KritzelTitlebarSection;
  /**
   * Visible menu items with their values resolved: labels translated and `isDisabled` evaluated.
   * Select one through the engine's `selectObjectTitlebarMenuItem` method.
   */
  items: KritzelTitlebarMenuItem[];
  /** The menu button, for anchoring and returning focus to. Lives in the engine's shadow root. */
  anchor?: HTMLElement;
  /** Client rect of the menu button when the menu opened. */
  anchorRect?: DOMRect;
}
