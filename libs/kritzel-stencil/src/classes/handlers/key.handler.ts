import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelStore } from '../store.class';
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
      this._store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
      this._store.deselectAllObjects();
    }

    if (event.key === 'b' && event.ctrlKey) {
      this._store.setState('activeTool', KritzelToolRegistry.getTool('brush'));
      this._store.deselectAllObjects();
    }

    if (event.key === 'e' && event.ctrlKey) {
      this._store.setState('activeTool', KritzelToolRegistry.getTool('eraser'));

      this._store.deselectAllObjects();
    }

    if (event.key === 'i' && event.ctrlKey) {
      this._store.setState('activeTool', KritzelToolRegistry.getTool('image'));

      this._store.deselectAllObjects();
    }

    if (event.key === 'x' && event.ctrlKey) {
      this._store.setState('activeTool', KritzelToolRegistry.getTool('text'));

      this._store.deselectAllObjects();
    }

    if (event.key === 'c' && event.ctrlKey && this._store.state.selectionGroup) {
      this._store.copy();
      this._store.rerender();
    }

    if (event.key === 'v' && event.ctrlKey && this._store.state.copiedObjects) {
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

    if(event.key === 'a' && event.ctrlKey && this._store.state.activeText) {
      this._store.state.activeText.selectAll();
    }

    if(event.key === 'v' && event.ctrlKey && this._store.state.activeText) {
      this._store.state.activeText.insertFromClipboard();
    }
  }

  handleKeyUp(event: KeyboardEvent): void {
    if(this._store.state.isFocused === false) {
      return;
    }
    
    this._store.state.isCtrlKeyPressed = event.ctrlKey;
  }

 
}
