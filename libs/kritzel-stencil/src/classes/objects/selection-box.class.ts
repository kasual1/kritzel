import { KritzelStore } from '../store.class';
import { KritzelBaseObject } from './base-object.class';

export class KrtizelSelectionBox extends KritzelBaseObject<HTMLElement> {
  override __class__: string = 'KrtizelSelectionBox';

  objects: KritzelBaseObject<any>[] = [];

  static override create(store: KritzelStore): KrtizelSelectionBox {
    const object = new KrtizelSelectionBox();

    object._store = store;
    object.id = object.generateId();
    object.scale = store.state.scale;
    object.zIndex = 99999;
    object.backgroundColor = 'var(--kritzel-selection-box-background-color, rgba(14, 17, 17, 0.2))';
    object.borderColor = 'var(--kritzel-selection-box-border-color, rgba(14, 17, 17, 0.5))';
    object.borderWidth = 2;
    object.height = 0;
    object.width = 0;

    return object;
  }
}
