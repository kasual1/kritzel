import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelImage } from '../objects/image.class';
import { KritzelSelectionTool } from './selection-tool.class';
import { KritzelStore } from '../store.class';
import { KritzelBaseTool } from './base-tool.class';
import { AddObjectCommand } from '../commands/add-object.command';
import { BatchCommand } from '../commands/batch.command';
import { AddSelectionGroupCommand } from '../commands/add-selection-group.command';
import imageCompression from "browser-image-compression";


export class KritzelImageTool extends KritzelBaseTool {
  name: string = 'image';

  fileInput: HTMLInputElement;

  maxWidth: number = 300;
  maxHeight: number = 300;

  maxCompressionSize: number = 300;

  constructor(store: KritzelStore) {
    super(store);
    this.setupFileInput();
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
    document.body.appendChild(this.fileInput);
  }

  private handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      imageCompression(file, {
         maxWidthOrHeight: this.maxCompressionSize
      }).then((compressedFile) => {
        this.readFile(compressedFile);
      });
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
    const image = new KritzelImage(this._store, img);
    image.width = width;
    image.height = height;
    image.zIndex = this._store.currentZIndex;
    image.centerInViewport();
    return image;
  }

  private addImageToStore(image: KritzelImage): void {
    const selectionGroup = new KritzelSelectionGroup(this._store);
    selectionGroup.addOrRemove(image);
    selectionGroup.selected = true;

    const addImageCommand = new AddObjectCommand(this._store, this, image);
    const addSelectionGroupCommand = new AddSelectionGroupCommand(this._store, this, selectionGroup);

    this._store.history.executeCommand(new BatchCommand(this._store, this, [addImageCommand, addSelectionGroupCommand]));

    this._store.setState('activeTool',new KritzelSelectionTool(this._store));
  }
}
