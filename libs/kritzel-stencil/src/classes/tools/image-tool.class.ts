import { KritzelImage } from '../objects/image.class';
import { KritzelBaseTool } from './base-tool.class';
import imageCompression from 'browser-image-compression';
import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelCore } from '../core/core.class';

export class KritzelImageTool extends KritzelBaseTool {
  fileInput: HTMLInputElement | null = null;

  maxCompressionSize: number = 300;

  constructor(core: KritzelCore) {
    super(core);
    this.setupFileInput();
  }

  override onActivate(): void {
    this.openFilePicker();
  }

  private openFilePicker(): void {
     if(this._core.store.isDisabled){
      return;
    }
    
    this.fileInput.click();
  }

  private setupFileInput(): void {
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = 'image/*';
    this.fileInput.style.display = 'none';

    this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    this.fileInput.addEventListener('cancel', this.handleCancel.bind(this));
    document.body.appendChild(this.fileInput);
  }

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

  private readFile(file: File): void {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => this.createKritzelImage(img);
    };
    reader.readAsDataURL(file);
  }


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

  private addImageToStore(image: KritzelImage): void {
    this._core.addObject(image);
    this._core.store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
    this._core.selectObjects([image]);
    this._core.engine.emitObjectsChange();
  }

  private handleCancel(): void {
    this._core.store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
  }
}
