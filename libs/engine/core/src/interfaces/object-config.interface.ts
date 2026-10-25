import { KritzelBaseObject } from '../classes/objects/base-object.class';

/**
 * A fixed value for every object, or a function deciding per object.
 *
 * Functions are called synchronously while the engine renders or handles input, so they must be
 * cheap and must not return a promise. A function that throws resolves to the option's default.
 * Compare `object.__class__` (e.g. `'KritzelGroup'`) rather than using `instanceof`, which fails
 * when the app bundles more than one copy of the engine.
 */
export type KritzelObjectConfigValue = boolean | ((object: KritzelBaseObject) => boolean);

/**
 * Configures how objects behave, in one place for all objects.
 *
 * Restrictions combine with the persisted flags of each object: an object can only be rotated
 * when both its own `isRotatable` flag and `isRotatable` here allow it.
 */
export interface KritzelObjectConfig {
  /**
   * Whether an object gets a titlebar. Defaults to `false`; titlebars also require the
   * `objectTitlebar` prop. Called for every visible top-level object on every render.
   * Objects inside a group never get their own titlebar; the group is passed in instead.
   */
  hasTitlebar?: KritzelObjectConfigValue;
  /**
   * Whether an object can be rotated. Defaults to `true`. A group can only be rotated when
   * the group and all objects inside it can be rotated.
   */
  isRotatable?: KritzelObjectConfigValue;
  /**
   * Whether an object can be resized. Defaults to `true`. A group can only be resized when
   * the group and all objects inside it can be resized.
   */
  isResizable?: KritzelObjectConfigValue;
}
