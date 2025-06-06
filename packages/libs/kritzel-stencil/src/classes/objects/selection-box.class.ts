import { KritzelStore } from '../store.class';
import { KritzelBaseObject } from './base-object.class';

export class KrtizelSelectionBox extends KritzelBaseObject<HTMLElement> {
  override __class__: string = 'KrtizelSelectionBox';

  objects: KritzelBaseObject<any>[] = [];

  constructor(store: KritzelStore) {
    super(store);
    this.backgroundColor = 'var(--kritzel-selection-box-background-color)';
    this.borderColor = 'var(--kritzel-selection-box-border-color)';
    this.borderWidth = 2;
    this.scale = this._store.state.scale;
    this.height = 0;
    this.width = 0;
    this.zIndex = 9999;
  }
}
