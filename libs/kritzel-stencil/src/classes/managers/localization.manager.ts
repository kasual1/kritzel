import { KritzelCore } from '../core/core.class';
import { LocalizationHelper } from '../../helpers/localization.helper';
import { EN_LOCALE } from '../../locales/en-locale';
import { DE_LOCALE } from '../../locales/de-locale';
import { FR_LOCALE } from '../../locales/fr-locale';
import { KritzelLocale, KritzelTermKey, KritzelTermVars, LocaleCode } from '../../interfaces/localization.interface';

/** Key used to store the settings object in localStorage. */
const SETTINGS_STORAGE_KEY = 'kritzel-settings';

/** Default locale used when no stored preference exists. */
const DEFAULT_LOCALE: LocaleCode = 'en';

/**
 * Manages localization state and term resolution across the Kritzel editor.
 *
 * The manager is owned per {@link KritzelCore} instance (like the theme manager)
 * so that multiple editors on the same page can use different languages in
 * isolation.
 *
 * Term resolution follows a deterministic fallback chain for each key:
 * 1. active locale's custom terms
 * 2. active locale's built-in terms
 * 3. fallback locale's custom terms
 * 4. fallback locale's built-in terms
 * 5. the key itself (last resort)
 *
 * Persistence of the selected locale is handled by the KritzelSettings
 * component; this manager only reads the stored value.
 */
export class KritzelLocalizationManager {
  private readonly _core: KritzelCore;
  private readonly _storageKey: string;

  /** Built-in locale definitions, keyed by locale code. */
  private readonly _builtinLocales = new Map<string, KritzelLocale>();
  /** Consumer-registered locale definitions, keyed by locale code. */
  private readonly _customLocales = new Map<string, KritzelLocale>();

  private _currentLocale: LocaleCode = DEFAULT_LOCALE;
  private _fallbackLocale: LocaleCode = DEFAULT_LOCALE;
  /** Whether the consumer explicitly configured a locale catalog (even an empty one) via `configureLocales`. */
  private _explicitLocales = false;

  /**
   * Creates a new KritzelLocalizationManager instance.
   * Seeds the built-in locales and initializes the current locale from the
   * settings object in localStorage (or the default locale).
   *
   * @param core - The KritzelCore instance this manager belongs to
   */
  constructor(core: KritzelCore) {
    this._core = core;
    this._storageKey = core.editorId ? `${SETTINGS_STORAGE_KEY}-${core.editorId}` : SETTINGS_STORAGE_KEY;

    this._builtinLocales.set(EN_LOCALE.code, EN_LOCALE);
    this._builtinLocales.set(DE_LOCALE.code, DE_LOCALE);
    this._builtinLocales.set(FR_LOCALE.code, FR_LOCALE);

    this._currentLocale = this.getStoredLocale();
  }

  /**
   * Gets the currently active locale code.
   */
  get currentLocale(): LocaleCode {
    return this._currentLocale;
  }

  /**
   * Gets the fallback locale code used when a term is missing from the active locale.
   */
  get fallbackLocale(): LocaleCode {
    return this._fallbackLocale;
  }

  /**
   * Sets the fallback locale code used when a term is missing from the active locale.
   *
   * @param code - The fallback locale code
   */
  setFallbackLocale(code: LocaleCode): void {
    this._fallbackLocale = code;
  }

  /**
   * Registers consumer-provided locale definitions. Definitions are merged by
   * code; registering the same code again replaces the previous definition.
   * A registered locale may provide a partial set of terms — missing terms are
   * resolved through the fallback chain.
   *
   * @param locales - The locale definitions to register
   */
  registerLocales(locales: KritzelLocale[]): void {
    for (const locale of locales) {
      this._customLocales.set(locale.code, locale);
    }
  }

  /**
   * Declaratively configures the full locale catalog, replacing any previously
   * configured or registered custom locales. Unlike {@link registerLocales},
   * this determines which locales are considered "available" (e.g. for a
   * settings selector): passing `undefined` restores the built-in set
   * (en/de/fr); passing an array (even empty) makes that array's codes the
   * exclusive available set, falling back to `en` only if the array is empty.
   * Built-in term fallback for missing keys is unaffected either way.
   *
   * @param locales - The full locale catalog, or `undefined` to use built-ins
   */
  configureLocales(locales?: KritzelLocale[]): void {
    this._customLocales.clear();
    this._explicitLocales = locales !== undefined;
    if (locales) {
      this.registerLocales(locales);
    }
  }

