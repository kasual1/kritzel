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
      img.onload = () => this.createKritzelImage(img);
    };
    reader.readAsDataURL(file);
  }


  private createKritzelImage(img: HTMLImageElement): KritzelImage {
    const image = KritzelImage.create(this._store);
    const { scaledWidth, scaledHeight } = image.calculateScaledDimensions(img);
    image.src = img.src;
    image.width = scaledWidth;
    image.height = scaledHeight;
    image.zIndex = this._store.currentZIndex;
    image.centerInViewport();
    this.addImageToStore(image);
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
