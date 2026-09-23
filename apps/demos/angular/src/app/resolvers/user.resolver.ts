import { ResolveFn } from '@angular/router';

export interface UserData {
  id: string;
  name: string;
}

const STORAGE_KEY = 'kritzel_user';

export const userResolver: ResolveFn<UserData> = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  
  if (stored) {
    return JSON.parse(stored) as UserData;
  }

  const user: UserData = { id: crypto.randomUUID(), name: 'Guest' };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
};
