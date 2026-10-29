import { KritzelCore } from '../core/core.class';

/**
 * Abstract base class for all Kritzel event handlers.
 * Provides a common foundation with access to the core instance for derived handler classes
 * such as key handlers, hover handlers, and context menu handlers.
 */
export class KritzelBaseHandler {
  /**
   * Reference to the KritzelCore instance.
   * Provides access to canvas state, store, and operations for derived handlers.
   */
  protected readonly _core: KritzelCore;

  /**
   * Creates a new instance of the base handler.
   * @param core - The KritzelCore instance that provides access to canvas state and operations.
   */
  constructor(core: KritzelCore) {
    this._core = core;
    void this._core; // Avoid unused variable warning
  }
}