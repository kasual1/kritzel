import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelBaseHandler } from './base.handler';
import { KritzelCore } from '../core/core.class';
import { KritzelShortcut } from '../../interfaces/shortcut.interface';

export class KritzelKeyHandler extends KritzelBaseHandler {

  private shortcuts: KritzelShortcut[] = [
    // General
    { key: 'Escape', condition: c => !!c.store.selectionGroup, action: c => c.clearSelection() },
    { key: 'Delete', condition: c => !!c.store.selectionGroup, action: c => c.delete() },
    { key: 'a', ctrl: true, action: c => c.selectAllObjectsInViewport() },
    { key: 'A', ctrl: true, shift: true, action: c => c.selectAllObjects() },

    // Undo/Redo
    { key: 'z', ctrl: true, action: c => c.undo() },
    { key: 'y', ctrl: true, action: c => c.redo() },

    // Tool selection (Ctrl+1-9)
    { key: '1', ctrl: true, action: () => this.switchToolByIndex(0) },
    { key: '2', ctrl: true, action: () => this.switchToolByIndex(1) },
    { key: '3', ctrl: true, action: () => this.switchToolByIndex(2) },
    { key: '4', ctrl: true, action: () => this.switchToolByIndex(3) },
    { key: '5', ctrl: true, action: () => this.switchToolByIndex(4) },
    { key: '6', ctrl: true, action: () => this.switchToolByIndex(5) },
    { key: '7', ctrl: true, action: () => this.switchToolByIndex(6) },
    { key: '8', ctrl: true, action: () => this.switchToolByIndex(7) },
    { key: '9', ctrl: true, action: () => this.switchToolByIndex(8) },

    // Clipboard
    {
      key: 'c',
      ctrl: true,
      condition: c => !!c.store.selectionGroup,
      action: c => {
        c.copy();
        c.rerender();
      },
    },
    { key: 'v', ctrl: true, condition: c => !!c.store.state.copiedObjects && !c.store.activeText, action: c => c.paste() },

    // Object layering
    { key: '+', ctrl: true, condition: c => !!c.store.selectionGroup, action: c => c.bringForward() },
    { key: '-', ctrl: true, condition: c => !!c.store.selectionGroup, action: c => c.sendBackward() },
    { key: '*', shift: true, condition: c => !!c.store.selectionGroup, action: c => c.bringToFront() },
    { key: '_', shift: true, condition: c => !!c.store.selectionGroup, action: c => c.sendToBack() },

    // Grouping
    { key: 'g', ctrl: true, condition: c => !!c.store.selectionGroup && c.store.selectionGroup.objects.length >= 2, action: c => c.group() },
    { key: 'G', ctrl: true, shift: true, condition: c => !!c.store.selectionGroup, action: c => c.ungroup() },
  ];

  constructor(core: KritzelCore) {
    super(core);
  }

  private switchToolByIndex(index: number) {
    const toolInstance = KritzelToolRegistry.getToolByIndex(index);
    if (toolInstance) {
      this._core.store.setState('activeTool', toolInstance);
      this._core.deselectAllObjects();
      toolInstance.onActivate();
    }
  }

  handleKeyDown(event: KeyboardEvent): void {
    this._core.store.state.isCtrlKeyPressed = event.ctrlKey;

    const shortcut = this.shortcuts.find(s => s.key === event.key && !!s.ctrl === event.ctrlKey && !!s.shift === event.shiftKey && (!s.condition || s.condition(this._core)));

    if (shortcut) {
      event.preventDefault();
      shortcut.action(this._core);
    }
  }

  handleKeyUp(event: KeyboardEvent): void {
    this._core.store.state.isCtrlKeyPressed = event.ctrlKey;
  }
}
