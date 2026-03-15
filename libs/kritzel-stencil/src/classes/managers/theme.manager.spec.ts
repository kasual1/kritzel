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

    it('should restore stored theme from localStorage', () => {
      localStorage.setItem('kritzel-theme', 'dark');

      const freshManager = new KritzelThemeManager(mockCore);

      expect(freshManager.currentTheme).toBe('dark');
    });

    it('should default to light when stored value is invalid', () => {
      localStorage.setItem('kritzel-theme', 'neon');

      const freshManager = new KritzelThemeManager(mockCore);

      expect(freshManager.currentTheme).toBe('light');
    });
  });

  // ============================================
  // editorId namespacing
  // ============================================

  describe('editorId namespacing', () => {
    let editorManager: KritzelThemeManager;
    let mockCoreWithId: any;

    beforeEach(() => {
      mockCoreWithId = { editorId: 'homepage' } as unknown as jest.Mocked<KritzelCore>;
      editorManager = new KritzelThemeManager(mockCoreWithId);
    });

    it('should use namespaced storage key when editorId is set', () => {
      editorManager.saveTheme('dark');

      expect(localStorage.getItem('kritzel-theme-homepage')).toBe('dark');
      expect(localStorage.getItem('kritzel-theme')).toBeNull();
    });

    it('should restore theme from namespaced key', () => {
      localStorage.setItem('kritzel-theme-homepage', 'dark');

      const freshManager = new KritzelThemeManager(mockCoreWithId);

      expect(freshManager.currentTheme).toBe('dark');
    });

    it('should not read from the non-namespaced key when editorId is set', () => {
      localStorage.setItem('kritzel-theme', 'dark');

      const freshManager = new KritzelThemeManager(mockCoreWithId);

      expect(freshManager.currentTheme).toBe('light');
    });

    it('should isolate storage between different editorIds', () => {
      const mockCoreA = { editorId: 'editor-a' } as unknown as jest.Mocked<KritzelCore>;
      const mockCoreB = { editorId: 'editor-b' } as unknown as jest.Mocked<KritzelCore>;

      const managerA = new KritzelThemeManager(mockCoreA);
      const managerB = new KritzelThemeManager(mockCoreB);

      managerA.setTheme('dark');
      managerB.setTheme('light');

      expect(managerA.currentTheme).toBe('dark');
      expect(managerB.currentTheme).toBe('light');
      expect(localStorage.getItem('kritzel-theme-editor-a')).toBe('dark');
      expect(localStorage.getItem('kritzel-theme-editor-b')).toBe('light');
    });

    it('should use default key when editorId is undefined', () => {
      const noIdCore = { editorId: undefined } as unknown as jest.Mocked<KritzelCore>;
      const noIdManager = new KritzelThemeManager(noIdCore);

      noIdManager.saveTheme('dark');

      expect(localStorage.getItem('kritzel-theme')).toBe('dark');
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
      localStorage.setItem('kritzel-theme', 'dark');
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

    it('should return dark when dark is stored', () => {
      localStorage.setItem('kritzel-theme', 'dark');

      expect(KritzelThemeManager.getStoredTheme()).toBe('dark');
    });

    it('should return light when light is stored', () => {
      localStorage.setItem('kritzel-theme', 'light');

      expect(KritzelThemeManager.getStoredTheme()).toBe('light');
    });

    it('should return light for invalid stored values', () => {
      localStorage.setItem('kritzel-theme', 'invalid');

      expect(KritzelThemeManager.getStoredTheme()).toBe('light');
    });
  });

  // ============================================
  // saveTheme
  // ============================================

  describe('saveTheme', () => {
    it('should save light theme to localStorage', () => {
      manager.saveTheme('light');

      expect(localStorage.getItem('kritzel-theme')).toBe('light');
    });

    it('should save dark theme to localStorage', () => {
      manager.saveTheme('dark');

      expect(localStorage.getItem('kritzel-theme')).toBe('dark');
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

    it('should persist the theme to localStorage', () => {
      manager.setTheme('dark');

      expect(localStorage.getItem('kritzel-theme')).toBe('dark');
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
      expect(localStorage.getItem('kritzel-theme')).toBe('light');
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
