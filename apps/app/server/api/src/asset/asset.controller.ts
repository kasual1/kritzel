/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import 'multer';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AssetService } from './asset.service';

interface JwtPayload {
  sub: string;
  email: string;
}

@Controller('assets')
@UseGuards(JwtAuthGuard)
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  upload(
    @Req() req: Request & { user: JwtPayload },
    @UploadedFile() file: Express.Multer.File,
    @Body('metadata') metadata: string | undefined,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const parsed = this.assetService.parseMetadata(metadata);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return this.assetService.create(req.user.sub, file, parsed);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Req() req: Request & { user: JwtPayload },
    @Param('id') id: string,
  ): Promise<void> {
    await this.assetService.delete(req.user.sub, id);
  }
}
