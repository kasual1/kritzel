import { KritzelStore } from '../store.class';
import { KritzelBrushTool } from '../tools/brush-tool.class';
import { KritzelEraserTool } from '../tools/eraser-tool.class';
import { KritzelImageTool } from '../tools/image-tool.class';
import { KritzelSelectionTool } from '../tools/selection-tool.class';
import { KritzelTextTool } from '../tools/text-tool.class';
import { KritzelBaseHandler } from './base.handler';

export class KritzelKeyHandler extends KritzelBaseHandler {
  constructor(store: KritzelStore) {
    super(store);
  }

  handleKeyDown(event: KeyboardEvent): void {
    if(this._store.state.isFocused === false) {
      return;
    }

    this._store.state.isCtrlKeyPressed = event.ctrlKey;

    if(this._store.state.isCtrlKeyPressed) {
      event.preventDefault();
    }

    if (event.key === 'Escape' && this._store.state.selectionGroup) {
      this._store.clearSelection();
    }

    if (event.key === 'Delete' && this._store.state.selectionGroup) {
      this._store.delete();
    }

    if (event.key === 'z' && event.ctrlKey) {
      this._store.history.undo();
    }

    if (event.key === 'y' && event.ctrlKey) {
      this._store.history.redo();
    }

    if (event.key === 's' && event.ctrlKey) {
      this._store.setState('activeTool', new KritzelSelectionTool(this._store));
      this._store.deselectAllObjects();
    }

    if (event.key === 'b' && event.ctrlKey) {
      this._store.setState('activeTool', new KritzelBrushTool(this._store));
      this._store.deselectAllObjects();
    }

    if (event.key === 'e' && event.ctrlKey) {
      this._store.setState('activeTool', new KritzelEraserTool(this._store));
      this._store.deselectAllObjects();
    }

    if (event.key === 'i' && event.ctrlKey) {
      this._store.setState('activeTool', new KritzelImageTool(this._store));
      this._store.deselectAllObjects();
    }

    if (event.key === 'x' && event.ctrlKey) {
      this._store.setState('activeTool', new KritzelTextTool(this._store));
      this._store.deselectAllObjects();
    }

    if (event.key === 'c' && event.ctrlKey && this._store.state.selectionGroup) {
      this._store.copy();
    }

    if (event.key === 'v' && event.ctrlKey && this._store.state.selectionGroup) {
      this._store.paste();
    }

    if (event.key === '+' && event.ctrlKey && this._store.state.selectionGroup) {
      this._store.moveUp();
    }

    if (event.key === '-' && event.ctrlKey && this._store.state.selectionGroup) {
      this._store.moveDown();
    }

    if (event.key === '*' && event.shiftKey && this._store.state.selectionGroup) {
      this._store.moveToTop();
    }

    if (event.key === '_' && event.shiftKey && this._store.state.selectionGroup) {
      this._store.moveToBottom();
    }
  }

  handleKeyUp(event: KeyboardEvent): void {
    if(this._store.state.isFocused === false) {
      return;
    }
    
    this._store.state.isCtrlKeyPressed = event.ctrlKey;
  }

 
}
