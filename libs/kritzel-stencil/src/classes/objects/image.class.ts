import { KritzelStore } from '../store.class';
import { KritzelBaseObject } from './base-object.class';

export class KritzelImage extends KritzelBaseObject<HTMLImageElement> {
  override __class__: string = 'KritzelImage';

  src: string = '';

  override debugInfoVisible: boolean = true;

  constructor(store: KritzelStore) {
    super(store);
    this.x = 0;
    this.y = 0;
    this.translateX = 0;
    this.translateY = 0;
    this.scale = this._store.state.scale;
  }

  override resize(x: number, y: number, width: number, height: number): void {
    if (width <= 1 || height <= 1) {
      return;
    }

    const scaleFactor = height / this.height;

    this.width = this.width * scaleFactor;
    this.height = this.height * scaleFactor;
    this.translateX = x;
    this.translateY = y;
  }
}
