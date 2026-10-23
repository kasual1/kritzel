import { KritzelCore } from '../core/core.class';
import { KritzelObjectCommonConfig } from '../../interfaces/object.interface';
import { KritzelAssetLoadState } from '../../interfaces/asset.interface';
import { AssetNotFoundError } from '../providers/assets/asset-resolver.class';
import { KritzelBaseObject } from './base-object.class';
import { KritzelMathHelper } from '../../helpers/math.helper';
import { KritzelObjectExportContext, KritzelObjectExportFormat } from '../../interfaces/object-export.interface';

/**
 * Configuration options for creating a KritzelImage instance.
 */
export interface KritzelImageConfig extends KritzelObjectCommonConfig {
  assetId?: string;
  mimeType?: string;
  src?: string;
  x?: number;
  y?: number;
  translateX?: number;
  translateY?: number;
  rotation?: number;
  scale?: number;
  width?: number;
  height?: number;
  maxWidth?: number;
  maxHeight?: number;
  maxLoadAttempts?: number;
}

/**
 * Represents an image object on the canvas.
 *
 * Image bytes are NOT stored on this object or inside the Yjs document.
 * Instead, the image is identified by a stable `assetId`; the actual
 * bytes live in the asset storage layer (see `KritzelAssetResolver`).
 * This keeps the CRDT small and lets images be served from pluggable
 * storage (IndexedDB, HTTP, pre-signed S3, ...).
 *
 * Legacy images persisted before the asset layer existed may still carry
 * a `src` data URL; the renderer and migration path treat `src` as a
 * read-only fallback that is upgraded to an `assetId` on first load.
 */
export class KritzelImage extends KritzelBaseObject<HTMLImageElement> {
  override __class__: string = 'KritzelImage';

  /**
   * Stable asset identifier (uuid) persisted in the Yjs document.
   * Used by the asset resolver to locate the image bytes across
   * devices and storage backends.
   */
  assetId: string = '';

  /**
   * MIME type of the referenced asset (e.g. `image/png`). Persisted in
   * the Yjs document alongside `assetId` so the renderer can hint
   * browsers and the exporter can produce correct data URLs.
   */
  mimeType: string = '';

  /**
   * Legacy inline source (typically a `data:` URL). Preserved only for
   * backward compatibility with documents that were created before the
   * asset storage layer existed. New images should use `assetId`.
   *
   * @deprecated Use `assetId` with an asset storage provider instead.
   */
  src: string = '';

  maxWidth: number = 300;
  maxHeight: number = 300;

  maxCompressionSize: number = 1200;

  // --- Transient (not persisted to Yjs) ---

  /**
   * URL resolved from the asset storage layer (e.g. a `blob:` or https URL).
   * Not serialized into the Yjs document.
   */
  resolvedSrc?: string;

  /**
   * Current load state for the referenced asset.
   * Not serialized into the Yjs document.
   */
  loadState: KritzelAssetLoadState = 'idle';

  /**
   * Maximum number of resolution attempts per page load before the
   * image is considered permanently failed. Defaults to 3.
   *
   * Only attempts that fail with a definitive "asset not found"
   * (i.e. {@link AssetNotFoundError}) consume this budget. Transient
   * failures (network blips, remote temporarily unreachable) do not
   * count against the budget; they are bounded by
   * {@link maxTransientRetryDurationMs} instead.
   *
   * The counter is transient (not persisted to Yjs) and resets every
   * time a fresh `KritzelImage` instance is constructed, so a full page
   * reload always grants a fresh budget.
   */
  maxLoadAttempts: number = 3;

  /**
   * Number of resolution attempts that have failed with a definitive
   * "asset not found" so far for the current page load. Only updates
   * for {@link AssetNotFoundError} rejections; transient failures do
   * not increment this counter. Not serialized into the Yjs document.
   */
  loadAttempts: number = 0;