  /**
   * Resolves the locale code that should actually be activated, falling back
   * to the first available locale when the requested one isn't available.
   *
   * @param requested - The locale code the consumer asked to activate
   */
  resolveActiveLocale(requested: LocaleCode): LocaleCode {
    const available = this.getAvailableLocales();
    return available.includes(requested) ? requested : available[0];
  }

  /**
   * Sets the active locale and triggers a re-render so UI strings update.
   *
   * @param code - The locale code to activate
   */
  setLocale(code: LocaleCode): void {
    this._currentLocale = code;
    this._core.rerender();
  }

  /**
   * Gets the list of available locale codes. When a locale catalog was
   * explicitly configured via {@link configureLocales}, only those codes are
   * returned (or `[DEFAULT_LOCALE]` if the catalog is empty); otherwise the
   * built-in and registered codes are combined.
   */
  getAvailableLocales(): LocaleCode[] {
    if (this._explicitLocales) {
      const codes = Array.from(this._customLocales.keys());
      return codes.length > 0 ? codes : [DEFAULT_LOCALE];
    }
    return Array.from(new Set([...this._builtinLocales.keys(), ...this._customLocales.keys()]));
  }

  /**
   * Gets the available locales as `{ code, label }` pairs for use in a selector.
   * A registered locale's label takes precedence over the built-in label; the
   * code is used as the label when none is provided.
   */
  getAvailableLocaleOptions(): { code: LocaleCode; label: string }[] {
    return this.getAvailableLocales().map(code => ({ code, label: this.getLocaleLabel(code) }));
  }

  /**
   * Gets the display label for a locale code, falling back to the code itself.
   *
   * @param code - The locale code
   */
  getLocaleLabel(code: LocaleCode): string {
    return this._customLocales.get(code)?.label ?? this._builtinLocales.get(code)?.label ?? code;
  }

  /**
   * Resolves a term key to its translated string for the active locale and
   * interpolates any `{placeholder}` tokens.
   *
   * @param key - The term key to resolve
   * @param vars - Optional values for `{placeholder}` interpolation
   * @returns The translated, interpolated string (or the key if unresolved)
   *
   * @example
   * manager.translate('menu.copy'); // 'Copy'
   * manager.translate('share.expires', { date: '5/1' }); // 'Expires 5/1'
   */
  translate(key: KritzelTermKey, vars?: KritzelTermVars): string {
    const resolved =
      this._customLocales.get(this._currentLocale)?.terms[key] ??
      this._builtinLocales.get(this._currentLocale)?.terms[key] ??
      this._customLocales.get(this._fallbackLocale)?.terms[key] ??
      this._builtinLocales.get(this._fallbackLocale)?.terms[key] ??
      key;

    return LocalizationHelper.interpolate(resolved, vars);
  }

  /**
   * Resolves every known term key for the active locale into a flat map.
   *
   * The key set is the union of all keys defined across the built-in and
   * registered locales, so consumer-added keys are included. Each value is
   * resolved through the same fallback chain as {@link translate} (without
   * interpolation, since these are shared, variable-free UI labels).
   *
   * @returns A map of every term key to its resolved string for the active locale
   */
  getAllTerms(): Partial<Record<KritzelTermKey, string>> {
    const keys = new Set<KritzelTermKey>();
    for (const locale of [...this._builtinLocales.values(), ...this._customLocales.values()]) {
      for (const key of Object.keys(locale.terms) as KritzelTermKey[]) {
        keys.add(key);
      }
    }

    const result: Partial<Record<KritzelTermKey, string>> = {};
    for (const key of keys) {
      result[key] = this.translate(key);
    }
    return result;
  }

  /**
   * Reads the stored locale from the settings object in localStorage using this
   * instance's namespaced key.
   *
   * @returns The stored locale code if valid, or the default locale
   */
  getStoredLocale(): LocaleCode {
    if (typeof localStorage === 'undefined') {
      return DEFAULT_LOCALE;
    }
    const stored = localStorage.getItem(this._storageKey);
    if (!stored) {
      return DEFAULT_LOCALE;
    }
    try {
      const parsed = JSON.parse(stored);
      if (typeof parsed?.locale === 'string') {
        return parsed.locale;
      }
    } catch {
      // Invalid JSON, use default
    }
    return DEFAULT_LOCALE;
  }

  /**
   * Cleans up the localization manager state.
   * Provided for lifecycle parity with other managers.
   */
  cleanup(): void {
    this._customLocales.clear();
    this._explicitLocales = false;
  }
}
