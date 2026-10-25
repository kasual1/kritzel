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

/** Section of the titlebar an item is rendered in. */
export type KritzelTitlebarSection = 'left' | 'center' | 'right';

/** Information about the object a titlebar belongs to, passed to dynamic item values and actions. */
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

interface KritzelTitlebarItemBase {
  /** Stable identifier, used as render key, `data-item-id` and in `objectTitlebarAction` events. */
  id: string;
  isVisible?: KritzelTitlebarValue<boolean>;
  /** Restricts the item to the active or inactive state. Defaults to `'always'`. */
  showWhen?: 'always' | 'active' | 'inactive';
  /** Hides the item while the titlebar is narrower than this many screen pixels. */
  minBarWidth?: number;
  /** Additional `part` name for styling the item with `::part()`. */
  part?: string;
}

/** Displays the resolved title of the owner. */
export interface KritzelTitlebarTitleItem extends KritzelTitlebarItemBase {
  type: 'title';
  /** Overrides the resolved title for this item. */
  text?: KritzelTitlebarValue<string>;
}

/** Displays arbitrary text, e.g. the object's width. */
export interface KritzelTitlebarTextItem extends KritzelTitlebarItemBase {
  type: 'text';
  text: KritzelTitlebarValue<string>;
  tone?: 'default' | 'muted' | 'strong';
}

/** Displays a non-interactive icon from the icon registry. */
export interface KritzelTitlebarIconItem extends KritzelTitlebarItemBase {
  type: 'icon';
  icon: KritzelTitlebarValue<KritzelIconName>;
}

/** An interactive button. Clicking it never starts a drag or changes the selection. */
export interface KritzelTitlebarButtonItem extends KritzelTitlebarItemBase {
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

/** Flexible empty space (`spacer`) or a thin divider (`separator`). */
export interface KritzelTitlebarSpacerItem extends KritzelTitlebarItemBase {
  type: 'spacer' | 'separator';
}

export type KritzelTitlebarItem =
  | KritzelTitlebarTitleItem
  | KritzelTitlebarTextItem
  | KritzelTitlebarIconItem
  | KritzelTitlebarButtonItem
  | KritzelTitlebarSpacerItem;

/**
 * Content and appearance of the titlebar rendered above the objects for which
 * `objectConfig.hasTitlebar` is true. The same configuration applies to every object.
 */
export interface KritzelObjectTitlebarConfig {
  /** Items in the left section. Defaults to a single title item. */
  left?: KritzelTitlebarItem[];
  center?: KritzelTitlebarItem[];
  right?: KritzelTitlebarItem[];
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

/** Payload of the `objectTitlebarAction` event emitted when a titlebar button is clicked. */
export interface KritzelObjectTitlebarActionEvent {
  itemId: string;
  section: KritzelTitlebarSection;
  objectId: string;
  objectType: string;
  workspaceId: string;
  /** Client rect of the clicked button, e.g. for anchoring a popover. */
  anchorRect: DOMRect;
}