  /**
   * Maximum wall-clock duration (in milliseconds) the image will keep
   * retrying transient resolution failures before giving up and
   * surfacing the error placeholder. Defaults to 30 seconds.
   *
   * This bound exists so that a permanently-broken backend eventually
   * surfaces UX feedback even when failures look "transient" (and
   * therefore do not consume {@link maxLoadAttempts}).
   */
  maxTransientRetryDurationMs: number = 30_000;

  /**
   * Wall-clock timestamp (ms since epoch) of the first transient
   * failure in the current retry chain. `null` when no transient
   * retries are in flight. Reset on success and on definitive miss.
   * Not serialized into the Yjs document.
   */
  transientRetryStartedAt: number | null = null;

  /**
   * Creates a new KritzelImage instance.
   * @param config - Optional configuration object to initialize image properties
   *                 including assetId, src, position (x, y), translation, and scale.
   */
  constructor(config?: KritzelImageConfig) {
    super();
    this.applyCommonConfig(config);
    this.assetId = config?.assetId || '';
    this.mimeType = config?.mimeType || '';
    this.src = config?.src || '';
    this.x = config?.x || 0;
    this.y = config?.y || 0;
    this.translateX = config?.translateX || 0;
    this.translateY = config?.translateY || 0;
    this.rotation = KritzelMathHelper.degreesToRadians(config?.rotation ?? 0);
    this.scale = config?.scale || 1;
    this.width = config?.width || 0;
    this.height = config?.height || 0;
    this.maxWidth = config?.maxWidth ?? 300;
    this.maxHeight = config?.maxHeight ?? 300;
    this.maxLoadAttempts = config?.maxLoadAttempts ?? 3;
  }

  /**
   * Factory method to create a new KritzelImage instance with core integration.
   * Initializes the image with default values and links it to the core store.
   * @param core - The KritzelCore instance providing access to store and state management.
   * @returns A new KritzelImage instance configured with the core context.
   */
  static override create(core: KritzelCore, config?: Partial<KritzelImage>): KritzelImage {
    const object = new KritzelImage(config);

    object._core = core;
    object.id = object.generateId();
    object.workspaceId = core.store.state.activeWorkspace!.id;
    object.userId = core.user?.id;
    object.x = config?.x ?? 0;
    object.y = config?.y ?? 0;
    object.translateX = config?.translateX ?? 0;
    object.translateY = config?.translateY ?? 0;
    object.scale = config?.scale ?? object._core.store.state.scale;
    object.rotation = KritzelMathHelper.degreesToRadians(config?.rotation ?? 0);
    object.zIndex = core.store.currentZIndex;

    return object;
  }

  /**
   * Resizes the image while maintaining aspect ratio based on the new height.
   * Updates the image's position and dimensions, then syncs changes to y.js
   * for collaborative editing support.
   * @param x - The new x translation coordinate.
   * @param y - The new y translation coordinate.
   * @param width - The new width (used for validation, not directly applied).
   * @param height - The new height used to calculate the scale factor.
   */
  override resize(x: number, y: number, width: number, height: number): void {
    if (width <= 1 || height <= 1) {
      return;
    }

    const scaleFactor = height / this.height;

    this.width = this.width * scaleFactor;
    this.height = this.height * scaleFactor;
    this.translateX = x;
    this.translateY = y;

    // Update to sync changes to y.js and propagate to other tabs
    this._core.store.objects.update(this);
  }

  /**
   * Serializes the image, excluding transient rendering state so the
   * Yjs document never persists blob URLs or load lifecycle flags.
   */
  override serialize() {
    const plain = super.serialize();
    // Strip transient, non-persistent rendering state.
    delete plain.resolvedSrc;
    delete plain.loadState;
    delete plain.loadAttempts;
    delete plain.transientRetryStartedAt;
    return plain;
  }

