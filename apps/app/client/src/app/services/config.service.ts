import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';

interface PublicConfig {
  assetBaseUrl: string;
}

const CONFIG_CACHE_KEY = 'kritzel_public_config';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = window.location.origin;

  private cached: Promise<PublicConfig> | null = null;

  private load(): Promise<PublicConfig> {
    if (!this.cached) {
      this.cached = firstValueFrom(
        this.http.get<PublicConfig>(`${this.baseUrl}/api/config`).pipe(timeout(3000)),
      )
        .then((cfg) => {
          localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(cfg));
          return cfg;
        })
        .catch(() => this.readCache());
    }
    return this.cached;
  }

  // Offline fallback: the app must still boot without a reachable API.
  private readCache(): PublicConfig {
    const stored = localStorage.getItem(CONFIG_CACHE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as PublicConfig;
      } catch {
        // ignore malformed cache
      }
    }
    return { assetBaseUrl: '' };
  }

  async getAssetBaseUrl(): Promise<string> {
    const cfg = await this.load();
    return (cfg.assetBaseUrl ?? '').replace(/\/+$/, '');
  }
}
