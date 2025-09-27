import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelBaseHandler } from './base.handler';
import { KritzelCore } from '../core/core.class';

export class KritzelKeyHandler extends KritzelBaseHandler {
  constructor(core: KritzelCore) {
    super(core);
  }

  handleKeyDown(event: KeyboardEvent): void {

    this._core.store.setState('isCtrlKeyPressed', event.ctrlKey);

    if(this._core.store.state.isCtrlKeyPressed) {
      event.preventDefault();
    }

    if (event.key === 'Escape' && this._core.store.state.selectionGroup) {
      this._core.clearSelection();
    }

    if (event.key === 'Delete' && this._core.store.state.selectionGroup) {
      this._core.delete();
    }

    if (event.key === 'z' && event.ctrlKey) {
      this._core.history.undo();
    }

    if (event.key === 'y' && event.ctrlKey) {
      this._core.history.redo();
    }

    if (event.key === 's' && event.ctrlKey) {
      this._core.store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
      this._core.deselectAllObjects();
    }

    if (event.key === 'b' && event.ctrlKey) {
      this._core.store.setState('activeTool', KritzelToolRegistry.getTool('brush'));
      this._core.deselectAllObjects();
    }

    if (event.key === 'e' && event.ctrlKey) {
      this._core.store.setState('activeTool', KritzelToolRegistry.getTool('eraser'));
      this._core.deselectAllObjects();
    }

    if (event.key === 'i' && event.ctrlKey) {
      this._core.store.setState('activeTool', KritzelToolRegistry.getTool('image'));
      this._core.deselectAllObjects();
    }

    if (event.key === 'x' && event.ctrlKey) {
      this._core.store.setState('activeTool', KritzelToolRegistry.getTool('text'));
      this._core.deselectAllObjects();
    }

    if (event.key === 'c' && event.ctrlKey && this._core.store.state.selectionGroup) {
      this._core.copy();
      this._core.rerender();
    }

    if (event.key === 'v' && event.ctrlKey && this._core.store.state.copiedObjects) {
      this._core.paste();
    }

    if (event.key === '+' && event.ctrlKey && this._core.store.state.selectionGroup) {
      this._core.bringForward();
    }

    if (event.key === '-' && event.ctrlKey && this._core.store.state.selectionGroup) {
      this._core.sendBackward();
    }

    if (event.key === '*' && event.shiftKey && this._core.store.state.selectionGroup) {
      this._core.bringToFront();
    }

    if (event.key === '_' && event.shiftKey && this._core.store.state.selectionGroup) {
      this._core.sendToBack();
    }

    if(event.key === 'a' && event.ctrlKey && this._core.store.state.activeText) {
      this._core.store.state.activeText.selectAll();
    }

    if(event.key === 'v' && event.ctrlKey && this._core.store.state.activeText) {
      this._core.store.state.activeText.insertFromClipboard();
    }
  }

  handleKeyUp(event: KeyboardEvent): void {
    this._core.store.setState('isCtrlKeyPressed', event.ctrlKey);
  }
 
}
