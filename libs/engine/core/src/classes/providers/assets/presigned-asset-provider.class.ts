import { KritzelAsset } from '../../../interfaces/asset.interface';
import { IAssetStorageProvider, KritzelAssetPutMetadata } from '../../../interfaces/asset-provider.interface';

/**
 * Pre-signed upload descriptor returned by the host application.
 * `method` defaults to `PUT` which matches the common S3 pattern, but
 * `POST` is also supported for S3 browser-based uploads with form fields.
 */
export interface KritzelPresignedUpload {
  /** Stable asset id. Host may honor metadata.id or assign a new one. */
  id: string;
  /** Fully-qualified URL bytes should be sent to. */
  url: string;
  /** HTTP method. Defaults to `PUT`. */
  method?: 'PUT' | 'POST';
  /** Extra form fields (S3 browser-based uploads). Only used for POST. */
  fields?: Record<string, string>;
  /** Extra request headers (e.g. `Content-Type`, `x-amz-*`). */
  headers?: Record<string, string>;
}

/**
 * Options for {@link PresignedAssetProvider}.
 *
 * This provider delegates upload URL signing and download URL signing to
 * the host application. The library never sees storage credentials.
 */
export interface PresignedAssetProviderOptions {
  /**
   * Returns a pre-signed upload descriptor for the given metadata. The
   * host application typically calls its backend to obtain a signed URL.
   */
  getUploadDescriptor: (metadata: KritzelAssetPutMetadata) => Promise<KritzelPresignedUpload>;

  /**
   * Returns a URL from which the given asset can be loaded (often a
   * short-lived signed GET URL).
   */
  getDownloadUrl: (id: string) => Promise<string>;

  /**
   * Optional delete hook. Called with the asset id; host signs and
   * dispatches a DELETE to the underlying storage. Omit to disable.
   */
  deleteAsset?: (id: string) => Promise<void>;

  /**
   * Quiet mode - suppress console output (optional, defaults to false)
   */
  quiet?: boolean;
}

/**
 * Remote asset storage provider for pre-signed URL uploads (S3, GCS, ...).
 *
 * All auth and URL signing is performed by the host application via the
 * callbacks in {@link PresignedAssetProviderOptions}. The library simply
 * PUTs/POSTs bytes to the provided URL.
 */
export class PresignedAssetProvider implements IAssetStorageProvider {
  readonly type = 'remote';
  readonly name = 'PresignedAssetProvider';

  private _options: PresignedAssetProviderOptions;

  constructor(options: PresignedAssetProviderOptions) {
    this._options = options;
  }

  static with(options: PresignedAssetProviderOptions): { create: () => IAssetStorageProvider } {
    return { create: () => new PresignedAssetProvider(options) };
  }

  async init(): Promise<void> {
    if (!this._options.quiet) {
      console.info('PresignedAssetProvider initialized');
    }
  }

  destroy(): void {
    // No-op.
  }

  canResolve(_id: string): boolean {
    return true;
  }

  async put(blob: Blob, metadata: KritzelAssetPutMetadata): Promise<KritzelAsset> {
    const descriptor = await this._options.getUploadDescriptor(metadata);
    const method = descriptor.method ?? 'PUT';
    const headers = { ...(descriptor.headers ?? {}) };
    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = metadata.mimeType;
    }

    let body: BodyInit;
    if (method === 'POST' && descriptor.fields) {
      const form = new FormData();
      for (const [key, value] of Object.entries(descriptor.fields)) {
        form.append(key, value);
      }
      form.append('file', blob);
      body = form;
      // Browser sets multipart boundary; avoid forcing content-type.
      delete headers['Content-Type'];
      delete headers['content-type'];
    } else {
      body = blob;
    }

    const res = await fetch(descriptor.url, { method, headers, body });
    if (!res.ok) {
      throw new Error(`[PresignedAssetProvider] Upload failed: ${res.status} ${res.statusText}`);
    }

    return {
      id: descriptor.id,
      kind: metadata.kind ?? 'file',
      mimeType: metadata.mimeType,
      size: blob.size,
      createdAt: Date.now(),
      width: metadata.width,
      height: metadata.height,
      durationMs: metadata.durationMs,
      originalFilename: metadata.originalFilename,
    };
  }

  async resolve(id: string): Promise<string> {
    return this._options.getDownloadUrl(id);
  }

  async fetch(id: string): Promise<Blob> {
    const url = await this._options.getDownloadUrl(id);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`[PresignedAssetProvider] Failed to fetch asset ${id}: ${res.status} ${res.statusText}`);
    }
    return res.blob();
  }

  async delete(id: string): Promise<void> {
    if (!this._options.deleteAsset) return;
    await this._options.deleteAsset(id);
    if (!this._options.quiet) {
      console.info(`PresignedAssetProvider: deleted asset ${id}`);
    }
  }
}
