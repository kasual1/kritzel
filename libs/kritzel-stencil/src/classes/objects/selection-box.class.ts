import { KritzelCore } from '../core/core.class';
import { KritzelBaseObject } from './base-object.class';
import { ThemeAwareColor } from '../../constants/color-palette.constants';

export class KritzelSelectionBox extends KritzelBaseObject<HTMLElement> {
  override __class__: string = 'KritzelSelectionBox';

  static override create(core: KritzelCore): KritzelSelectionBox {
    const object = new KritzelSelectionBox();

    object._core = core;
    object.id = object.generateId();
    object.workspaceId = core.store.state.activeWorkspace.id
    object.scale = core.store.state.scale;
    object.zIndex = 99999;
    object.backgroundColor = { light: 'rgba(0, 122, 255, 0.2)', dark: 'rgba(0, 122, 255, 0.2)' } as ThemeAwareColor;
    object.borderColor = { light: 'rgba(0, 122, 255, 0.5)', dark: 'rgba(0, 122, 255, 0.5)' } as ThemeAwareColor;
    object.borderWidth = 2;
    object.height = 0;
    object.width = 0;

    return object;
  }
}
