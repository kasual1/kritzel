import { UpmadeCore } from '../core/core.class';

/**
 * Abstract base class for all Upmade event handlers.
 * Provides a common foundation with access to the core instance for derived handler classes
 * such as key handlers, hover handlers, and context menu handlers.
 */
export class UpmadeBaseHandler {
  /**
   * Reference to the UpmadeCore instance.
   * Provides access to canvas state, store, and operations for derived handlers.
   */
  protected readonly _core: UpmadeCore;

  /**
   * Creates a new instance of the base handler.
   * @param core - The UpmadeCore instance that provides access to canvas state and operations.
   */
  constructor(core: UpmadeCore) {
    this._core = core;
    void this._core; // Avoid unused variable warning
  }
}