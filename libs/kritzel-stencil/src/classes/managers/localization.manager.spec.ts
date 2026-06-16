import { KritzelLocalizationManager } from './localization.manager';
import { KritzelCore } from '../core/core.class';

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
});