  /**
   * Carries transient asset-loading state (resolved URL, load lifecycle,
   * retry counters) over from the previous local instance when a remote
   * Yjs update produces a freshly-revived replacement. Without this,
   * frequent remote updates (e.g. another user dragging the image)
   * would reset `loadState` to `'idle'` on every tick and cause the
   * skeleton to flicker between renders.
   */
  override adoptTransientStateFrom(previous: KritzelBaseObject<any>): void {
    if (!(previous instanceof KritzelImage)) return;
    // Only carry over the resolved URL when the asset reference itself
    // hasn't changed; otherwise the new asset must be re-resolved.
    if (previous.assetId === this.assetId) {
      this.resolvedSrc = previous.resolvedSrc;
      this.loadState = previous.loadState;
      this.loadAttempts = previous.loadAttempts;
      this.transientRetryStartedAt = previous.transientRetryStartedAt;
    }
  }

  /**
   * Triggers (idempotent) resolution of the referenced asset. Updates
   * `resolvedSrc` and `loadState` as the resolution progresses and
   * schedules a re-render when the URL is available.
   *
   * Failure handling distinguishes two cases:
   *  - Definitive miss ({@link AssetNotFoundError}): consumes one slot
   *    of the {@link maxLoadAttempts} budget. Once exhausted, the
   *    image is marked permanently `'error'` for the remainder of the
   *    page load to avoid hammering an unavailable backend; a full
   *    reload (which constructs a fresh instance) grants a new budget.
   *  - Transient failure (network blip, resolver init in flight, ...):
   *    does NOT consume the attempt budget. Retries continue with the
   *    same exponential backoff up to
   *    {@link maxTransientRetryDurationMs} of wall-clock time, after
   *    which the image is marked `'error'`.
   */
  ensureResolved(): void {
    if (this.loadState === 'loading' || this.loadState === 'ready') return;
    if (this.loadState === 'error') return;
    if (!this.assetId) return;
    if (!this._core?.assetResolver) return;
    if (this.loadAttempts >= this.maxLoadAttempts) {
      this.loadState = 'error';
      return;
    }

    this.loadState = 'loading';
    const attemptIndex = this.loadAttempts; // backoff base only; bumped on real misses
    this._core.assetResolver
      .resolve(this.assetId)
      .then(url => {
        this.resolvedSrc = url;
        this.loadState = 'ready';
        // Reset transient retry tracking on success.
        this.transientRetryStartedAt = null;
        this._core?.rerender();
      })
      .catch(err => {
        const isDefinitiveMiss = err instanceof AssetNotFoundError;
        if (isDefinitiveMiss) {
          this.loadAttempts += 1;
          // Definitive miss resets the transient deadline so a later
          // transient retry chain (post-recovery) starts fresh.
          this.transientRetryStartedAt = null;
          const attemptsExhausted = this.loadAttempts >= this.maxLoadAttempts;
          console.warn(
            `[KritzelImage] Asset ${this.assetId} not found ` +
              `(attempt ${this.loadAttempts}/${this.maxLoadAttempts}):`,
            err,
          );
          if (attemptsExhausted) {
            this.loadState = 'error';
            this._core?.rerender();
            return;
          }
          this.scheduleRetry(this.loadAttempts);
          return;
        }

        // Transient failure: do not burn the per-page-load budget, but
        // bound retries by a wall-clock deadline so a permanently broken
        // backend still surfaces feedback eventually.
        const now = Date.now();
        if (this.transientRetryStartedAt === null) {
          this.transientRetryStartedAt = now;
        }
        const elapsed = now - this.transientRetryStartedAt;
        const deadlineExceeded = elapsed >= this.maxTransientRetryDurationMs;
        console.warn(
          `[KritzelImage] Transient resolve failure for asset ${this.assetId} ` +
            `(elapsed ${Math.round(elapsed / 1000)}s/${Math.round(this.maxTransientRetryDurationMs / 1000)}s):`,
          err,
        );
        if (deadlineExceeded) {
          this.loadState = 'error';
          this._core?.rerender();
          return;
        }
        // Use the existing attempt count as the backoff base. Transient
        // retries do not increment loadAttempts, so the backoff remains
        // bounded at the first step (250ms) until a real miss happens.
        this.scheduleRetry(attemptIndex + 1);
      });
  }

