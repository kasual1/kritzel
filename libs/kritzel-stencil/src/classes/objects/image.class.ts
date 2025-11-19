import { KritzelCore } from '../core/core.class';
import { KritzelBaseObject } from './base-object.class';

export class KritzelImage extends KritzelBaseObject<HTMLImageElement> {
  override __class__: string = 'KritzelImage';

  src: string = '';

  maxWidth: number = 300;
  maxHeight: number = 300;

  maxCompressionSize: number = 300;

  override isDebugInfoVisible: boolean = true;

  constructor(config?: Partial<KritzelImage>) {
    super();
    this.src = config?.src || '';
    this.x = config?.x || 0;
    this.y = config?.y || 0;
    this.translateX = config?.translateX || 0;
    this.translateY = config?.translateY || 0;
    this.scale = config?.scale || 1;
  }

  static override create(core: KritzelCore): KritzelImage {
    const object = new KritzelImage();

    object._core = core;
    object.id = object.generateId();
    object.workspaceId = core.store.state.activeWorkspace.id
    object.x = 0;
    object.y = 0;
    object.translateX = 0;
    object.translateY = 0;
    object.scale = object._core.store.state.scale;
    object.zIndex = core.store.currentZIndex;

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

    // Update to sync changes to y.js and propagate to other tabs
    this._core.store.state.objects.update(this);
  }

  calculateScaledDimensions(img: HTMLImageElement): { scaledWidth: number; scaledHeight: number } {
    let scaledWidth = img.width;
    let scaledHeight = img.height;

    if (img.width > this.maxWidth || img.height > this.maxHeight) {
      const widthRatio = this.maxWidth / img.width;
      const heightRatio = this.maxHeight / img.height;
      const scaleRatio = Math.min(widthRatio, heightRatio);

      scaledWidth = img.width * scaleRatio;
      scaledHeight = img.height * scaleRatio;
    }

    return { scaledWidth, scaledHeight };
  }
}
