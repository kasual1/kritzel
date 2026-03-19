export interface IKritzelUser {
  /** Unique user identifier */
  id: string;

  /** User's first name */
  firstName?: string;

  /** User's last name */
  lastName?: string;

  /** Display name (takes precedence over firstName/lastName for display) */
  displayName?: string;

  /** User's email address */
  email?: string;

  /** URL to the user's profile image */
  profileImageUrl?: string;

  /** OAuth provider name (e.g., 'google', 'github', 'microsoft') */
  oauthProvider?: string;

  /** OAuth provider-specific user identifier */
  oauthProviderId?: string;

  /** User's preferred color (for avatar background when showing initials) */
  color?: string;

  /** Whether the user is a guest (not authenticated) */
  isGuest?: boolean;
}
