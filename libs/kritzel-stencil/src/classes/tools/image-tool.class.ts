import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelImage } from '../objects/image.class';
import { KritzelStore } from '../store.class';
import { KritzelBaseTool } from './base-tool.class';
import { AddObjectCommand } from '../commands/add-object.command';
import { BatchCommand } from '../commands/batch.command';
import { AddSelectionGroupCommand } from '../commands/add-selection-group.command';
import imageCompression from 'browser-image-compression';
import { KritzelToolRegistry } from '../registries/tool.registry';

export class KritzelImageTool extends KritzelBaseTool {
  fileInput: HTMLInputElement | null = null;

  maxWidth: number = 300;
  maxHeight: number = 300;

  maxCompressionSize: number = 300;

  constructor(store: KritzelStore) {
    super(store);
    this.setupFileInput();
  }

  override onActivate(): void {
    this.openFilePicker();
  }

  private openFilePicker(): void {
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
      img.onload = () => this.processImage(img);
    };
    reader.readAsDataURL(file);
  }

  private processImage(img: HTMLImageElement): void {
    const { scaledWidth, scaledHeight } = this.calculateScaledDimensions(img);
    const image = this.createKritzelImage(img, scaledWidth, scaledHeight);
    this.addImageToStore(image);
  }

  private calculateScaledDimensions(img: HTMLImageElement): { scaledWidth: number; scaledHeight: number } {
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

  private createKritzelImage(img: HTMLImageElement, width: number, height: number): KritzelImage {
    const image = KritzelImage.create(this._store);
    image.src = img.src;
    image.width = width;
    image.height = height;
    image.zIndex = this._store.currentZIndex;
    image.centerInViewport();
    return image;
  }

  private addImageToStore(image: KritzelImage): void {
    const selectionGroup = KritzelSelectionGroup.create(this._store);
    selectionGroup.addOrRemove(image);
    selectionGroup.selected = true;

    const addImageCommand = new AddObjectCommand(this._store, this, image);
    const addSelectionGroupCommand = new AddSelectionGroupCommand(this._store, this, selectionGroup);

    this._store.history.executeCommand(new BatchCommand(this._store, this, [addImageCommand, addSelectionGroupCommand]));

    this._store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
  }

  private handleCancel(): void {
    this._store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
  }
}
