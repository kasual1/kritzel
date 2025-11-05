import { KritzelCore } from '../core/core.class';
import { KritzelBaseObject } from './base-object.class';

export class KritzelSelectionBox extends KritzelBaseObject<HTMLElement> {
  override __class__: string = 'KritzelSelectionBox';

  objects: KritzelBaseObject<any>[] = [];

  static override create(core: KritzelCore): KritzelSelectionBox {
    const object = new KritzelSelectionBox();

    object._core = core;
    object.id = object.generateId();
    object.workspaceId = core.store.state.activeWorkspace.id
    object.scale = core.store.state.scale;
    object.zIndex = 99999;
    object.backgroundColor = 'var(--kritzel-selection-box-background-color, rgba(0, 122, 255, 0.2))';
    object.borderColor = 'var(--kritzel-selection-box-border-color, rgba(0, 122, 255, 0.5))';
    object.borderWidth = 2;
    object.height = 0;
    object.width = 0;

    return object;
  }
}
