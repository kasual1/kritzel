import { KritzelThemeManager } from './theme.manager';
import { KritzelCore } from '../core/core.class';
import { ThemeHelper } from '../../helpers/theme.helper';
import { lightTheme } from '../../themes/light-theme';
import { darkTheme } from '../../themes/dark-theme';

jest.mock('../core/core.class');
jest.mock('../../helpers/theme.helper');

describe('KritzelThemeManager', () => {
  let manager: KritzelThemeManager;
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

    mockCore = {} as unknown as jest.Mocked<KritzelCore>;

    manager = new KritzelThemeManager(mockCore);
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
      localStorage.setItem('kritzel-settings', JSON.stringify({ theme: 'dark' }));

      const freshManager = new KritzelThemeManager(mockCore);

      expect(freshManager.currentTheme).toBe('dark');
    });

    it('should default to light when settings object has invalid theme', () => {
      localStorage.setItem('kritzel-settings', JSON.stringify({ theme: 'neon' }));

      const freshManager = new KritzelThemeManager(mockCore);

      expect(freshManager.currentTheme).toBe('light');
    });

    it('should default to light when settings object has no theme', () => {
      localStorage.setItem('kritzel-settings', JSON.stringify({ scaleMin: 0.1 }));

      const freshManager = new KritzelThemeManager(mockCore);

      expect(freshManager.currentTheme).toBe('light');
    });

    it('should default to light when settings value is invalid JSON', () => {
      localStorage.setItem('kritzel-settings', 'not-json');

      const freshManager = new KritzelThemeManager(mockCore);

      expect(freshManager.currentTheme).toBe('light');
    });
  });

  // ============================================
  // editorId namespacing
  // ============================================

  describe('editorId namespacing', () => {
    let mockCoreWithId: any;

    beforeEach(() => {
      mockCoreWithId = { editorId: 'homepage' } as unknown as jest.Mocked<KritzelCore>;
    });

    it('should restore theme from namespaced settings key', () => {
      localStorage.setItem('kritzel-settings-homepage', JSON.stringify({ theme: 'dark' }));

      const freshManager = new KritzelThemeManager(mockCoreWithId);

      expect(freshManager.currentTheme).toBe('dark');
    });

    it('should not read from the non-namespaced key when editorId is set', () => {
      localStorage.setItem('kritzel-settings', JSON.stringify({ theme: 'dark' }));

      const freshManager = new KritzelThemeManager(mockCoreWithId);

      expect(freshManager.currentTheme).toBe('light');
    });

    it('should isolate storage between different editorIds', () => {
      const mockCoreA = { editorId: 'editor-a' } as unknown as jest.Mocked<KritzelCore>;
      const mockCoreB = { editorId: 'editor-b' } as unknown as jest.Mocked<KritzelCore>;

      localStorage.setItem('kritzel-settings-editor-a', JSON.stringify({ theme: 'dark' }));
      localStorage.setItem('kritzel-settings-editor-b', JSON.stringify({ theme: 'light' }));

      const managerA = new KritzelThemeManager(mockCoreA);
      const managerB = new KritzelThemeManager(mockCoreB);

      expect(managerA.currentTheme).toBe('dark');
      expect(managerB.currentTheme).toBe('light');
    });

    it('should use default key when editorId is undefined', () => {
      localStorage.setItem('kritzel-settings', JSON.stringify({ theme: 'dark' }));
      const noIdCore = { editorId: undefined } as unknown as jest.Mocked<KritzelCore>;

      const noIdManager = new KritzelThemeManager(noIdCore);

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
      localStorage.setItem('kritzel-settings', JSON.stringify({ theme: 'dark' }));
      const darkManager = new KritzelThemeManager(mockCore);
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
  });

  // ============================================
  // getStoredTheme (static)
  // ============================================

  describe('getStoredTheme', () => {
    it('should return light when nothing is stored', () => {
      expect(KritzelThemeManager.getStoredTheme()).toBe('light');
    });

    it('should return dark when dark is stored in settings', () => {
      localStorage.setItem('kritzel-settings', JSON.stringify({ theme: 'dark' }));

      expect(KritzelThemeManager.getStoredTheme()).toBe('dark');
    });

    it('should return light when light is stored in settings', () => {
      localStorage.setItem('kritzel-settings', JSON.stringify({ theme: 'light' }));

      expect(KritzelThemeManager.getStoredTheme()).toBe('light');
    });

    it('should return light for invalid theme in settings', () => {
      localStorage.setItem('kritzel-settings', JSON.stringify({ theme: 'invalid' }));

      expect(KritzelThemeManager.getStoredTheme()).toBe('light');
    });

    it('should return light for invalid JSON', () => {
      localStorage.setItem('kritzel-settings', 'not-json');

      expect(KritzelThemeManager.getStoredTheme()).toBe('light');
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

      expect(localStorage.getItem('kritzel-settings')).toBeNull();
    });

    it('should apply theme to target element when one is set', () => {
      const element = createMockElement();
      manager.setTargetElement(element);
      jest.clearAllMocks();

      manager.setTheme('dark');

      expect(ThemeHelper.applyThemeToElement).toHaveBeenCalledWith(element, darkTheme);
    });

    it('should not apply theme when no target element is set', () => {
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
});
