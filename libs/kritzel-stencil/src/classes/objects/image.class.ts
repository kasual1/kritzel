import { KritzelCore } from '../core/core.class';
import { KritzelBaseObject } from './base-object.class';

/**
 * Represents an image object on the canvas.
 * Extends KritzelBaseObject to provide image-specific functionality
 * including scaling and dimension calculations.
 */
export class KritzelImage extends KritzelBaseObject<HTMLImageElement> {
  override __class__: string = 'KritzelImage';

  src: string = '';

  maxWidth: number = 300;
  maxHeight: number = 300;

  maxCompressionSize: number = 300;

  override isDebugInfoVisible: boolean = true;

  /**
   * Creates a new KritzelImage instance.
   * @param config - Optional partial configuration object to initialize image properties
   *                 including src, position (x, y), translation, and scale.
   */
  constructor(config?: Partial<KritzelImage>) {
    super();
    this.src = config?.src || '';
    this.x = config?.x || 0;
    this.y = config?.y || 0;
    this.translateX = config?.translateX || 0;
    this.translateY = config?.translateY || 0;
    this.scale = config?.scale || 1;
    this.width = config?.width || 0;
    this.height = config?.height || 0;
    this.maxWidth = config?.maxWidth ?? 300;
    this.maxHeight = config?.maxHeight ?? 300;
  }

  /**
   * Factory method to create a new KritzelImage instance with core integration.
   * Initializes the image with default values and links it to the core store.
   * @param core - The KritzelCore instance providing access to store and state management.
   * @returns A new KritzelImage instance configured with the core context.
   */
  static override create(core: KritzelCore): KritzelImage {
    const object = new KritzelImage();

    object._core = core;
    object.id = object.generateId();
    object.workspaceId = core.store.state.activeWorkspace.id;
    object.userId = core.user?.id;
    object.x = 0;
    object.y = 0;
    object.translateX = 0;
    object.translateY = 0;
    object.scale = object._core.store.state.scale;
    object.zIndex = core.store.currentZIndex;

    return object;
  }

  /**
   * Resizes the image while maintaining aspect ratio based on the new height.
   * Updates the image's position and dimensions, then syncs changes to y.js
   * for collaborative editing support.
   * @param x - The new x translation coordinate.
   * @param y - The new y translation coordinate.
   * @param width - The new width (used for validation, not directly applied).
   * @param height - The new height used to calculate the scale factor.
   */
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

  /**
   * Creates a KritzelImage from a URL, handling image loading and dimension calculation.
   * Loads the image, calculates scaled dimensions respecting maxWidth/maxHeight constraints,
   * and returns a fully configured KritzelImage instance.
   * @param src - The image URL or data URI to load.
   * @param config - Optional partial configuration to pass to the KritzelImage constructor.
   * @returns A promise resolving to a fully configured KritzelImage with correct dimensions.
   */
  static fromUrl(src: string, config?: Partial<KritzelImage>): Promise<KritzelImage> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const image = new KritzelImage({ ...config, src });
        const { scaledWidth, scaledHeight } = image.calculateScaledDimensions(img);
        image.width = scaledWidth;
        image.height = scaledHeight;
        resolve(image);
      };
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  }

  /**
   * Calculates scaled dimensions for an image while respecting maxWidth and maxHeight constraints.
   * Maintains the original aspect ratio by using the smaller of the two scale ratios.
   * @param img - The HTMLImageElement to calculate dimensions for.
   * @returns An object containing the scaled width and height values.
   */
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
