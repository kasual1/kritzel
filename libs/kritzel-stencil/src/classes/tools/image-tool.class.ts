import { KritzelImage } from '../objects/image.class';
import { KritzelBaseTool } from './base-tool.class';
import imageCompression from 'browser-image-compression';
import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelCore } from '../core/core.class';

/**
 * Image tool for importing and placing images on the canvas.
 *
 * Flow:
 *   1. User picks a file.
 *   2. Image is compressed via `browser-image-compression` (bandwidth win).
 *   3. Intrinsic dimensions are measured from a temporary object URL.
 *   4. Bytes are uploaded through the asset resolver (write-through:
 *      local IndexedDB immediately, remote providers in the background).
 *   5. A `KritzelImage` is created carrying only the resulting asset id
 *      and MIME type, then added to the canvas. The renderer resolves
 *      the id to a URL via the asset resolver.
 */
export class KritzelImageTool extends KritzelBaseTool {
  /** Hidden file input element for image selection */
  fileInput: HTMLInputElement | null = null;

  /** Maximum dimension (width or height) for image compression in pixels */
  maxCompressionSize: number = 300;

  /**
   * Creates a new instance of KritzelImageTool.
   * Sets up the hidden file input element for image selection.
   * @param core - The KritzelCore instance that provides access to application state and functionality
   */
  constructor(core: KritzelCore) {
    super(core);
    this.setupFileInput();
  }

  /**
   * Called when the image tool becomes active.
   * Automatically opens the file picker dialog.
   */
  override onActivate(): void {
    this.openFilePicker();
  }

  /**
   * Opens the native file picker dialog for image selection.
   * Does nothing if the canvas is in disabled state.
   */
  private openFilePicker(): void {
    if (this._core.store.isDisabled) {
      return;
    }

    this.fileInput?.click();
  }

  /**
   * Creates and configures the hidden file input element.
   * Sets up event listeners for file selection and cancellation.
   */
  private setupFileInput(): void {
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = 'image/*';
    this.fileInput.style.display = 'none';

    this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    this.fileInput.addEventListener('cancel', this.handleCancel.bind(this));
    document.body.appendChild(this.fileInput);
  }

  /**
   * Handles the file selection event from the file input.
   * Compresses the selected image and processes it for canvas placement.
   * Resets the file input value after processing.
   * @param event - The change event from the file input element
   */
  private handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (file) {
      imageCompression(file, {
        maxWidthOrHeight: this.maxCompressionSize,
      })
        .then(compressedFile => this.uploadAndPlace(compressedFile))
        .catch(error => {
          console.error('Error during image compression or processing:', error);
          this.handleCancel();
        });
    } else {
      console.info('File selection cancelled by user.');
      this.handleCancel();
    }

    if (input) {
      input.value = '';
    }
  }

  /**
   * Uploads the image blob through the asset resolver and places the
   * resulting `KritzelImage` on the canvas. Intrinsic image dimensions
   * are measured locally before upload so layout is correct immediately.
   *
   * @param blob - Compressed image bytes to store and render
   */
  private async uploadAndPlace(blob: Blob): Promise<void> {
    let tempUrl: string | null = null;
    try {
      const mimeType = blob.type || 'image/png';
      tempUrl = URL.createObjectURL(blob);

      const dimensions = await this.measureImage(tempUrl);

      const asset = await this._core.assetResolver.put(blob, {
        mimeType,
        kind: 'image',
        width: dimensions.naturalWidth,
        height: dimensions.naturalHeight,
      });

      const image = KritzelImage.create(this._core);
      image.assetId = asset.id;
      image.mimeType = asset.mimeType;
      const { scaledWidth, scaledHeight } = image.calculateScaledDimensions({
        width: dimensions.naturalWidth,
        height: dimensions.naturalHeight,
      } as HTMLImageElement);
      image.width = scaledWidth;
      image.height = scaledHeight;
      image.zIndex = this._core.store.currentZIndex;
      // Seed the resolved URL so the renderer can display the image
      // without waiting for a resolver round-trip.
      image.resolvedSrc = await this._core.assetResolver.resolve(asset.id);
      image.loadState = 'ready';
      image.centerInViewport();
      this.addImageToStore(image);
    } catch (error) {
      console.error('Error uploading image to asset storage:', error);
      this.handleCancel();
    } finally {
      if (tempUrl) {
        try {
          URL.revokeObjectURL(tempUrl);
        } catch {
          /* ignore */
        }
      }
    }
  }

  /**
   * Measures the natural dimensions of an image from a URL. Used to
   * provide width/height hints when uploading and to compute the
   * scaled canvas dimensions.
   */
  private measureImage(url: string): Promise<{ naturalWidth: number; naturalHeight: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
      img.onerror = err => reject(err);
      img.src = url;
    });
  }

  /**
   * Adds the created image to the canvas store and switches to selection tool.
   * Selects the newly added image and emits an objects change event.
   * @param image - The KritzelImage object to add to the canvas
   */
  private addImageToStore(image: KritzelImage): void {
    this._core.addObject(image);
    this._core.store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
    this._core.selectObjects([image]);
    this._core.engine.emitObjectsChange();
    this._core.engine.emitObjectsAdded([image]);
  }

  /**
   * Handles cancellation of the file picker or errors during image processing.
   * Switches back to the selection tool without adding any image.
   */
  private handleCancel(): void {
    this._core.store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
  }
}
