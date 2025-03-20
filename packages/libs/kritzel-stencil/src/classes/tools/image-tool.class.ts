import { KritzelTool } from "../../components";
import { kritzelEngineState } from "../../stores/engine.store";
import { KritzelSelectionGroup } from "../objects/selection-group.class";
import { KritzelImage } from "../objects/image.class";
import { KritzelSelectionTool } from "./selection-tool.class";
import { KritzelSerializable } from "../../interfaces/serializable.interface";
import { KritzelStore } from "../../stores/store";

export class KritzelImageTool implements KritzelTool, KritzelSerializable {
  __class__: string = this.constructor.name;

  name: string = 'image';
  icon: string = 'image';

  selectionTool: KritzelSelectionTool;

  fileInput: HTMLInputElement;

  store: KritzelStore;

  constructor(store: KritzelStore) {
    this.store = store;
    this.selectionTool = new KritzelSelectionTool(this.store);
    this.setupFileInput();
    this.openFilePicker();
  }

  handleMouseDown(_event: MouseEvent): void {
    // Do nothing
  }

  handleMouseMove(_event: MouseEvent): void {
    // Do nothing
  }

  handleMouseUp(_event: MouseEvent): void {
    // Do nothing
  }

  handleWheel(_event: WheelEvent): void {
    // Do nothing
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
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;

        img.onload = () => {
          const image = new KritzelImage(img);
          image.initializeZIndex();
          image.centerInViewport();

          const selectionGroup = new KritzelSelectionGroup();
          selectionGroup.addOrRemove(image);
          selectionGroup.selected = true;

          this.selectionTool.selectionState.selectionGroup = selectionGroup;
          kritzelEngineState.objects = [...kritzelEngineState.objects, image, selectionGroup];
          kritzelEngineState.activeTool = new KritzelSelectionTool(this.store);
        };
      };

      reader.readAsDataURL(file);
    }
  }

  revive(object: any): KritzelSerializable {
    Object.assign(this, object);
    return this;
  }

}
