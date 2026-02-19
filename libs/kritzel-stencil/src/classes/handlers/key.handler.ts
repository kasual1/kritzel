import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelBaseHandler } from './base.handler';
import { KritzelCore } from '../core/core.class';
import { KritzelShortcut } from '../../interfaces/shortcut.interface';

const NUDGE_AMOUNT = 10;

export class KritzelKeyHandler extends KritzelBaseHandler {

  private shortcuts: KritzelShortcut[] = [
    // General
    { key: 'Escape', label: 'Clear Selection', category: 'General', condition: c => !!c.store.selectionGroup, action: c => c.clearSelection() },
    { key: 'Delete', label: 'Delete Selected', category: 'General', condition: c => !!c.store.selectionGroup, action: c => c.delete() },
    { key: 'a', ctrl: true, label: 'Select All in Viewport', category: 'General', action: c => c.selectAllObjectsInViewport() },
    { key: 'A', ctrl: true, shift: true, label: 'Select All Objects', category: 'General', action: c => c.selectAllObjects() },

    // Undo/Redo
    { key: 'z', ctrl: true, label: 'Undo', category: 'Undo/Redo', action: c => c.undo() },
    { key: 'y', ctrl: true, label: 'Redo', category: 'Undo/Redo', action: c => c.redo() },

    // Tool selection (Ctrl+1-9)
    { key: '1', ctrl: true, label: 'Tool 1', category: 'Tool Selection', action: () => this.switchToolByIndex(0) },
    { key: '2', ctrl: true, label: 'Tool 2', category: 'Tool Selection', action: () => this.switchToolByIndex(1) },
    { key: '3', ctrl: true, label: 'Tool 3', category: 'Tool Selection', action: () => this.switchToolByIndex(2) },
    { key: '4', ctrl: true, label: 'Tool 4', category: 'Tool Selection', action: () => this.switchToolByIndex(3) },
    { key: '5', ctrl: true, label: 'Tool 5', category: 'Tool Selection', action: () => this.switchToolByIndex(4) },
    { key: '6', ctrl: true, label: 'Tool 6', category: 'Tool Selection', action: () => this.switchToolByIndex(5) },
    { key: '7', ctrl: true, label: 'Tool 7', category: 'Tool Selection', action: () => this.switchToolByIndex(6) },
    { key: '8', ctrl: true, label: 'Tool 8', category: 'Tool Selection', action: () => this.switchToolByIndex(7) },
    { key: '9', ctrl: true, label: 'Tool 9', category: 'Tool Selection', action: () => this.switchToolByIndex(8) },

    // Clipboard
    {
      key: 'c',
      ctrl: true,
      label: 'Copy',
      category: 'Clipboard',
      condition: c => !!c.store.selectionGroup,
      action: c => {
        c.copy();
        c.rerender();
      },
    },
    { key: 'v', ctrl: true, label: 'Paste', category: 'Clipboard', condition: c => !!c.store.state.copiedObjects && !c.store.activeText, action: c => c.paste() },

    // Object layering
    { key: '+', ctrl: true, label: 'Bring Forward', category: 'Object Layering', condition: c => !!c.store.selectionGroup, action: c => c.bringForward() },
    { key: '-', ctrl: true, label: 'Send Backward', category: 'Object Layering', condition: c => !!c.store.selectionGroup, action: c => c.sendBackward() },
    { key: '*', shift: true, label: 'Bring to Front', category: 'Object Layering', condition: c => !!c.store.selectionGroup, action: c => c.bringToFront() },
    { key: '_', shift: true, label: 'Send to Back', category: 'Object Layering', condition: c => !!c.store.selectionGroup, action: c => c.sendToBack() },

    // Grouping
    { key: 'g', ctrl: true, label: 'Group', category: 'Grouping', condition: c => !!c.store.selectionGroup && c.store.selectionGroup.objects.length >= 2, action: c => c.group() },
    { key: 'G', ctrl: true, shift: true, label: 'Ungroup', category: 'Grouping', condition: c => !!c.store.selectionGroup, action: c => c.ungroup() },

    // Movement
    { key: 'ArrowUp', label: 'Move Object Up', category: 'Movement', condition: c => !!c.store.selectionGroup, action: c => { c.store.selectionGroup!.move(0, 0, 0, NUDGE_AMOUNT); c.rerender(); } },
    { key: 'ArrowDown', label: 'Move Object Down', category: 'Movement', condition: c => !!c.store.selectionGroup, action: c => { c.store.selectionGroup!.move(0, NUDGE_AMOUNT, 0, 0); c.rerender(); } },
    { key: 'ArrowLeft', label: 'Move Object Left', category: 'Movement', condition: c => !!c.store.selectionGroup, action: c => { c.store.selectionGroup!.move(0, 0, NUDGE_AMOUNT, 0); c.rerender(); } },
    { key: 'ArrowRight', label: 'Move Object Right', category: 'Movement', condition: c => !!c.store.selectionGroup, action: c => { c.store.selectionGroup!.move(NUDGE_AMOUNT, 0, 0, 0); c.rerender(); } },
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

  getDisplayableShortcuts(): Omit<KritzelShortcut, 'action' | 'condition'>[] {
    return this.shortcuts.map(({ key, ctrl, shift, label, category }) => ({
      key,
      ctrl,
      shift,
      label,
      category,
    }));
  }
}
