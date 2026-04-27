import { KritzelAsset } from '../../../interfaces/asset.interface';
import { IAssetStorageProvider, KritzelAssetPutMetadata } from '../../../interfaces/asset-provider.interface';

/**
 * Response shape expected from the upload endpoint. Fields are optional
 * so that different server designs can be accommodated; if `id` is not
 * returned, the pre-generated id passed via metadata is used.
 */
export interface HttpAssetUploadResponse {
  id?: string;
  url?: string;
}

/**
 * Options for {@link HttpAssetProvider}.
 *
 * The host application owns authentication. Any credentials or tokens
 * should be injected via the `headers` callback so the library never
 * holds long-lived secrets.
 */
export interface HttpAssetProviderOptions {
  /**
   * Returns the URL the asset should be POSTed to.
   * Called once per upload; may be async to support signed endpoints.
   */
  uploadUrl: (metadata: KritzelAssetPutMetadata) => string | Promise<string>;

  /**
   * Returns the URL from which a given asset id can be loaded.
   * This URL is used directly as the `<img src>`.
   */
  resolveUrl: (id: string) => string | Promise<string>;

  /**
   * Optional custom headers (auth tokens, tenant ids, ...) attached to
   * every request. Called per request so tokens can be refreshed.
   */
  headers?: () => Record<string, string> | Promise<Record<string, string>>;

  /**
   * Quiet mode - suppress console output (optional, defaults to false)
   */
  quiet?: boolean;

  /**
   * Upload transport. Defaults to a single `POST` carrying a
   * `multipart/form-data` body with the file and metadata as JSON.
   * Override when the backend expects a different shape.
   */
  upload?: (
    url: string,
    blob: Blob,
    metadata: KritzelAssetPutMetadata,
    headers: Record<string, string>,
  ) => Promise<HttpAssetUploadResponse>;

  /**
   * Optional override for DELETE requests. Omit to disable deletion.
   */
  deleteUrl?: (id: string) => string | Promise<string>;
}

/**
 * Remote asset storage provider backed by a plain HTTP endpoint.
 *
 * The host application is responsible for exposing a REST-ish backend
 * that accepts a multipart upload and serves the stored asset at a
 * stable URL. Authentication is injected via `headers`.
 */
export class HttpAssetProvider implements IAssetStorageProvider {
  readonly type = 'remote';
  readonly name = 'HttpAssetProvider';

  private _options: HttpAssetProviderOptions;

  constructor(options: HttpAssetProviderOptions) {
    this._options = options;
  }

  /**
   * Factory helper enabling use as `HttpAssetProvider.with({ ... })` inside
   * a `KritzelAssetStorageConfig.providers` array.
   */
  static with(options: HttpAssetProviderOptions): { create: () => IAssetStorageProvider } {
    return { create: () => new HttpAssetProvider(options) };
  }

  async init(): Promise<void> {
    if (!this._options.quiet) {
      console.info('HttpAssetProvider initialized');
    }
  }

  destroy(): void {
    // No-op; no resources to release.
  }

  canResolve(_id: string): boolean {
    // Remote providers don't know without a round-trip; assume yes.
    return true;
  }

  async put(blob: Blob, metadata: KritzelAssetPutMetadata): Promise<KritzelAsset> {
    const id = metadata.id ?? this.generateUuid();
    const fullMetadata: KritzelAssetPutMetadata = { ...metadata, id };
    const headers = (await this._options.headers?.()) ?? {};
    const url = await this._options.uploadUrl(fullMetadata);

    const uploader = this._options.upload ?? this.defaultUpload;
    const response = await uploader(url, blob, fullMetadata, headers);

    return {
      id: response.id ?? id,
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
    return this._options.resolveUrl(id);
  }

  async fetch(id: string): Promise<Blob> {
    const url = await this._options.resolveUrl(id);
    const headers = (await this._options.headers?.()) ?? {};
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`[HttpAssetProvider] Failed to fetch asset ${id}: ${res.status} ${res.statusText}`);
    }
    return res.blob();
  }

  async delete(id: string): Promise<void> {
    if (!this._options.deleteUrl) return;
    const url = await this._options.deleteUrl(id);
    const headers = (await this._options.headers?.()) ?? {};
    const res = await fetch(url, { method: 'DELETE', headers });
    if (!res.ok) {
      throw new Error(`[HttpAssetProvider] Failed to delete asset ${id}: ${res.status} ${res.statusText}`);
    }
    if (!this._options.quiet) {
      console.info(`HttpAssetProvider: deleted asset ${id}`);
    }
  }

  private defaultUpload = async (
    url: string,
    blob: Blob,
    metadata: KritzelAssetPutMetadata,
    headers: Record<string, string>,
  ): Promise<HttpAssetUploadResponse> => {
    const form = new FormData();
    form.append('metadata', JSON.stringify(metadata));
    form.append(
      'file',
      blob,
      metadata.originalFilename || `${metadata.id}.${this.extensionFromMime(metadata.mimeType)}`,
    );

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: form,
    });

    if (!res.ok) {
      throw new Error(`[HttpAssetProvider] Upload failed: ${res.status} ${res.statusText}`);
    }

    // Try to parse a JSON response; tolerate empty/plain-text bodies.
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return (await res.json()) as HttpAssetUploadResponse;
    }
    return {};
  };

  private extensionFromMime(mime: string): string {
    const slash = mime.indexOf('/');
    return slash >= 0 ? mime.slice(slash + 1) : 'bin';
  }

  private generateUuid(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
}
