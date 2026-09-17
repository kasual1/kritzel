import { KritzelCore } from '../core/core.class';
import { KRITZEL_LICENSE_PUBLIC_KEY, KRITZEL_LICENSE_TOKEN_PREFIX } from '../../constants/license.constants';

/** Minimum delay (ms) between periodic license re-validations. */
const MIN_REVALIDATION_DELAY_MS = 30_000;

/** Maximum delay (ms) between periodic license re-validations. */
const MAX_REVALIDATION_DELAY_MS = 60_000;

/** Decoded license claims. `exp` and `allowedDomains` are enforced at runtime. */
interface LicenseClaims {
  /** Customer id / name. */
  sub?: string;
  /** Plan tier (basic | pro | enterprise). */
  plan?: string;
  /** Issued-at, epoch seconds. */
  iat?: number;
  /** Expiry, epoch seconds. Absent means the license is perpetual. */
  exp?: number;
  /** Exact hostnames where this license is valid (strict mode, required). */
  allowedDomains?: string[];
}

/** Result of the synchronous structural pre-check of a token. */
type PreCheck =
  | { status: 'rejected' }
  | { status: 'pass'; payloadSegment: string; signatureSegment: string; claims: LicenseClaims };

/**
 * Manages license validation state for the Kritzel editor.
 *
 * The manager is owned per {@link KritzelCore} instance (like the theme and
 * localization managers) so that multiple editors on the same page validate
 * independently.
 *
 * A license key is an offline Ed25519 signed token of the form
 * `KRTZL1.<base64url(payload)>.<base64url(signature)>`. The library verifies it
 * against the embedded {@link KRITZEL_LICENSE_PUBLIC_KEY}; only the owner can
 * mint tokens, with the matching private key (see scripts/license/).
 *
 * Responsibilities:
 * - Cheaply reject absent/malformed/expired keys synchronously so the watermark
 *   never flashes off for an obviously invalid key.
 * - Verify the signature asynchronously via WebCrypto, then drive a rerender if
 *   the licensed state changed so the watermark is re-asserted on the reactive
 *   render path.
 * - Periodically re-check on a randomized interval so the check is harder to
 *   stub out programmatically than a fixed `setInterval`. Re-checks reuse the
 *   cached verified token and only re-evaluate expiry, so crypto is not re-run
 *   on an unchanged key every tick.
 *
 * Failure semantics (fail open):
 * - No key provided -> unlicensed (free tier, watermark shown). The normal
 *   default, not an error.
 * - Key present but cleanly invalid (malformed, bad signature, expired) ->
 *   unlicensed.
 * - Key present but validation throws an *unexpected* internal error, or the
 *   runtime lacks Ed25519 support in WebCrypto -> fail open and treat as
 *   licensed so a library defect or old browser never breaks a paying
 *   customer's app.
 */
export class KritzelLicenseManager {
  private readonly _core: KritzelCore;

  /** The most recently provided license key, re-checked on each periodic tick. */
  private _licenseKey?: string;

  /** Cached result of the latest validation. */
  private _isLicensed: boolean = false;

  /**
   * The token whose signature most recently verified successfully. Lets the
   * periodic re-check skip crypto and only re-evaluate expiry while the key is
   * unchanged.
   */
  private _verifiedToken?: string;

  /**
   * Monotonic id incremented on every {@link validate} call. An in-flight async
   * verification only commits its result if its id still matches, so a stale
   * verification resolving after a newer call can never clobber fresh state.
   */
  private _validationId: number = 0;

