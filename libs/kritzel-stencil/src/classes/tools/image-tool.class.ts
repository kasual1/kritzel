import { KritzelImage } from '../objects/image.class';
import { KritzelBaseTool } from './base-tool.class';
import imageCompression from 'browser-image-compression';
import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelCore } from '../core/core.class';

/**
 * Image tool for importing and placing images on the canvas.
 * Opens a file picker when activated, compresses the selected image,
 * and places it centered in the viewport. Automatically switches to
 * selection tool after image placement.
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

    this.fileInput.click();
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
    if (input.files && input.files[0]) {
      const file = input.files[0];
      imageCompression(file, {
        maxWidthOrHeight: this.maxCompressionSize,
      })
        .then(compressedFile => {
          this.readFile(compressedFile);
        })
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
   * Reads the compressed image file and creates an HTMLImageElement.
   * Triggers createKritzelImage once the image is loaded.
   * @param file - The compressed image file to read
   */
  private readFile(file: File): void {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => this.createKritzelImage(img);
    };
    reader.readAsDataURL(file);
  }


  /**
   * Creates a KritzelImage object from the loaded HTMLImageElement.
   * Calculates scaled dimensions, sets the image source, and centers it in the viewport.
   * @param img - The loaded HTMLImageElement containing the image data
   * @returns The created KritzelImage object
   */
  private createKritzelImage(img: HTMLImageElement): KritzelImage {
    const image = KritzelImage.create(this._core);
    const { scaledWidth, scaledHeight } = image.calculateScaledDimensions(img);
    image.src = img.src;
    image.width = scaledWidth;
    image.height = scaledHeight;
    image.zIndex = this._core.store.currentZIndex;
    image.centerInViewport();
    this.addImageToStore(image);
    return image;
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
