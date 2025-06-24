import { KritzelStore } from '../store.class';
import { KritzelBaseObject } from './base-object.class';

export class KritzelImage extends KritzelBaseObject<HTMLImageElement> {
  override __class__: string = 'KritzelImage';

  src: string = '';

  override debugInfoVisible: boolean = true;

  static override create(store: KritzelStore): KritzelImage {
    const object = new KritzelImage();

    object._store = store;
    object.id = object.generateId();
    object.x = 0;
    object.y = 0;
    object.translateX = 0;
    object.translateY = 0;
    object.scale = object._store.state.scale;

    return object;
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