  /**
   * Schedules a retry of {@link ensureResolved} with a small exponential
   * backoff. The backoff base is the current attempt index so successive
   * definitive misses ramp up gradually.
   */
  private scheduleRetry(attemptBase: number): void {
    // Reset to 'idle' so the next call (or scheduled tick) is allowed to
    // proceed past the early-return guard in ensureResolved().
    this.loadState = 'idle';
    const backoffMs = Math.min(2000, 250 * Math.pow(2, Math.max(0, attemptBase - 1)));
    setTimeout(() => {
      if (this.loadState === 'idle') {
        this.ensureResolved();
      }
    }, backoffMs);
  }

  /**
   * One-shot migration for legacy images that were persisted with an
   * inline `src` data URL. Uploads the bytes to the asset resolver and
   * swaps the image to use the resulting `assetId`, clearing `src` so
   * the Yjs document no longer carries the raw payload.
   */
  private migrateLegacyDataUrlIfNeeded(): void {
    if (this.assetId) return;
    if (!this.src || !this.src.startsWith('data:')) return;
    if (!this._core?.assetResolver) return;

    const legacySrc = this.src;
    // Render the legacy data URL directly until migration completes.
    this.resolvedSrc = legacySrc;
    this.loadState = 'ready';

    this._core.assetResolver
      .putDataUrl(legacySrc, { kind: 'image' })
      .then(asset => {
        this.assetId = asset.id;
        this.mimeType = asset.mimeType;
        this.src = '';
        // Persist the migrated reference back into Yjs.
        this._core?.store.objects?.update(this);
      })
      .catch(err => {
        console.warn('[KritzelImage] Failed to migrate legacy data URL to asset storage:', err);
      });
  }

  /**
   * Kicks off asset resolution (or legacy data-URL migration) without
   * requiring the `<img>` element to be mounted. Safe to call multiple
   * times; both underlying paths are idempotent.
   *
   * Useful for the renderer's loading-skeleton path, where the actual
   * `<img>` is not in the DOM yet but the asset bytes still need to
   * start loading.
   */
  ensureLoaded(): void {
    if (this.assetId && !this.resolvedSrc) {
      this.ensureResolved();
    } else if (!this.assetId && this.src?.startsWith('data:')) {
      this.migrateLegacyDataUrlIfNeeded();
    }
  }

