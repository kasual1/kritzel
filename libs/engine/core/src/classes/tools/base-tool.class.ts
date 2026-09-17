import { KritzelSerializable } from '../../interfaces/serializable.interface';
import { KritzelToolType } from '../../interfaces/tool-type.interface';
import { KritzelTool } from '../../interfaces/tool.interface';
import { KritzelCore } from '../core/core.class';

/**
 * Abstract base class for all drawing tools in Kritzel.
 * Provides common functionality and defines the interface that all tools must implement.
 * Tools handle user interactions (pointer events, wheel events) and can be serialized/deserialized.
 */
export class KritzelBaseTool implements KritzelTool, KritzelSerializable {
  /** Class name identifier used for serialization/deserialization */
  __class__: string = this.constructor.name;

  /** Identifies the tool type for config resolution (survives minification and dual-package bundling) */
  toolType: KritzelToolType = 'base';

  /** Human-readable name of the tool */
  name: string = 'base-tool';

  /** Reference to the Kritzel core instance for accessing store, viewport, and other core functionality */
  protected readonly _core: KritzelCore;

  /**
   * Creates a new instance of KritzelBaseTool.
   * @param core - The KritzelCore instance that provides access to application state and functionality
   */
  constructor(core: KritzelCore) {
    this._core = core;
    void this._core; // Avoid unused variable warning
  }

  /**
   * Called when the tool becomes the active tool.
   * Override in subclasses to perform initialization when the tool is selected.
   */
  onActivate(): void {
    // default implementation
  }

  /**
   * Called when the tool is deactivated (another tool becomes active).
   * Override in subclasses to perform cleanup when the tool is deselected.
   */
  onDeactivate(): void {
    // default implementation
  }

  /**
   * Handles pointer down events (mouse click, touch start, pen down).
   * Override in subclasses to implement tool-specific behavior when the user starts an interaction.
   * @param _event - The PointerEvent containing information about the pointer (position, type, buttons, etc.)
   */
  handlePointerDown(_event: PointerEvent): void {
    // default implementation
  }

  /**
   * Handles pointer move events (mouse move, touch move, pen move).
   * Override in subclasses to implement tool-specific behavior during dragging or hovering.
   * @param _event - The PointerEvent containing information about the pointer (position, type, buttons, etc.)
   */
  handlePointerMove(_event: PointerEvent): void {
    // default implementation
  }

  /**
   * Handles pointer up events (mouse release, touch end, pen up).
   * Override in subclasses to implement tool-specific behavior when the user ends an interaction.
   * @param _event - The PointerEvent containing information about the pointer (position, type, buttons, etc.)
   */
  handlePointerUp(_event: PointerEvent): void {
    // default implementation
  }

  /**
   * Handles mouse wheel events for zooming or scrolling.
   * Override in subclasses to implement tool-specific wheel behavior.
   * @param _event - The WheelEvent containing scroll delta and modifier key information
   */
  handleWheel(_event: WheelEvent): void {
    // default implementation
  }

  /**
   * Serializes the tool to a plain object for persistence or transfer.
   * @returns An object containing the tool's class name and name property
   */
  serialize() {
    return {
      __class__: this.__class__,
      name: this.name,
    };
  }

  /**
   * Deserializes a plain object into this tool instance.
   * @param object - The serialized tool data to restore
   * @returns This tool instance with restored properties
   */
  deserialize(object: any): KritzelSerializable {
    Object.assign(this, object);
    return this;
  }
}
