import { UpmadeIconName } from '../classes/registries/icon-registry.class';

/**
 * Represents an authentication provider button displayed in the login dialog.
 */
export interface UpmadeLoginProvider {
  /** Machine identifier emitted in events (e.g. 'google', 'apple', 'facebook') */
  name: string;

  /** Button label text (e.g. 'Continue with Google') */
  label: string;

  /** Optional icon name registered in UpmadeIconRegistry via customSvgIcons */
  icon?: UpmadeIconName;
}

/**
 * Configuration for the integrated login dialog.
 * When provided to upmade-editor, a "Sign in" button is rendered that opens
 * a dialog with the configured authentication provider buttons.
 */
export interface UpmadeLoginConfig {
  /** Array of authentication provider buttons to render */
  providers: UpmadeLoginProvider[];

  /** Dialog title (defaults to 'Sign in') */
  title?: string;

  /** Optional subtitle text displayed below the title */
  subtitle?: string;
}

