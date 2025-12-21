import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelBaseHandler } from './base.handler';
import { KritzelCore } from '../core/core.class';
import { KritzelShortcut } from '../../interfaces/shortcut.interface';

export class KritzelKeyHandler extends KritzelBaseHandler {

  private shortcuts: KritzelShortcut[] = [
    // General
    { key: 'Escape', condition: c => !!c.store.selectionGroup, action: c => c.clearSelection() },
    { key: 'Delete', condition: c => !!c.store.selectionGroup, action: c => c.delete() },

    // Undo/Redo
    { key: 'z', ctrl: true, action: c => c.undo() },
    { key: 'y', ctrl: true, action: c => c.redo() },

    // Tool selection
    { key: 's', ctrl: true, action: () => this.switchTool('selection') },
    { key: 'b', ctrl: true, action: () => this.switchTool('brush') },
    { key: 'e', ctrl: true, action: () => this.switchTool('eraser') },
    { key: 'i', ctrl: true, action: () => this.switchTool('image') },
    { key: 'x', ctrl: true, action: () => this.switchTool('text') },

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

    // Text editing
    // { key: 'a', ctrl: true, condition: c => !!c.store.activeText, action: c => c.store.activeText.selectAll() },
    // { key: 'v', ctrl: true, condition: c => !!c.store.activeText, action: c => c.store.activeText.insertFromClipboard() },

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

  private switchTool(tool: string) {
    const toolInstance = KritzelToolRegistry.getTool(tool);
    this._core.store.setState('activeTool', toolInstance);
    this._core.deselectAllObjects();
    toolInstance.onActivate();
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
