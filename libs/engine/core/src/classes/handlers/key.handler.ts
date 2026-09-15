import { KritzelBaseHandler } from './base.handler';
import { KritzelCore } from '../core/core.class';
import { KritzelShortcut } from '../../interfaces/shortcut.interface';

/** The amount of pixels to move an object when using arrow key nudging. */
const NUDGE_AMOUNT = 10;

/**
 * Handles keyboard events and manages keyboard shortcuts for the Kritzel canvas.
 * Provides functionality for tool switching, object manipulation,
 * undo/redo, and navigation via keyboard input.
 */
export class KritzelKeyHandler extends KritzelBaseHandler {
  /**
   * Array of registered keyboard shortcuts with their associated actions.
   * Each shortcut defines the key combination, display label, category, optional condition, and action to execute.
   */
  private shortcuts: KritzelShortcut[] = [
    // General
    {
      key: 'Escape',
      label: 'Clear Selection',
      category: 'General',
      condition: c => !!c.store.activeText || !!c.store.activeShape || !!c.store.selectionGroup,
      action: c => {
        if (c.store.activeText) {
          c.store.activeText.handleEscape();
          return;
        }

        if (c.store.activeShape) {
          c.store.activeShape.handleEscape();
          return;
        }

        c.clearSelection();
      },
    },
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

    // Object layering
    { key: '+', ctrl: true, label: 'Bring Forward', category: 'Object Layering', condition: c => !!c.store.selectionGroup, action: c => c.bringForward() },
    { key: '-', ctrl: true, label: 'Send Backward', category: 'Object Layering', condition: c => !!c.store.selectionGroup, action: c => c.sendBackward() },
    { key: '*', shift: true, label: 'Bring to Front', category: 'Object Layering', condition: c => !!c.store.selectionGroup, action: c => c.bringToFront() },
    { key: '_', shift: true, label: 'Send to Back', category: 'Object Layering', condition: c => !!c.store.selectionGroup, action: c => c.sendToBack() },

    // Grouping
    { key: 'g', ctrl: true, label: 'Group', category: 'Grouping', condition: c => !!c.store.selectionGroup && c.store.selectionGroup.objects.length >= 2, action: c => c.group() },
    { key: 'G', ctrl: true, shift: true, label: 'Ungroup', category: 'Grouping', condition: c => !!c.store.selectionGroup, action: c => c.ungroup() },

    // Movement
    {
      key: 'ArrowUp',
      label: 'Move Object Up',
      category: 'Movement',
      condition: c => !!c.store.selectionGroup,
      action: c => {
        c.store.selectionGroup!.move(0, 0, 0, NUDGE_AMOUNT);
        c.rerender();
      },
    },
    {
      key: 'ArrowDown',
      label: 'Move Object Down',
      category: 'Movement',
      condition: c => !!c.store.selectionGroup,
      action: c => {
        c.store.selectionGroup!.move(0, NUDGE_AMOUNT, 0, 0);
        c.rerender();
      },
    },
    {
      key: 'ArrowLeft',
      label: 'Move Object Left',
      category: 'Movement',
      condition: c => !!c.store.selectionGroup,
      action: c => {
        c.store.selectionGroup!.move(0, 0, NUDGE_AMOUNT, 0);
        c.rerender();
      },
    },
    {
      key: 'ArrowRight',
      label: 'Move Object Right',
      category: 'Movement',
      condition: c => !!c.store.selectionGroup,
      action: c => {
        c.store.selectionGroup!.move(NUDGE_AMOUNT, 0, 0, 0);
        c.rerender();
      },
    },
  ];

  /**
   * Creates a new instance of the key handler.
   * @param core - The KritzelCore instance that provides access to the canvas state and operations.
   */
  constructor(core: KritzelCore) {
    super(core);
  }

  /**
   * Switches the active tool to the tool at the specified index in the tool registry.
   * Deselects all objects and activates the new tool if found.
   * @param index - The zero-based index of the tool to activate from the tool registry.
   */
  private switchToolByIndex(index: number): void {
    const toolInstance = this._core.toolRegistry.getToolByIndex(index);
    if (toolInstance) {
      this._core.store.setState('activeTool', toolInstance);
      this._core.deselectAllObjects();
      toolInstance.onActivate();
    }
  }

  /**
   * Handles keydown events and executes matching keyboard shortcuts.
   * Updates the Ctrl key state in the store and finds matching shortcuts based on
   * the pressed key combination and any defined conditions.
   * @param event - The keyboard event triggered by the user pressing a key.
   */
  handleKeyDown(event: KeyboardEvent): void {
    this._core.store.state.isCtrlKeyPressed = event.ctrlKey;

    // While a text or shape's text editor is being edited, let ProseMirror /
    // the browser handle keys natively (Ctrl+A, Ctrl+C, arrows, etc.) instead
    // of running global canvas shortcuts. Escape is the one exception — it
    // still runs through the shortcut system so it can collapse the text
    // selection (handled inside the shortcut's action).
    if ((this._core.store.activeText || this._core.store.activeShape || this._core.store.activeInteractiveDynamicObject) && event.key !== 'Escape') {
      return;
    }

    const shortcut = this.shortcuts.find(s => s.key === event.key && !!s.ctrl === event.ctrlKey && !!s.shift === event.shiftKey && (!s.condition || s.condition(this._core)));

    if (shortcut) {
      event.preventDefault();
      shortcut.action(this._core);
    }
  }

  /**
   * Handles keyup events and updates the Ctrl key state.
   * @param event - The keyboard event triggered by the user releasing a key.
   */
  handleKeyUp(event: KeyboardEvent): void {
    this._core.store.state.isCtrlKeyPressed = event.ctrlKey;
  }

  /**
   * Returns a list of all registered shortcuts suitable for display in a UI help dialog.
   * Excludes the action and condition properties to provide only the display-relevant information.
   * @returns An array of shortcut objects containing key, modifiers, label, and category.
   */
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
