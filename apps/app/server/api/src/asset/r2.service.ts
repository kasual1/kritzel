import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class R2Service implements OnModuleDestroy {
  private readonly logger = new Logger(R2Service.name);
  private client: S3Client | null = null;
  private _bucket: string | null = null;
  private _publicBaseUrl: string | null = null;
  private initError: string | null = null;

  constructor(private readonly config: ConfigService) {
    // Defer validation: do NOT throw here, otherwise a missing R2 config
    // would crash the entire Nest app on startup and take down the API
    // (causing 502s for unrelated endpoints like /api/config and /api/auth/*).
    try {
      this.initClient();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.initError = message;
      this.logger.warn(
        `R2 asset storage is not configured: ${message}. ` +
          `Asset upload/delete endpoints will fail until R2_* env vars are set.`,
      );
    }
  }

  get bucket(): string {
    this.ensureReady();
    return this._bucket as string;
  }

  get publicBaseUrl(): string {
    this.ensureReady();
    return this._publicBaseUrl as string;
  }

  async putObject(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    this.ensureReady();
    await this.client!.send(
      new PutObjectCommand({
        Bucket: this._bucket as string,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async deleteObject(key: string): Promise<void> {
    this.ensureReady();
    await this.client!.send(
      new DeleteObjectCommand({
        Bucket: this._bucket as string,
        Key: key,
      }),
    );
  }

  publicUrl(key: string): string {
    this.ensureReady();
    return `${this._publicBaseUrl as string}/${key}`;
  }

  onModuleDestroy(): void {
    this.client?.destroy();
  }

  private initClient(): void {
    const accountId = this.requireEnv('R2_ACCOUNT_ID');
    const accessKeyId = this.requireEnv('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.requireEnv('R2_SECRET_ACCESS_KEY');
    this._bucket = this.requireEnv('R2_BUCKET');
    this._publicBaseUrl = this.requireEnv('R2_PUBLIC_BASE_URL').replace(
      /\/+$/,
      '',
    );

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
      // Cloudflare R2 rejects requests that include the additional
      // integrity checksum headers that recent versions of the AWS SDK
      // (>= 3.730) add by default, returning 401 Unauthorized because
      // those headers aren't part of the signed canonical request as R2
      // expects. Only send/validate checksums when the operation requires
      // it (e.g. multipart uploads).
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
    this.initError = null;
  }

  private ensureReady(): void {
    if (this.client && this._bucket && this._publicBaseUrl) {
      return;
    }
    // Try once more, in case env vars were set after construction.
    try {
      this.initClient();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.initError = message;
      throw new InternalServerErrorException(
        `Asset storage is not configured: ${message}`,
      );
    }
  }

  private requireEnv(name: string): string {
    const value = this.config.get<string>(name);
    if (!value) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
  }
}
