import { KritzelSelectionGroup } from "../objects/selection-group.class";
import { KritzelImage } from "../objects/image.class";
import { KritzelSelectionTool } from "./selection-tool.class";
import { KritzelStore } from "../../stores/store";
import { KritzelBaseTool } from "./base-tool.class";
import { AddObjectsCommand } from "../commands/add-objects.command";

export class KritzelImageTool extends KritzelBaseTool {
  name: string = 'image';
  icon: string = 'image';

  fileInput: HTMLInputElement;

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
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;

        img.onload = () => {
          const image = new KritzelImage(this._store, img);
          image.zIndex = this._store.currentZIndex;
          image.centerInViewport();

          const selectionGroup = new KritzelSelectionGroup(this._store);
          selectionGroup.addOrRemove(image);
          selectionGroup.selected = true;

          this._store.executeCommand(new AddObjectsCommand(this._store, [image, selectionGroup]));
          this._store.state.activeTool = new KritzelSelectionTool(this._store);
        };
      };

      reader.readAsDataURL(file);
    }
  }

}
