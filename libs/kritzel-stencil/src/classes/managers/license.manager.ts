import { KritzelCore } from '../core/core.class';

/** Minimum delay (ms) between periodic license re-validations. */
const MIN_REVALIDATION_DELAY_MS = 30_000;

/** Maximum delay (ms) between periodic license re-validations. */
const MAX_REVALIDATION_DELAY_MS = 60_000;

/**
 * Manages license validation state for the Kritzel editor.
 *
 * The manager is owned per {@link KritzelCore} instance (like the theme and
 * localization managers) so that multiple editors on the same page validate
 * independently.
 *
 * Responsibilities:
 * - Validate a provided license key and cache the resulting `isLicensed` flag.
 * - Periodically re-validate on a randomized interval so the check is harder to
 *   stub out programmatically than a fixed `setInterval`.
 * - Drive a rerender whenever the licensed state changes so the watermark is
 *   re-asserted on the reactive render path.
 *
 * Validation currently uses a placeholder check. A future phase will replace it
 * with offline signed-token (Ed25519 / WebCrypto) verification including domain
 * and expiry claims.
 *
 * Failure semantics (fail open):
 * - No key provided -> unlicensed (free tier, watermark shown). This is the
 *   normal default, not an error.
 * - Key present but cleanly invalid (e.g. malformed) -> unlicensed.
 * - Key present but validation throws an *unexpected* internal error -> fail
 *   open and treat as licensed so a library defect never breaks a paying
 *   customer's app.
 */
export class KritzelLicenseManager {
  private readonly _core: KritzelCore;

  /** The most recently provided license key, re-checked on each periodic tick. */
  private _licenseKey?: string;

  /** Cached result of the latest validation. */
  private _isLicensed: boolean = false;

  /** Handle for the self-rescheduling re-validation timer. */
  private _timer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Creates a new KritzelLicenseManager instance.
   * @param core - The KritzelCore instance this manager belongs to
   */
  constructor(core: KritzelCore) {
    this._core = core;
  }

  /**
   * Whether the editor is currently considered licensed (watermark hidden).
   */
  get isLicensed(): boolean {
    return this._isLicensed;
  }

  /**
   * Validates the given license key and caches the result. Triggers a rerender
   * only when the licensed state actually changes.
   *
   * @param key - The license key to validate, or undefined to clear the license
   * @returns The resulting licensed state
   */
  validate(key?: string): boolean {
    this._licenseKey = key;

    let nextLicensed: boolean;
    try {
      nextLicensed = this.checkKey(key);
    } catch {
      // Fail open: an unexpected internal validation error must never break a
      // paying customer's app, so treat the editor as licensed.
      nextLicensed = true;
    }

    if (nextLicensed !== this._isLicensed) {
      this._isLicensed = nextLicensed;
      this._core.rerender();
    }

    return this._isLicensed;
  }

  /**
   * Starts periodic re-validation on a randomized interval between
   * {@link MIN_REVALIDATION_DELAY_MS} and {@link MAX_REVALIDATION_DELAY_MS}.
   *
   * Uses a self-rescheduling `setTimeout` (a fresh random delay each cycle)
   * rather than a fixed `setInterval`, making the check fractionally harder to
   * predict and no-op programmatically. Any existing timer is cleared first so
   * the method is idempotent.
   */
  startPeriodicValidation(): void {
    this.stopPeriodicValidation();
    this.scheduleNextValidation();
  }

  /**
   * Stops periodic re-validation and releases the timer.
   */
  stopPeriodicValidation(): void {
    if (this._timer !== null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  /**
   * Cleanup hook called when the editor is torn down.
   */
  destroy(): void {
    this.stopPeriodicValidation();
  }

  /**
   * Schedules the next re-validation tick at a randomized delay.
   */
  private scheduleNextValidation(): void {
    const delay = this.getRandomRevalidationDelay();
    this._timer = setTimeout(() => {
      this.validate(this._licenseKey);
      this.scheduleNextValidation();
    }, delay);
  }

  /**
   * Returns a random delay within the configured re-validation window.
   */
  private getRandomRevalidationDelay(): number {
    const span = MAX_REVALIDATION_DELAY_MS - MIN_REVALIDATION_DELAY_MS;
    return MIN_REVALIDATION_DELAY_MS + Math.floor(Math.random() * (span + 1));
  }

  /**
   * Placeholder license-key check.
   *
   * A future phase replaces this with offline signed-token verification. For
   * now any non-empty string is treated as a valid license; an absent or empty
   * key is unlicensed.
   *
   * @param key - The license key to check
   * @returns Whether the key represents a valid license
   */
  private checkKey(key?: string): boolean {
    return typeof key === 'string' && key.trim().length > 0;
  }
}
