import { KritzelCore } from '../core/core.class';
import { KritzelAssetLoadState } from '../../interfaces/asset.interface';
import { KritzelBaseObject } from './base-object.class';

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

  maxWidth: number = 1200;
  maxHeight: number = 1200;

  maxCompressionSize: number = 1200;

  override isDebugInfoVisible: boolean = true;

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
   * The counter is transient (not persisted to Yjs) and resets every
   * time a fresh `KritzelImage` instance is constructed, so a full page
   * reload always grants a fresh budget.
   */
  maxLoadAttempts: number = 3;

  /**
   * Number of resolution attempts that have been issued so far for the
   * current page load. Not serialized into the Yjs document.
   */
  loadAttempts: number = 0;

  /**
   * Creates a new KritzelImage instance.
   * @param config - Optional partial configuration object to initialize image properties
   *                 including assetId, src, position (x, y), translation, and scale.
   */
  constructor(config?: Partial<KritzelImage>) {
    super();
    this.assetId = config?.assetId || '';
    this.mimeType = config?.mimeType || '';
    this.src = config?.src || '';
    this.x = config?.x || 0;
    this.y = config?.y || 0;
    this.translateX = config?.translateX || 0;
    this.translateY = config?.translateY || 0;
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
  static override create(core: KritzelCore): KritzelImage {
    const object = new KritzelImage();

    object._core = core;
    object.id = object.generateId();
    object.workspaceId = core.store.state.activeWorkspace!.id;
    object.userId = core.user?.id;
    object.x = 0;
    object.y = 0;
    object.translateX = 0;
    object.translateY = 0;
    object.scale = object._core.store.state.scale;
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
    }
  }

  /**
   * Triggers (idempotent) resolution of the referenced asset. Updates
   * `resolvedSrc` and `loadState` as the resolution progresses and
   * schedules a re-render when the URL is available.
   *
   * On failure, retries automatically up to {@link maxLoadAttempts}
   * times per page load with a short exponential backoff. Once the
   * budget is exhausted, the image is marked permanently `'error'` for
   * the remainder of the page load to avoid hammering an unavailable
   * backend; a full reload (which constructs a fresh instance) grants
   * a new budget.
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
    this.loadAttempts += 1;
    const attempt = this.loadAttempts;
    this._core.assetResolver
      .resolve(this.assetId)
      .then(url => {
        this.resolvedSrc = url;
        this.loadState = 'ready';
        this._core?.rerender();
      })
      .catch(err => {
        const attemptsExhausted = this.loadAttempts >= this.maxLoadAttempts;
        console.warn(
          `[KritzelImage] Failed to resolve asset ${this.assetId} ` +
            `(attempt ${attempt}/${this.maxLoadAttempts}):`,
          err,
        );
        if (attemptsExhausted) {
          this.loadState = 'error';
          this._core?.rerender();
          return;
        }
        // Schedule a retry with a small exponential backoff. Reset to
        // 'idle' so the next call (or scheduled tick) is allowed to
        // proceed past the early-return guard.
        this.loadState = 'idle';
        const backoffMs = Math.min(2000, 250 * Math.pow(2, attempt - 1));
        setTimeout(() => {
          if (this.loadState === 'idle') {
            this.ensureResolved();
          }
        }, backoffMs);
      });
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

    return { scaledWidth, scaledHeight };  }
}
