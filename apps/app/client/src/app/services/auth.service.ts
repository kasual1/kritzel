import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { IUser } from '../models/user.model';
import {
  AUTH_CHANNEL_NAME,
  GUEST_STORAGE_KEY,
  USER_STORAGE_KEY,
} from '../auth-storage';

interface MeResponse {
  id: string;
  email: string;
  displayName: string;
  picture?: string | null;
}

interface LogoutMessage {
  type: 'logout';
  userId: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  private http = inject(HttpClient);

  private readonly baseUrl = window.location.origin;
  private readonly authChannel = new BroadcastChannel(AUTH_CHANNEL_NAME);
  private authGeneration = 0;
  private pendingLogoutReload = false;

  user = signal<IUser | null>(null);

  constructor() {
    this.authChannel.addEventListener('message', (event: MessageEvent<LogoutMessage>) => {
      const data = event.data;
      // only react if this tab was logged in as the same user that just logged out
      if (data?.type === 'logout' && data.userId && this.user()?.id === data.userId) {
        this.handleRemoteLogout();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      if (this.pendingLogoutReload) {
        this.pendingLogoutReload = false;
        window.location.assign('/');
        return;
      }

      // background/frozen tabs can miss the BroadcastChannel message entirely, so
      // re-verify the session as soon as such a tab regains visibility
      void this.reconcileAuthOnFocus();
    });
  }

  ngOnDestroy(): void {
    this.authChannel.close();
  }

  private handleRemoteLogout(): void {
    this.authGeneration++;
    this.user.set(this.restoreGuestUser());

    // a background tab's fresh page load would itself be throttled by the browser,
    // so wait until this tab is actually focused before navigating
    if (document.visibilityState === 'visible') {
      window.location.assign('/');
    } else {
      this.pendingLogoutReload = true;
    }
  }

  private async reconcileAuthOnFocus(): Promise<void> {
    const previousUserId = this.user()?.id;
    if (!previousUserId) {
      return;
    }

    await this.checkAuth();

    if (this.user()?.id !== previousUserId) {
      this.handleRemoteLogout();
    }
  }

  async checkAuth(): Promise<void> {
    const authGeneration = this.authGeneration;

    try {
      const me = await firstValueFrom(
        this.http
          .get<MeResponse>(`${this.baseUrl}/api/auth/me`, {
            withCredentials: true,
          })
          .pipe(timeout(5000))
      );

      if (this.authGeneration !== authGeneration) {
        this.user.set(null);
        return;
      }

      this.user.set({
        id: me.id,
        email: me.email,
        displayName: me.displayName,
        profileImageUrl: me.picture ?? undefined,
      });
    } catch {
      this.user.set(null);
    }
  }

  async getWsToken(): Promise<string> {
    const { token } = await firstValueFrom(
      this.http.get<{ token: string }>(
        `${this.baseUrl}/api/auth/ws-token`,
        { withCredentials: true },
      ),
    );
    return token;
  }

  async logout(): Promise<void> {
    const loggedOutUserId = this.user()?.id;

    await firstValueFrom(
      this.http.post(`${this.baseUrl}/api/auth/logout`, {}, { withCredentials: true })
    );
    this.user.set(this.restoreGuestUser());
    this.authGeneration++;

    if (loggedOutUserId) {
      this.authChannel.postMessage({ type: 'logout', userId: loggedOutUserId } satisfies LogoutMessage);
    }
  }

  private restoreGuestUser(): IUser | null {
    const guest = localStorage.getItem(GUEST_STORAGE_KEY);

    if (!guest) {
      localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }

    // write the guest back into kritzel_user so a following reload's resolver
    // can pick it up immediately instead of waiting on the /api/auth/me round trip
    localStorage.setItem(USER_STORAGE_KEY, guest);

    return JSON.parse(guest) as IUser;
  }
}
