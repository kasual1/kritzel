import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as Y from 'yjs';
import { Document } from './document.entity';

export interface DocumentDto {
  id: string;
  name: string | null;
  isPublic: boolean;
  type: string;
  userId: string | null;
  updatedAt: Date;
}

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
  ) {}

  private toDto(doc: Document): DocumentDto {
    const ydoc = new Y.Doc();
    if (doc.data) {
      Y.applyUpdate(ydoc, doc.data);
    }
    const name =
      (ydoc.getMap('metadata').get('workspaceName') as string) || null;
    ydoc.destroy();

    return {
      id: doc.id,
      name,
      isPublic: doc.isPublic,
      type: doc.type,
      userId: doc.userId,
      updatedAt: doc.updatedAt,
    };
  }

  async findAll(): Promise<DocumentDto[]> {
    const docs = await this.documentRepository.find();
    return docs.map((doc) => this.toDto(doc));
  }

  async findById(id: string): Promise<DocumentDto | null> {
    const doc = await this.documentRepository.findOneBy({ id });
    return doc ? this.toDto(doc) : null;
  }

  async findByUserId(userId: string): Promise<DocumentDto[]> {
    const docs = await this.documentRepository.findBy({ userId });
    return docs.map((doc) => this.toDto(doc));
  }
}
