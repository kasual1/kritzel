import {
  UpmadeFontMap,
  UpmadeFontRegistration,
  UpmadeRegisteredFont,
} from '../../interfaces/font.interface';

type UpmadeFontRegistryStore = {
  fonts: Map<string, UpmadeRegisteredFont>;
};

const UPMADE_FONT_REGISTRY_KEY = '__upmadeFontRegistry__';
const UPMADE_FONT_REGISTRY_EVENT = 'upmade-font-registry-change';

const getGlobalRegistryStore = (): UpmadeFontRegistryStore => {
  const globalScope = globalThis as unknown as Record<string, unknown>;
  const existing = globalScope[UPMADE_FONT_REGISTRY_KEY] as UpmadeFontRegistryStore | undefined;

  if (existing) {
    return existing;
  }

  const created: UpmadeFontRegistryStore = {
    fonts: new Map<string, UpmadeRegisteredFont>(),
  };

  globalScope[UPMADE_FONT_REGISTRY_KEY] = created;
  return created;
};

const normalizeFontRegistration = (key: string, registration: UpmadeFontRegistration): UpmadeRegisteredFont => {
  if (typeof registration === 'string') {
    return {
      key,
      family: registration,
      label: registration,
      cssFontFamily: registration,
    };
  }

  return {
    key,
    family: registration.family,
    label: registration.label ?? registration.family,
    cssFontFamily: registration.cssFontFamily ?? registration.family,
    source: registration.source,
  };
};

const normalizeKey = (value: string): string => value.trim().toLocaleLowerCase();

const normalizeFamily = (value: string): string => value.trim().toLocaleLowerCase();

export class UpmadeFontRegistry {
  private static get _fonts(): Map<string, UpmadeRegisteredFont> {
    return getGlobalRegistryStore().fonts;
  }

  private static getFontFaceSet(): FontFaceSet | null {
    if (typeof document === 'undefined' || !document.fonts) {
      return null;
    }

    return document.fonts;
  }

  private static toCssFontFace(fontFamily: string): string {
    return fontFamily.includes(' ')
      ? `"${fontFamily.replaceAll('"', '\\"')}"`
      : fontFamily;
  }

  private static getRegisteredFontFamilies(fonts: UpmadeFontMap): string[] {
    return [...new Set(
      Object.values(fonts)
        .map(registration => (typeof registration === 'string' ? registration : registration.family))
        .map(family => family.trim())
        .filter(Boolean),
    )];
  }

  static register(key: string, registration: UpmadeFontRegistration): void {
    const normalized = normalizeFontRegistration(key, registration);

    if (this._fonts.has(key)) {
      console.warn(`[FontRegistry] Font "${key}" is already registered. It will be overwritten.`);
    }

    this._fonts.set(key, normalized);
    this.emitChange();
  }

  static registerFonts(fonts: UpmadeFontMap): void {
    for (const [key, registration] of Object.entries(fonts)) {
      this.register(key, registration);
    }
  }

  private static injectFontStylesheets(fonts: UpmadeFontMap): Promise<void[]> {
    if (typeof document === 'undefined') {
      return Promise.resolve([]);
    }

    const loadPromises: Promise<void>[] = [];

    for (const [key, registration] of Object.entries(fonts)) {
      if (typeof registration === 'string' || !registration.source) {
        continue;
      }

      const sourceUrl = registration.source;
      const linkId = `upmade-font-stylesheet-${key}`;

      if (document.getElementById(linkId)) {
        continue;
      }

      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = sourceUrl;

      const promise = new Promise<void>((resolve) => {
        link.onload = () => resolve();
        link.onerror = () => {
          console.warn(`[FontRegistry] Failed to load stylesheet for font "${key}": ${sourceUrl}`);
          resolve(); // Resolve anyway so we don't hang startup on external failures
        };
      });

      document.head.appendChild(link);
      loadPromises.push(promise);
    }

    return Promise.all(loadPromises);
  }

  static async waitForFonts(fonts: UpmadeFontMap): Promise<void> {
    await this.injectFontStylesheets(fonts);

    const fontFaceSet = this.getFontFaceSet();
    const registeredFontFamilies = this.getRegisteredFontFamilies(fonts);

    if (!fontFaceSet || registeredFontFamilies.length === 0) {
      return;
    }

    await Promise.allSettled(
      registeredFontFamilies.map(fontFamily => fontFaceSet.load(`1em ${this.toCssFontFace(fontFamily)}`)),
    );

    await fontFaceSet.ready;
  }

  static get(key: string): UpmadeRegisteredFont | undefined {
    return this._fonts.get(key);
  }

  static has(key: string): boolean {
    return this._fonts.has(key);
  }

  static unregister(key: string): boolean {
    const deleted = this._fonts.delete(key);

    if (deleted) {
      this.emitChange();
    }

    return deleted;
  }

  static list(): UpmadeRegisteredFont[] {
    return [...this._fonts.values()];
  }

  static resolveCssFontFamily(fontFamily: string): string {
    const normalizedFamily = normalizeFamily(fontFamily);
    const match = this.list().find(font => {
      if (normalizeFamily(font.family) === normalizedFamily) {
        return true;
      }

      return normalizeKey(font.key) === normalizedFamily;
    });

    return match?.cssFontFamily ?? fontFamily;
  }

  static toRegisteredFont(registration: UpmadeFontRegistration): UpmadeRegisteredFont {
    if (typeof registration === 'string') {
      return {
        key: registration,
        family: registration,
        label: registration,
        cssFontFamily: registration,
      };
    }

    return {
      key: registration.family,
      family: registration.family,
      label: registration.label ?? registration.family,
      cssFontFamily: registration.cssFontFamily ?? registration.family,
      source: registration.source,
    };
  }

  private static emitChange(): void {
    const eventTarget = globalThis as unknown as { dispatchEvent?: (event: Event) => boolean };

    if (typeof eventTarget.dispatchEvent !== 'function' || typeof CustomEvent === 'undefined') {
      return;
    }

    eventTarget.dispatchEvent(new CustomEvent(UPMADE_FONT_REGISTRY_EVENT));
  }

  static get changeEventName(): string {
    return UPMADE_FONT_REGISTRY_EVENT;
  }
}