  /** Cached imported public key, lazily created on first signature check. */
  private _publicKeyPromise?: Promise<CryptoKey>;

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
   * Validates the given license key.
   *
   * Runs a synchronous structural pre-check first: an absent, malformed, or
   * already-expired key resolves the state immediately (no async work). A
   * structurally valid key then has its signature verified asynchronously; the
   * licensed state is committed (and a rerender triggered) only if it changed.
   *
   * The return value reflects the state known *synchronously* at call time. The
   * authoritative result for a structurally valid key arrives shortly after via
   * the async verification and the reactive rerender.
   *
   * @param key - The license key to validate, or undefined to clear the license
   * @returns The licensed state known synchronously at call time
   */
  validate(key?: string): boolean {
    this._licenseKey = key;
    const validationId = ++this._validationId;

    let pre: PreCheck;
    try {
      pre = this.preCheck(key);
    } catch {
      // Fail open: an unexpected internal error in the cheap pre-check must
      // never break a paying customer's app.
      this.commit(true, validationId);
      return this._isLicensed;
    }

    if (pre.status === 'rejected') {
      this._verifiedToken = undefined;
      this.commit(false, validationId);
      return this._isLicensed;
    }

    // Structurally valid and unexpired. If we already verified this exact token,
    // the signature is still good, so license it without re-running crypto.
    if (this._verifiedToken === key) {
      this.commit(true, validationId);
      return this._isLicensed;
    }

    // Otherwise verify the signature asynchronously. Leave the current state
    // untouched until it settles so a forged token cannot even briefly hide the
    // watermark (default state is unlicensed), and a valid renewal does not flap.
    this.verifySignature(pre.payloadSegment, pre.signatureSegment)
      .then(valid => {
        if (validationId !== this._validationId) {
          return; // A newer validate() superseded this one.
        }
        if (valid) {
          this._verifiedToken = key;
          this.commit(true, validationId);
        } else {
          this._verifiedToken = undefined;
          this.commit(false, validationId);
        }
      })
      .catch(() => {
        if (validationId !== this._validationId) {
          return;
        }
        // Fail open on unexpected crypto errors / missing Ed25519 support.
        this.commit(true, validationId);
      });

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
   * Commits a new licensed state, triggering a rerender only when it changed.
   * The {@link validationId} guard is checked by async callers; synchronous
   * callers pass the current id.
   */
  private commit(nextLicensed: boolean, validationId: number): void {
    if (validationId !== this._validationId) {
      return;
    }
    if (nextLicensed !== this._isLicensed) {
      this._isLicensed = nextLicensed;
      this._core.rerender();
    }
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
   * Synchronous structural pre-check of a license key: verifies the format
   * prefix, three-part structure, JSON payload, and (if present) that the token
   * has not expired. Does not verify the signature.
   *
   * @returns `rejected` for absent/malformed/expired keys, or `pass` with the
   *   parsed segments and claims for a structurally valid, unexpired token.
   */
  private preCheck(key?: string): PreCheck {
    if (key === undefined || key === null) {
      return { status: 'rejected' };
    }
    const token = key.trim();
    if (token.length === 0 || !token.startsWith(KRITZEL_LICENSE_TOKEN_PREFIX)) {
      return { status: 'rejected' };
    }

    const body = token.slice(KRITZEL_LICENSE_TOKEN_PREFIX.length);
    const parts = body.split('.');
    if (parts.length !== 2 || parts[0].length === 0 || parts[1].length === 0) {
      return { status: 'rejected' };
    }
    const [payloadSegment, signatureSegment] = parts;

    let claims: LicenseClaims;
    try {
      claims = JSON.parse(this.base64UrlToString(payloadSegment));
    } catch {
      return { status: 'rejected' };
    }
    if (claims === null || typeof claims !== 'object') {
      return { status: 'rejected' };
    }

    if (typeof claims.exp === 'number' && claims.exp * 1000 <= Date.now()) {
      return { status: 'rejected' }; // Cleanly expired.
    }

    const allowedDomains = this.normalizeAllowedDomains(claims.allowedDomains);
    if (allowedDomains === null || allowedDomains.length === 0) {
      return { status: 'rejected' };
    }

    const currentHostname = this.getCurrentHostname();
    if (!currentHostname || !allowedDomains.includes(currentHostname)) {
      return { status: 'rejected' };
    }

    return { status: 'pass', payloadSegment, signatureSegment, claims };
  }

  /** Returns the normalized current hostname, or null when unavailable/invalid. */
  private getCurrentHostname(): string | null {
    const hostname = globalThis.location?.hostname;
    if (typeof hostname !== 'string') {
      return null;
    }
    return this.normalizeDomain(hostname);
  }

  /** Normalizes and validates the allowed domains claim. */
  private normalizeAllowedDomains(domains: unknown): string[] | null {
    if (!Array.isArray(domains)) {
      return null;
    }

    const normalized = new Set<string>();
    for (const entry of domains) {
      if (typeof entry !== 'string') {
        return null;
      }
      const domain = this.normalizeDomain(entry);
      if (!domain) {
        return null;
      }
      normalized.add(domain);
    }

    return Array.from(normalized);
  }

  /** Normalizes a domain and rejects malformed hostnames. */
  private normalizeDomain(value: string): string | null {
    const trimmed = value.trim().toLowerCase();
    if (trimmed.length === 0) {
      return null;
    }

    const withoutTrailingDot = trimmed.endsWith('.') ? trimmed.slice(0, -1) : trimmed;
    if (withoutTrailingDot.length === 0) {
      return null;
    }

    try {
      const parsed = new URL(`https://${withoutTrailingDot}`);
      const normalizedHostname = parsed.hostname.toLowerCase();
      if (normalizedHostname !== withoutTrailingDot) {
        return null;
      }
      return normalizedHostname;
    } catch {
      return null;
    }
  }

  /**
   * Verifies the Ed25519 signature of the token against the embedded public
   * key. Resolves true/false for a definitive valid/invalid signature.
   *
   * Rejects (rather than resolving false) on unexpected crypto failures or when
   * the runtime lacks Ed25519 support, so the caller fails open.
   */
  private async verifySignature(payloadSegment: string, signatureSegment: string): Promise<boolean> {
    const publicKey = await this.getPublicKey();
    const data = this.utf8Bytes(payloadSegment);
    const signature = this.base64UrlToBytes(signatureSegment);
    return crypto.subtle.verify('Ed25519', publicKey, signature, data);
  }

  /**
   * Imports and caches the embedded Ed25519 public key for signature checks.
   */
  private getPublicKey(): Promise<CryptoKey> {
    if (!this._publicKeyPromise) {
      const raw = this.base64UrlToBytes(KRITZEL_LICENSE_PUBLIC_KEY);
      this._publicKeyPromise = Promise.resolve().then(() => crypto.subtle.importKey('raw', raw, { name: 'Ed25519' }, false, ['verify']));
      // If import fails (e.g. no Ed25519 support), drop the cache so a later
      // tick can retry, and let the rejection propagate to fail open.
      this._publicKeyPromise.catch(() => {
        this._publicKeyPromise = undefined;
      });
    }
    return this._publicKeyPromise;
  }

  /** Decodes a base64url string to its UTF-8 text. */
  private base64UrlToString(value: string): string {
    return new TextDecoder().decode(this.base64UrlToBytes(value));
  }

  /** Decodes a base64url string to raw bytes. */
  private base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const binary = atob(padded);
    const bytes = new Uint8Array(new ArrayBuffer(binary.length));
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /** Encodes a string to its UTF-8 bytes. */
  private utf8Bytes(value: string): Uint8Array<ArrayBuffer> {
    const encoded = new TextEncoder().encode(value);
    const bytes = new Uint8Array(new ArrayBuffer(encoded.length));
    bytes.set(encoded);
    return bytes;
  }
}
