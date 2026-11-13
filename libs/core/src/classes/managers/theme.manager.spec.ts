import { UpdrawThemeManager } from './theme.manager';
import { UpdrawCore } from '../core/core.class';
import { ThemeHelper } from '../../helpers/theme.helper';
import { lightTheme } from '../../themes/light-theme';
import { darkTheme } from '../../themes/dark-theme';

jest.mock('../core/core.class');
jest.mock('../../helpers/theme.helper');

describe('UpdrawThemeManager', () => {
  let manager: UpdrawThemeManager;
  let mockCore: any;

  const createMockElement = (): HTMLElement => {
    return {
      style: {
        setProperty: jest.fn(),
        removeProperty: jest.fn(),
      },
    } as unknown as HTMLElement;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    mockCore = {} as unknown as jest.Mocked<UpdrawCore>;

    manager = new UpdrawThemeManager(mockCore);
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  // ============================================
  // Constructor & currentTheme
  // ============================================

  describe('constructor', () => {
    it('should default to light theme when nothing is stored', () => {
      expect(manager.currentTheme).toBe('light');
    });

    it('should restore stored theme from settings object', () => {
      localStorage.setItem('updraw-settings', JSON.stringify({ theme: 'dark' }));

      const freshManager = new UpdrawThemeManager(mockCore);

      expect(freshManager.currentTheme).toBe('dark');
    });

    it('should allow unregistered themes to be loaded from settings', () => {
      localStorage.setItem('updraw-settings', JSON.stringify({ theme: 'neon' }));

      const freshManager = new UpdrawThemeManager(mockCore);

      // The manager allows unregistered themes because they might be registered later
      expect(freshManager.currentTheme).toBe('neon');
    });

    it('should fallback to default theme when applying an unregistered theme', () => {
      localStorage.setItem('updraw-settings', JSON.stringify({ theme: 'neon' }));

      const freshManager = new UpdrawThemeManager(mockCore);
      const element = createMockElement();
      freshManager.setTargetElement(element);

      // Even though currentTheme is 'neon', the fallback 'light' theme is applied
      expect(ThemeHelper.applyThemeToElement).toHaveBeenCalledWith(element, lightTheme);
    });

    it('should default to light when settings object has no theme', () => {
      localStorage.setItem('updraw-settings', JSON.stringify({ scaleMin: 0.1 }));

      const freshManager = new UpdrawThemeManager(mockCore);

      expect(freshManager.currentTheme).toBe('light');
    });

    it('should default to light when settings value is invalid JSON', () => {
      localStorage.setItem('updraw-settings', 'not-json');

      const freshManager = new UpdrawThemeManager(mockCore);

      expect(freshManager.currentTheme).toBe('light');
    });
  });

  // ============================================
  // editorId namespacing
  // ============================================

  describe('editorId namespacing', () => {
    let mockCoreWithId: any;

    beforeEach(() => {
      mockCoreWithId = { editorId: 'homepage' } as unknown as jest.Mocked<UpdrawCore>;
    });

    it('should restore theme from namespaced settings key', () => {
      localStorage.setItem('updraw-settings-homepage', JSON.stringify({ theme: 'dark' }));

      const freshManager = new UpdrawThemeManager(mockCoreWithId);

      expect(freshManager.currentTheme).toBe('dark');
    });

    it('should not read from the non-namespaced key when editorId is set', () => {
      localStorage.setItem('updraw-settings', JSON.stringify({ theme: 'dark' }));

      const freshManager = new UpdrawThemeManager(mockCoreWithId);

      expect(freshManager.currentTheme).toBe('light');
    });

    it('should isolate storage between different editorIds', () => {
      const mockCoreA = { editorId: 'editor-a' } as unknown as jest.Mocked<UpdrawCore>;
      const mockCoreB = { editorId: 'editor-b' } as unknown as jest.Mocked<UpdrawCore>;

      localStorage.setItem('updraw-settings-editor-a', JSON.stringify({ theme: 'dark' }));
      localStorage.setItem('updraw-settings-editor-b', JSON.stringify({ theme: 'light' }));

      const managerA = new UpdrawThemeManager(mockCoreA);
      const managerB = new UpdrawThemeManager(mockCoreB);

      expect(managerA.currentTheme).toBe('dark');
      expect(managerB.currentTheme).toBe('light');
    });

    it('should use default key when editorId is undefined', () => {
      localStorage.setItem('updraw-settings', JSON.stringify({ theme: 'dark' }));
      const noIdCore = { editorId: undefined } as unknown as jest.Mocked<UpdrawCore>;

      const noIdManager = new UpdrawThemeManager(noIdCore);

      expect(noIdManager.currentTheme).toBe('dark');
    });
  });

  // ============================================
  // setTargetElement / getTargetElement
  // ============================================

  describe('setTargetElement', () => {
    it('should store the target element', () => {
      const element = createMockElement();

      manager.setTargetElement(element);

      expect(manager.getTargetElement()).toBe(element);
    });

    it('should apply the current theme when setting an element', () => {
      const element = createMockElement();

      manager.setTargetElement(element);

      expect(ThemeHelper.applyThemeToElement).toHaveBeenCalledWith(element, lightTheme);
    });

    it('should apply dark theme when current theme is dark', () => {
      localStorage.setItem('updraw-settings', JSON.stringify({ theme: 'dark' }));
      const darkManager = new UpdrawThemeManager(mockCore);
      const element = createMockElement();

      darkManager.setTargetElement(element);

      expect(ThemeHelper.applyThemeToElement).toHaveBeenCalledWith(element, darkTheme);
    });

    it('should handle null without applying theme', () => {
      manager.setTargetElement(null);

      expect(manager.getTargetElement()).toBeNull();
      expect(ThemeHelper.applyThemeToElement).not.toHaveBeenCalled();
    });
  });

  describe('getTargetElement', () => {
    it('should return null initially', () => {
      expect(manager.getTargetElement()).toBeNull();
    });

    it('should return the set element', () => {
      const element = createMockElement();
      manager.setTargetElement(element);

      expect(manager.getTargetElement()).toBe(element);
    });
  });

  // ============================================
  // getThemeByName
  // ============================================

  describe('getThemeByName', () => {
    it('should return lightTheme for light', () => {
      const theme = manager.getThemeByName('light');

      expect(theme).toBe(lightTheme);
    });

    it('should return darkTheme for dark', () => {
      const theme = manager.getThemeByName('dark');

      expect(theme).toBe(darkTheme);
    });

    it('should return lightTheme as a fallback for an unregistered theme', () => {
      const theme = manager.getThemeByName('unregistered-theme');

      expect(theme).toBe(lightTheme);
    });
  });

  // ============================================
  // getStoredTheme (static)
  // ============================================

  describe('getStoredTheme', () => {
    it('should return light when nothing is stored', () => {
      expect(UpdrawThemeManager.getStoredTheme()).toBe('light');
    });

    it('should return dark when dark is stored in settings', () => {
      localStorage.setItem('updraw-settings', JSON.stringify({ theme: 'dark' }));

      expect(UpdrawThemeManager.getStoredTheme()).toBe('dark');
    });

    it('should return light when light is stored in settings', () => {
      localStorage.setItem('updraw-settings', JSON.stringify({ theme: 'light' }));

      expect(UpdrawThemeManager.getStoredTheme()).toBe('light');
    });

    it('should return the theme name from settings even if unregistered', () => {
      localStorage.setItem('updraw-settings', JSON.stringify({ theme: 'invalid' }));

      expect(UpdrawThemeManager.getStoredTheme()).toBe('invalid');
    });

    it('should return light for invalid JSON', () => {
      localStorage.setItem('updraw-settings', 'not-json');

      expect(UpdrawThemeManager.getStoredTheme()).toBe('light');
    });
  });

  // ============================================
  // setTheme
  // ============================================

  describe('setTheme', () => {
    it('should update the current theme', () => {
      manager.setTheme('dark');

      expect(manager.currentTheme).toBe('dark');
    });

    it('should not persist the theme to localStorage', () => {
      manager.setTheme('dark');

      expect(localStorage.getItem('updraw-settings')).toBeNull();
    });

    it('should apply theme to target element when one is set', () => {
      const element = createMockElement();
      manager.setTargetElement(element);
      jest.clearAllMocks();

      manager.setTheme('dark');

      expect(ThemeHelper.applyThemeToElement).toHaveBeenCalledWith(element, darkTheme);
    });

    it('should not apply theme when no target element is set', () => {
      jest.clearAllMocks();
      manager.setTheme('dark');

      expect(ThemeHelper.applyThemeToElement).not.toHaveBeenCalled();
    });

    it('should allow switching back from dark to light', () => {
      manager.setTheme('dark');
      manager.setTheme('light');

      expect(manager.currentTheme).toBe('light');
    });
  });

  // ============================================
  // isDarkTheme
  // ============================================

  describe('isDarkTheme', () => {
    it('should return false for light theme', () => {
      expect(manager.isDarkTheme()).toBe(false);
    });

    it('should return true for dark theme', () => {
      manager.setTheme('dark');

      expect(manager.isDarkTheme()).toBe(true);
    });

    it('should return false after switching back to light', () => {
      manager.setTheme('dark');
      manager.setTheme('light');

      expect(manager.isDarkTheme()).toBe(false);
    });
  });

  // ============================================
  // applyTheme
  // ============================================

  describe('applyTheme', () => {
    it('should apply light theme to target element', () => {
      const element = createMockElement();
      manager.setTargetElement(element);
      jest.clearAllMocks();

      manager.applyTheme('light');

      expect(ThemeHelper.applyThemeToElement).toHaveBeenCalledWith(element, lightTheme);
    });

    it('should apply dark theme to target element', () => {
      const element = createMockElement();
      manager.setTargetElement(element);
      jest.clearAllMocks();

      manager.applyTheme('dark');

      expect(ThemeHelper.applyThemeToElement).toHaveBeenCalledWith(element, darkTheme);
    });

    it('should not apply when no target element is set', () => {
      jest.clearAllMocks();
      manager.applyTheme('light');

      expect(ThemeHelper.applyThemeToElement).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // cleanup
  // ============================================

  describe('cleanup', () => {
    it('should null out the target element', () => {
      const element = createMockElement();
      manager.setTargetElement(element);

      manager.cleanup();

      expect(manager.getTargetElement()).toBeNull();
    });

    it('should not throw when target is already null', () => {
      manager.cleanup();

      expect(manager.getTargetElement()).toBeNull();
    });

    it('should prevent theme application after cleanup', () => {
      const element = createMockElement();
      manager.setTargetElement(element);
      manager.cleanup();
      jest.clearAllMocks();

      manager.applyTheme('dark');

      expect(ThemeHelper.applyThemeToElement).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // registerThemes
  // ============================================

  describe('registerThemes', () => {
    it('should initially contain light and dark themes', () => {
      const themes = manager.getAllThemes();
      expect(themes).toContain(lightTheme);
      expect(themes).toContain(darkTheme);
    });

    it('should replace the registry with only the provided themes', () => {
      const customTheme: any = { name: 'custom' };
      manager.registerThemes([customTheme]);

      expect(manager.getAllThemes()).toEqual([customTheme]);
    });

    it('should remove the built-in light and dark themes after initialization', () => {
      const customTheme: any = { name: 'custom' };
      manager.registerThemes([customTheme]);

      expect(manager.getAllThemes()).not.toContain(lightTheme);
      expect(manager.getAllThemes()).not.toContain(darkTheme);
    });

    it('should make provided themes retrievable via getThemeByName', () => {
      const customTheme: any = { name: 'ocean-blue' };
      manager.registerThemes([customTheme]);

      expect(manager.getThemeByName('ocean-blue')).toBe(customTheme);
    });

    it('should register multiple themes', () => {
      const themeA: any = { name: 'brand-light' };
      const themeB: any = { name: 'brand-dark' };
      manager.registerThemes([themeA, themeB]);

      expect(manager.getAllThemes()).toEqual([themeA, themeB]);
    });

    it('should fall back to the first registered theme when a name is not found', () => {
      const firstTheme: any = { name: 'first' };
      const secondTheme: any = { name: 'second' };
      manager.registerThemes([firstTheme, secondTheme]);

      expect(manager.getThemeByName('unknown')).toBe(firstTheme);
    });

    it('should apply themes registered via registerThemes', () => {
      const customTheme: any = { name: 'ocean-blue' };
      manager.registerThemes([customTheme]);

      const element = createMockElement();
      manager.setTargetElement(element);
      jest.clearAllMocks();

      manager.setTheme('ocean-blue');

      expect(ThemeHelper.applyThemeToElement).toHaveBeenCalledWith(element, customTheme);
    });

    it('should warn when called with an empty array', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      manager.registerThemes([]);

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });
});