  /**
   * Prepares image objects for insertion into the canvas while preserving
   * the standard object-first flow (`new KritzelImage(...); addObject(image)`).
   *
   * Behavior:
   * - If `assetId` is already set, no-op.
   * - If `src` is set (URL or data URL), uploads bytes through the asset
   *   resolver, fills `assetId`/`mimeType`, computes dimensions when needed,
   *   and seeds `resolvedSrc` for immediate rendering.
   */
  async prepareForInsert(): Promise<void> {
    if (this.assetId || !this.src) {
      return;
    }
    if (!this._core?.assetResolver) {
      return;
    }

    const source = this.src;
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to load image source: ${source} (HTTP ${response.status})`);
    }

    const blob = await response.blob();
    const mimeType = blob.type || 'image/png';
    const { naturalWidth, naturalHeight } = await this.measureImageBlob(blob);

    const asset = await this._core.assetResolver.put(blob, {
      mimeType,
      kind: 'image',
      width: naturalWidth,
      height: naturalHeight,
    });

    this.assetId = asset.id;
    this.mimeType = asset.mimeType;

    if (this.width <= 0 || this.height <= 0) {
      const { scaledWidth, scaledHeight } = this.calculateScaledDimensions({
        width: naturalWidth,
        height: naturalHeight,
      } as HTMLImageElement);
      this.width = scaledWidth;
      this.height = scaledHeight;
    }

    this.resolvedSrc = await this._core.assetResolver.resolve(asset.id);
    this.loadState = 'ready';
    this.src = '';
  }

  /**
   * Measures intrinsic image dimensions from a Blob.
   */
  private async measureImageBlob(blob: Blob): Promise<{ naturalWidth: number; naturalHeight: number }> {
    const objectUrl = URL.createObjectURL(blob);
    try {
      return await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
        img.onerror = err => reject(err);
        img.src = objectUrl;
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  /**
   * Overrides base mount to kick off asset resolution the first time
   * the image is attached to the DOM. Legacy images persisted with an
   * inline `src` data URL are opportunistically migrated to the asset
   * storage layer on first mount.
   */
  override mount(element: HTMLImageElement): void {
    super.mount(element);
    this.ensureLoaded();
  }

  /**
   * Creates a KritzelImage from a URL, handling image loading and dimension calculation.
   * Loads the image, calculates scaled dimensions respecting maxWidth/maxHeight constraints,
   * and returns a fully configured KritzelImage instance.
   *
   * Intended for legacy / data-URL code paths only. New callers should
   * upload through the asset resolver and construct the image from the
   * resulting asset descriptor.
   * @param src - The image URL or data URI to load.
   * @param config - Optional partial configuration to pass to the KritzelImage constructor.
   * @returns A promise resolving to a fully configured KritzelImage with correct dimensions.
   */
  static fromUrl(src: string, config?: Partial<KritzelImage>): Promise<KritzelImage> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const image = new KritzelImage({ ...config, src });
        const { scaledWidth, scaledHeight } = image.calculateScaledDimensions(img);
        image.width = scaledWidth;
        image.height = scaledHeight;
        resolve(image);
      };
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  }

  /**
   * Creates a fully initialized KritzelImage from a Blob.
   * Uploads the blob via the asset resolver and sets up dimensions/asset references.
   *
   * @param core - The KritzelCore instance providing the asset resolver and state.
   * @param blob - The image Blob (e.g. from clipboard or file picker).
   * @param config - Optional configuration to merge into the new image.
   * @returns A promise resolving to a fully loaded KritzelImage object.
   */
  static async fromBlob(core: KritzelCore, blob: Blob, config?: Partial<KritzelImage>): Promise<KritzelImage> {
    const objectUrl = URL.createObjectURL(blob);
    try {
      const dimensions = await new Promise<{ naturalWidth: number; naturalHeight: number }>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
        img.onerror = err => reject(err);
        img.src = objectUrl;
      });

      const mimeType = blob.type || 'image/png';
      const asset = await core.assetResolver.put(blob, {
        mimeType,
        kind: 'image',
        width: dimensions.naturalWidth,
        height: dimensions.naturalHeight,
      });

      const image = KritzelImage.create(core, config);
      image.assetId = asset.id;
      image.mimeType = asset.mimeType;

      const { scaledWidth, scaledHeight } = image.calculateScaledDimensions({
        width: dimensions.naturalWidth,
        height: dimensions.naturalHeight,
      } as HTMLImageElement);
      
      image.width = scaledWidth;
      image.height = scaledHeight;
      image.resolvedSrc = await core.assetResolver.resolve(asset.id);
      image.loadState = 'ready';
      
      return image;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  /**
   * Calculates scaled dimensions for an image while respecting maxWidth and maxHeight constraints.
   * Maintains the original aspect ratio by using the smaller of the two scale ratios.
   * @param img - The HTMLImageElement to calculate dimensions for.
   * @returns An object containing the scaled width and height values.
   */
  calculateScaledDimensions(img: HTMLImageElement): { scaledWidth: number; scaledHeight: number } {
    let scaledWidth = img.width;
    let scaledHeight = img.height;

    if (img.width > this.maxWidth || img.height > this.maxHeight) {
      const widthRatio = this.maxWidth / img.width;
      const heightRatio = this.maxHeight / img.height;
      const scaleRatio = Math.min(widthRatio, heightRatio);

      scaledWidth = img.width * scaleRatio;
      scaledHeight = img.height * scaleRatio;
    }

    return { scaledWidth, scaledHeight };
  }

  getSupportedExportFormats(): KritzelObjectExportFormat[] {
    return ['png'];
  }

  async exportAs(format: KritzelObjectExportFormat, context: KritzelObjectExportContext): Promise<string | null> {
    if (format !== 'png') {
      return null;
    }

    return context.getObjectAsPngDataUrl(this);
  }
}
