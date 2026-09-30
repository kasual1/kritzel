import { KritzelLocalizationManager } from './localization.manager';
import { KritzelCore } from '../core/core.class';
import { EN_LOCALE } from '../../locales/en-locale';
import { DE_LOCALE } from '../../locales/de-locale';
import { FR_LOCALE } from '../../locales/fr-locale';
import { PT_LOCALE } from '../../locales/pt-locale';
import { ES_LOCALE } from '../../locales/es-locale';
import { PL_LOCALE } from '../../locales/pl-locale';
import { NL_LOCALE } from '../../locales/nl-locale';
import { IT_LOCALE } from '../../locales/it-locale';

jest.mock('../core/core.class');

describe('KritzelLocalizationManager', () => {
  let manager: KritzelLocalizationManager;
  let mockCore: any;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    mockCore = {
      editorId: undefined,
      rerender: jest.fn(),
    } as unknown as jest.Mocked<KritzelCore>;

    manager = new KritzelLocalizationManager(mockCore);
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('constructor', () => {
    it('should default to the English locale when nothing is stored', () => {
      expect(manager.currentLocale).toBe('en');
    });

    it('should restore the stored locale from the settings object', () => {
      localStorage.setItem('kritzel-settings', JSON.stringify({ locale: 'de' }));

      const freshManager = new KritzelLocalizationManager(mockCore);

      expect(freshManager.currentLocale).toBe('de');
    });

    it('should use a namespaced storage key when editorId is set', () => {
      mockCore.editorId = 'homepage';
      localStorage.setItem('kritzel-settings-homepage', JSON.stringify({ locale: 'fr' }));

      const freshManager = new KritzelLocalizationManager(mockCore);

      expect(freshManager.currentLocale).toBe('fr');
    });
  });

  describe('setLocale', () => {
    it('should change the active locale and trigger a re-render', () => {
      manager.setLocale('de');

      expect(manager.currentLocale).toBe('de');
      expect(mockCore.rerender).toHaveBeenCalledTimes(1);
    });
  });

  describe('translate', () => {
    it('should resolve a built-in term for the active locale', () => {
      expect(manager.translate('menu.copy')).toBe('Copy');
    });

    it('should resolve a built-in term for a non-default active locale', () => {
      manager.setLocale('de');
      expect(manager.translate('menu.copy')).toBe('Kopieren');
    });

    it('should prefer a registered custom term over the built-in term', () => {
      manager.registerLocales([{ code: 'de', terms: { 'menu.copy': 'Duplizieren' } }]);
      manager.setLocale('de');

      expect(manager.translate('menu.copy')).toBe('Duplizieren');
    });

    it('should fall back to the built-in term for keys a custom locale omits', () => {
      manager.registerLocales([{ code: 'de', terms: { 'menu.copy': 'Duplizieren' } }]);
      manager.setLocale('de');

      // Not overridden -> built-in German term
      expect(manager.translate('menu.paste')).toBe('Einfügen');
    });

    it('should fall back to the fallback locale for an unknown active locale', () => {
      manager.setLocale('xx');

      expect(manager.translate('menu.copy')).toBe('Copy');
    });

    it('should return the key itself when no translation can be resolved', () => {
      manager.registerLocales([{ code: 'xx', terms: {} }]);
      manager.setFallbackLocale('xx');
      manager.setLocale('xx');

      expect(manager.translate('menu.copy')).toBe('menu.copy');
    });

    it('should interpolate placeholder tokens', () => {
      manager.registerLocales([{ code: 'en', terms: { 'menu.copy': 'Copy {count}' } }]);

      expect(manager.translate('menu.copy', { count: 3 })).toBe('Copy 3');
    });
  });

  describe('locale registry', () => {
    it('should expose the complete built-in locale catalog', () => {
      const builtInLocales = [
        EN_LOCALE,
        DE_LOCALE,
        FR_LOCALE,
        PT_LOCALE,
        ES_LOCALE,
        PL_LOCALE,
        NL_LOCALE,
        IT_LOCALE,
      ];

      expect(manager.getAvailableLocales()).toEqual(['en', 'de', 'fr', 'pt', 'es', 'pl', 'nl', 'it']);
      expect(manager.getAvailableLocaleOptions()).toEqual([
        { code: 'en', label: 'English' },
        { code: 'de', label: 'Deutsch' },
        { code: 'fr', label: 'Français' },
        { code: 'pt', label: 'Português' },
        { code: 'es', label: 'Español' },
        { code: 'pl', label: 'Polski' },
        { code: 'nl', label: 'Nederlands' },
        { code: 'it', label: 'Italiano' },
      ]);

      for (const locale of builtInLocales) {
        expect(Object.keys(locale.terms).sort()).toEqual(Object.keys(EN_LOCALE.terms).sort());
      }
    });

    it('should translate representative terms and return native labels for each added locale', () => {
      const locales = [
        { code: 'pt', copy: 'Copiar', label: 'Português' },
        { code: 'es', copy: 'Copiar', label: 'Español' },
        { code: 'pl', copy: 'Kopiuj', label: 'Polski' },
        { code: 'nl', copy: 'Kopiëren', label: 'Nederlands' },
        { code: 'it', copy: 'Copia', label: 'Italiano' },
      ] as const;

      for (const locale of locales) {
        manager.setLocale(locale.code);
        expect(manager.translate('menu.copy')).toBe(locale.copy);
        expect(manager.getLocaleLabel(locale.code)).toBe(locale.label);
      }
    });

    it('should list built-in and registered locale codes', () => {
      manager.registerLocales([{ code: 'es', label: 'Español', terms: {} }]);

      const codes = manager.getAvailableLocales();

      expect(codes).toEqual(expect.arrayContaining(['en', 'de', 'fr', 'es']));
    });

    it('should return the built-in label for a locale code', () => {
      expect(manager.getLocaleLabel('de')).toBe('Deutsch');
    });

    it('should prefer a registered label over the built-in label', () => {
      manager.registerLocales([{ code: 'de', label: 'Deutsch (CH)', terms: {} }]);

      expect(manager.getLocaleLabel('de')).toBe('Deutsch (CH)');
    });

    it('should fall back to the code when no label is available', () => {
      expect(manager.getLocaleLabel('xx')).toBe('xx');
    });

    it('should expose locale options for a selector', () => {
      const options = manager.getAvailableLocaleOptions();

      expect(options).toEqual(expect.arrayContaining([{ code: 'de', label: 'Deutsch' }]));
    });
  });

  describe('configureLocales', () => {
    it('should keep the built-in locales available when called with undefined', () => {
      manager.configureLocales(undefined);

      expect(manager.getAvailableLocales()).toEqual(expect.arrayContaining(['en', 'de', 'fr']));
    });

    it('should restrict availability to just English when configured with an empty array', () => {
      manager.configureLocales([]);

      expect(manager.getAvailableLocales()).toEqual(['en']);
    });

    it('should restrict availability to only the configured locales', () => {
      manager.configureLocales([{ code: 'es', label: 'Español', terms: {} }]);

      expect(manager.getAvailableLocales()).toEqual(['es']);
    });

    it('should still fall back to built-in terms for keys a configured locale omits', () => {
      manager.configureLocales([{ code: 'es', terms: { 'menu.copy': 'Copiar' } }]);
      manager.setLocale('es');

      expect(manager.translate('menu.copy')).toBe('Copiar');
      expect(manager.translate('menu.paste')).toBe('Paste');
    });

    it('should replace a previously configured catalog rather than merge with it', () => {
      manager.configureLocales([{ code: 'es', terms: {} }]);
      manager.configureLocales([{ code: 'fr', terms: {} }]);

      expect(manager.getAvailableLocales()).toEqual(['fr']);
    });

    it('should restore built-in availability when reconfigured with undefined', () => {
      manager.configureLocales([{ code: 'es', terms: {} }]);
      manager.configureLocales(undefined);

      expect(manager.getAvailableLocales()).toEqual(expect.arrayContaining(['en', 'de', 'fr']));
    });
  });

  describe('resolveActiveLocale', () => {
    it('should return the requested locale when it is available', () => {
      expect(manager.resolveActiveLocale('de')).toBe('de');
    });

    it('should fall back to the first available locale when the requested one is not available', () => {
      manager.configureLocales([{ code: 'es', terms: {} }]);

      expect(manager.resolveActiveLocale('en')).toBe('es');
    });
  });
});
