import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { IDocument } from '../models/document.model';

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private http = inject(HttpClient);

  private readonly baseUrl = window.location.origin;

  findAll(): Promise<IDocument[]> {
    return firstValueFrom(
      this.http.get<IDocument[]>(`${this.baseUrl}/api/documents`, { withCredentials: true }),
    );
  }

  findByName(name: string): Promise<IDocument> {
    return firstValueFrom(
      this.http.get<IDocument>(`${this.baseUrl}/api/documents/${encodeURIComponent(name)}`, {
        withCredentials: true,
      }),
    );
  }

  findByUserId(userId: string): Promise<IDocument[]> {
    return firstValueFrom(
      this.http.get<IDocument[]>(
        `${this.baseUrl}/api/documents/user/${encodeURIComponent(userId)}`,
        { withCredentials: true },
      ),
    );
  }
}