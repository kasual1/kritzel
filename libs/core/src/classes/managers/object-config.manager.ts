import { KritzelCore } from '../core/core.class';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelGroup } from '../objects/group.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelClassHelper } from '../../helpers/class.helper';
import { KritzelObjectConfig } from '../../interfaces/object-config.interface';

type KritzelObjectConfigKey = keyof KritzelObjectConfig;

/**
 * Resolves the engine's `objectConfig` prop for individual objects. The configuration is read
 * live from the engine, so late prop updates from framework wrappers always apply.
 */
export class KritzelObjectConfigManager {
  private readonly _core: KritzelCore;
  private readonly _warnedKeys = new Set<KritzelObjectConfigKey>();

  constructor(core: KritzelCore) {
    this._core = core;
  }

  /** The current object configuration, or `undefined` when none is set. */
  get config(): KritzelObjectConfig | undefined {
    return this._core.engine?.objectConfig ?? undefined;
  }

  /** Whether the configuration sets the given option. */
  isConfigured(key: KritzelObjectConfigKey): boolean {
    return this.config?.[key] !== undefined;
  }

  /** Clears the warnings already reported, so a new configuration reports its own problems. */
  resetWarnings(): void {
    this._warnedKeys.clear();
  }

  /** Whether the object gets a titlebar. Defaults to `false`. */
  hasTitlebar(object: KritzelBaseObject<any>): boolean {
    return this.evaluate('hasTitlebar', object, false);
  }

  /**
   * Whether the object can be rotated: its own flag and the configuration must both allow it.
   * Selection groups and groups require every object inside them to be rotatable.
   */
  isRotatable(object: KritzelBaseObject<any>): boolean {
    return this.allowsAll(object, unit => unit.isRotatable !== false && this.evaluate('isRotatable', unit, true));
  }

  /**
   * Whether the object can be resized: its own flag and the configuration must both allow it.
   * Selection groups and groups require every object inside them to be resizable.
   */
  isResizable(object: KritzelBaseObject<any>): boolean {
    return this.allowsAll(object, unit => unit.isResizable !== false && this.evaluate('isResizable', unit, true));
  }

  /** Applies a check to an object and everything a transform of it also transforms. */
  private allowsAll(object: KritzelBaseObject<any>, check: (object: KritzelBaseObject<any>) => boolean): boolean {
    if (KritzelClassHelper.isInstanceOf<KritzelSelectionGroup>(object, 'KritzelSelectionGroup')) {
      return object.objects.every(selected => this.allowsAll(selected, check));
    }

    if (!check(object)) {
      return false;
    }

    if (KritzelClassHelper.isInstanceOf<KritzelGroup>(object, 'KritzelGroup')) {
      return object.childIds.every(childId => {
        const child = this._core.store.objects.findById(childId);
        return !child || this.allowsAll(child, check);
      });
    }

    return true;
  }

  /** Resolves one option for one object. Only a synchronous boolean counts; failures are reported once. */
  private evaluate(key: KritzelObjectConfigKey, object: KritzelBaseObject<any>, fallback: boolean): boolean {
    const value = this.config?.[key];
    if (value === undefined) {
      return fallback;
    }
    if (typeof value !== 'function') {
      return value === true;
    }

    try {
      const result: unknown = value(object);
      if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
        this.warnOnce(key, 'it must be synchronous; promises are not supported.');
        return fallback;
      }
      return typeof result === 'boolean' ? result : fallback;
    } catch (error) {
      this.warnOnce(key, error);
      return fallback;
    }
  }

  private warnOnce(key: KritzelObjectConfigKey, error: unknown): void {
    if (this._warnedKeys.has(key)) {
      return;
    }
    this._warnedKeys.add(key);
    console.warn(`[KritzelObjectConfig] \`${key}\` failed; using its default for the affected objects:`, error);
  }
}
