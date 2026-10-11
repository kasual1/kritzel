import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import 'multer';
import { Asset } from './asset.entity';
import { R2Service } from './r2.service';

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export interface AssetMetadataInput {
  id?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  filename?: string;
}

export interface AssetUploadResult {
  id: string;
  url: string;
}

@Injectable()
export class AssetService {
  private readonly maxSize: number;

  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    private readonly r2: R2Service,
    private readonly config: ConfigService,
  ) {
    const configured = Number(this.config.get<string>('ASSET_MAX_SIZE_BYTES'));
    this.maxSize =
      Number.isFinite(configured) && configured > 0
        ? configured
        : DEFAULT_MAX_SIZE;
  }

  get maxSizeBytes(): number {
    return this.maxSize;
  }

  parseMetadata(raw: string | undefined): AssetMetadataInput {
    if (!raw) {
      return {};
    }
    try {
      const parsed = JSON.parse(raw) as AssetMetadataInput;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      throw new BadRequestException('Invalid metadata JSON');
    }
  }

  async create(
    userId: string,
    file: Express.Multer.File,
    metadata: AssetMetadataInput,
  ): Promise<AssetUploadResult> {
    if (!file) {
      throw new BadRequestException('Missing file');
    }

    const mimeType = metadata.mimeType || file.mimetype;
    if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new UnsupportedMediaTypeException(
        `Unsupported mime type: ${mimeType ?? 'unknown'}`,
      );
    }

    if (file.size > this.maxSize) {
      throw new PayloadTooLargeException(
        `Asset exceeds max size of ${this.maxSize} bytes`,
      );
    }

    const id = this.sanitizeId(metadata.id) ?? randomUUID();
    const storageKey = `users/${userId}/${id}`;

    await this.r2.putObject(storageKey, file.buffer, mimeType);

    const asset = this.assetRepository.create({
      id,
      userId,
      mimeType,
      size: file.size,
      width: this.toIntOrNull(metadata.width),
      height: this.toIntOrNull(metadata.height),
      filename: metadata.filename ?? file.originalname ?? null,
      storageKey,
    });
    await this.assetRepository.save(asset);

    return { id, url: this.r2.publicUrl(storageKey) };
  }

  async delete(userId: string, id: string): Promise<void> {
    const asset = await this.assetRepository.findOneBy({ id });
    if (!asset) {
      throw new NotFoundException();
    }
    if (asset.userId !== userId) {
      throw new ForbiddenException();
    }

    await this.r2.deleteObject(asset.storageKey);
    await this.assetRepository.delete({ id });
  }

  private sanitizeId(id: string | undefined): string | null {
    if (!id) return null;
    // Allow only safe characters used as object key segments.
    return /^[A-Za-z0-9._-]{1,128}$/.test(id) ? id : null;
  }

  private toIntOrNull(value: unknown): number | null {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
  }
}
