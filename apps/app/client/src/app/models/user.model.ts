export interface IUser {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  profileImageUrl?: string;
  oauthProvider?: string;
  oauthProviderId?: string;
  color?: string;
}
