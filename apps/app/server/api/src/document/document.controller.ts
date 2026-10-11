import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { DocumentService } from './document.service';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get()
  findAll() {
    return this.documentService.findAll();
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.documentService.findByUserId(userId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const document = await this.documentService.findById(id);
    if (!document) {
      throw new NotFoundException();
    }
    return document;
  }
}
