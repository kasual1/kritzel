import { KritzelCore } from '../core/core.class';
import { KritzelBaseObject } from './base-object.class';
import { ThemeAwareColor } from '../../constants/color-palette.constants';

/**
 * Represents a visual selection box used for multi-object selection on the canvas.
 * The selection box is rendered as a semi-transparent rectangle with a border,
 * typically shown when the user drags to select multiple objects.
 */
export class KritzelSelectionBox extends KritzelBaseObject<HTMLElement> {
  override __class__: string = 'KritzelSelectionBox';

  /**
   * Factory method to create a new KritzelSelectionBox instance with default styling.
   * Initializes the selection box with a blue semi-transparent background and border,
   * positioned at the highest z-index to ensure visibility above all other objects.
   *
   * @param core - The KritzelCore instance providing access to the store and workspace state.
   * @returns A fully initialized KritzelSelectionBox instance with default dimensions of 0x0.
   */
  static override create(core: KritzelCore): KritzelSelectionBox {
    const object = new KritzelSelectionBox();

    object._core = core;
    object.id = object.generateId();
    object.workspaceId = core.store.state.activeWorkspace!.id;
    object.userId = core.user?.id;
    object.scale = core.store.state.scale;
    object.zIndex = 99999;
    object.backgroundColor = { light: 'var(--kritzel-selection-box-background-color)', dark: 'var(--kritzel-selection-box-background-color)' } as ThemeAwareColor;
    object.borderColor = { light: 'var(--kritzel-selection-box-border-color)', dark: 'var(--kritzel-selection-box-border-color)' } as ThemeAwareColor;
    object.borderWidth = 2;
    object.height = 0;
    object.width = 0;

    return object;
  }
}
