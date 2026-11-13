import { UpdrawCore } from '../core/core.class';

/**
 * Abstract base class for all Updraw event handlers.
 * Provides a common foundation with access to the core instance for derived handler classes
 * such as key handlers, hover handlers, and context menu handlers.
 */
export class UpdrawBaseHandler {
  /**
   * Reference to the UpdrawCore instance.
   * Provides access to canvas state, store, and operations for derived handlers.
   */
  protected readonly _core: UpdrawCore;

  /**
   * Creates a new instance of the base handler.
   * @param core - The UpdrawCore instance that provides access to canvas state and operations.
   */
  constructor(core: UpdrawCore) {
    this._core = core;
    void this._core; // Avoid unused variable warning
  }
}