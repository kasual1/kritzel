import { UpdrawIconName } from '../classes/registries/icon-registry.class';

/**
 * Represents an authentication provider button displayed in the login dialog.
 */
export interface UpdrawLoginProvider {
  /** Machine identifier emitted in events (e.g. 'google', 'apple', 'facebook') */
  name: string;

  /** Button label text (e.g. 'Continue with Google') */
  label: string;

  /** Optional icon name registered in UpdrawIconRegistry via customSvgIcons */
  icon?: UpdrawIconName;
}

/**
 * Configuration for the integrated login dialog.
 * When provided to updraw-editor, a "Sign in" button is rendered that opens
 * a dialog with the configured authentication provider buttons.
 */
export interface UpdrawLoginConfig {
  /** Array of authentication provider buttons to render */
  providers: UpdrawLoginProvider[];

  /** Dialog title (defaults to 'Sign in') */
  title?: string;

  /** Optional subtitle text displayed below the title */
  subtitle?: string;
}

