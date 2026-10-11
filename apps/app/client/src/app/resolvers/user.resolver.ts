import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { GUEST_STORAGE_KEY, USER_STORAGE_KEY } from '../auth-storage';
import { AuthService } from '../services/auth.service';

export interface UserData {
  id: string;
  displayName: string;
  isGuest?: boolean;
}

export const userResolver: ResolveFn<UserData> = async () => {
  const authService = inject(AuthService);

  if (navigator.onLine) {
    await authService.checkAuth();
    const authUser = authService.user();
    if (authUser) {
      const userData: UserData = { id: authUser.id, displayName: authUser.displayName ?? 'User', isGuest: false };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      return userData;
    }
  }

  const storedGuest = localStorage.getItem(GUEST_STORAGE_KEY);
  if (storedGuest) {
    localStorage.setItem(USER_STORAGE_KEY, storedGuest);
    return JSON.parse(storedGuest) as UserData;
  }

  const user: UserData = { id: crypto.randomUUID(), displayName: 'Guest', isGuest: true };
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(user));
  return user;
};
