import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { IUser } from '../models/user.model';

interface LookupResponse {
  users: IUser[];
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private readonly baseUrl = window.location.origin;


  private cache = new Map<string, IUser>();
  private pendingIds = new Set<string>();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private requestSeq = 0;
  private lastAppliedSeq = 0;

  /** Resolve a set of user IDs into IUser profiles. Debounces, batches, and caches. */
  resolveUsers(
    userIds: string[],
    onResolved: (users: IUser[]) => void,
  ): void {
    const seq = ++this.requestSeq;

    const unique = [...new Set(userIds)];
    const missing = unique.filter((id) => !this.cache.has(id));

    if (missing.length === 0) {
      this.applyIfLatest(seq, unique, onResolved);
      return;
    }

    for (const id of missing) this.pendingIds.add(id);

    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.flush(seq, unique, onResolved);
    }, 150);
  }

  private async flush(
    seq: number,
    requestedIds: string[],
    onResolved: (users: IUser[]) => void,
  ): Promise<void> {
    const idsToFetch = [...this.pendingIds];
    this.pendingIds.clear();

    if (idsToFetch.length === 0) {
      this.applyIfLatest(seq, requestedIds, onResolved);
      return;
    }

    try {
      const { users } = await firstValueFrom(
        this.http.post<LookupResponse>(
          `${this.baseUrl}/api/users/lookup`,
          { userIds: idsToFetch },
          { withCredentials: true },
        ),
      );
      for (const user of users) {
        this.cache.set(user.id, user);
      }
    } catch {
      // On failure, keep whatever was cached; don't clear UI.
    }

    this.applyIfLatest(seq, requestedIds, onResolved);
  }

  private applyIfLatest(
    seq: number,
    requestedIds: string[],
    onResolved: (users: IUser[]) => void,
  ): void {
    if (seq < this.lastAppliedSeq) return;
    this.lastAppliedSeq = seq;

    const resolved = requestedIds
      .map((id) => this.cache.get(id))
      .filter((u): u is IUser => u !== undefined);

    onResolved(resolved);
  }
}
