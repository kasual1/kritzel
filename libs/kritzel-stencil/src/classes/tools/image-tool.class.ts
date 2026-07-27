import { KritzelImage } from '../objects/image.class';
import { KritzelBaseTool } from './base-tool.class';
import imageCompression from 'browser-image-compression';
import { KritzelCore } from '../core/core.class';
import { KritzelImageFileHelper } from '../../helpers/image-file.helper';

/**
 * Image tool for importing and placing images on the canvas.
 *
 * Flow:
 *   1. User picks a file.
 *   2. Static images are compressed via `browser-image-compression` (bandwidth win).
 *      GIF files retain their original bytes so animation is preserved.
 *   3. Intrinsic dimensions are measured from a temporary object URL.
 *   4. Bytes are uploaded through the asset resolver (write-through:
 *      local IndexedDB immediately, remote providers in the background).
 *   5. A `KritzelImage` is created carrying only the resulting asset id
 *      and MIME type, then added to the canvas. The renderer resolves
 *      the id to a URL via the asset resolver.
 */
export class KritzelImageTool extends KritzelBaseTool {
  override toolType = 'image' as const;

  /** Hidden file input element for image selection */
  fileInput: HTMLInputElement | null = null;

  /** Maximum dimension (width or height) for image compression in pixels */
  maxCompressionSize: number = 1200;

  /** Diagonal offset (in world units) applied between images when multiple are imported at once */
  multiImportOffset: number = 20;

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
    this.fileInput.multiple = true;
    this.fileInput.style.display = 'none';

    this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    this.fileInput.addEventListener('cancel', this.handleCancel.bind(this));
    document.body.appendChild(this.fileInput);
  }

  /**
   * Handles the file selection event from the file input.
   * Compresses each selected image if necessaryand places them as a batch on the canvas.
   * Resets the file input value after processing.
   * @param event - The change event from the file input element
   */
  private handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];

    if (files.length === 0) {
      console.info('File selection cancelled by user.');
      this.handleCancel();
      if (input) {
        input.value = '';
      }
      return;
    }

    const prepared = files.map(async file => {
      const preparedFile = await this.prepareImageFile(file);
      return KritzelImage.fromBlob(this._core, preparedFile);
    });

    Promise.allSettled(prepared)
      .then(results => {
        const images: KritzelImage[] = [];
        for (const result of results) {
          if (result.status === 'fulfilled') {
            images.push(result.value);
          } else {
            console.error('Error during image compression or processing:', result.reason);
          }
        }

        if (images.length === 0) {
          this.handleCancel();
          return;
        }

        this.addImagesToStore(images);
      });

    if (input) {
      input.value = '';
    }
  }

  /**
   * Prepares an image file for insertion by compressing it if necessary.
   * @param file 
   * @returns 
   */
  private async prepareImageFile(file: File): Promise<File> {
    if (KritzelImageFileHelper.isGifFile(file)) {
      return file;
    }

    return imageCompression(file, { maxWidthOrHeight: this.maxCompressionSize });
  }

  /**
   * Adds a batch of prepared images to the canvas store and switches
   * to the selection tool. The first image is centered in the viewport;
   * each subsequent image is offset diagonally so multiple imports do
   * not fully overlap. All images are selected together and a single
   * batch change/added event is emitted.
   *
   * @param images - The prepared `KritzelImage` objects to add
   */
  private addImagesToStore(images: KritzelImage[]): void {
    const baseZIndex = this._core.store.currentZIndex;

    images.forEach((image, index) => {
      image.zIndex = baseZIndex + index;
      image.centerInViewport();
      if (index > 0) {
        const offset = index * this.multiImportOffset;
        image.updatePosition(image.translateX + offset, image.translateY + offset);
      }
      this._core.addObject(image);
    });

    this._core.store.setState('activeTool', this._core.toolRegistry.getTool('selection'));
    this._core.selectObjects(images);
    this._core.engine.emitObjectsChange();
    this._core.engine.emitObjectsAdded(images);
  }

  /**
   * Handles cancellation of the file picker or errors during image processing.
   * Switches back to the selection tool without adding any image.
   */
  private handleCancel(): void {
    this._core.store.setState('activeTool', this._core.toolRegistry.getTool('selection'));
  }
}
