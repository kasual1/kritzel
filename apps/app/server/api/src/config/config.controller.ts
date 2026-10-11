import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('config')
export class ConfigController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  getPublicConfig() {
    const base = (this.config.get<string>('R2_PUBLIC_BASE_URL') ?? '').replace(
      /\/+$/,
      '',
    );
    return {
      assetBaseUrl: base,
    };
  }
}
