import { KritzelDevicesHelper } from './devices.helper';

describe('KritzelDevicesHelper', () => {
  describe('isTouchDevice', () => {
    const originalMatchMedia = window.matchMedia;

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    it('should return true when matchMedia indicates a coarse pointer', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(any-pointer: coarse)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      expect(KritzelDevicesHelper.isTouchDevice()).toBe(true);
    });

    it('should return false when matchMedia does not indicate a coarse pointer', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      expect(KritzelDevicesHelper.isTouchDevice()).toBe(false);
    });
  });

  describe('isMobile', () => {
    const originalUserAgent = navigator.userAgent;

    afterEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true,
      });
    });

    it('should return true for iOS devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true,
      });

      expect(KritzelDevicesHelper.isMobile()).toBe(true);
    });

    it('should return true for Android devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G960U)',
        configurable: true,
      });

      expect(KritzelDevicesHelper.isMobile()).toBe(true);
    });

    it('should return false for non-mobile devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        configurable: true,
      });

      expect(KritzelDevicesHelper.isMobile()).toBe(false);
    });
  });
  describe('isIPadOS', () => {
    const originalUserAgent = navigator.userAgent;
    const originalMaxTouchPoints = navigator.maxTouchPoints;

    const setNavigator = (userAgent: string, maxTouchPoints: number) => {
      Object.defineProperty(navigator, 'userAgent', { value: userAgent, configurable: true });
      Object.defineProperty(navigator, 'maxTouchPoints', { value: maxTouchPoints, configurable: true });
    };

    afterEach(() => {
      setNavigator(originalUserAgent, originalMaxTouchPoints);
    });

    it('should detect an iPad reporting a desktop Mac user agent', () => {
      setNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15', 5);

      expect(KritzelDevicesHelper.isIPadOS()).toBe(true);
      expect(KritzelDevicesHelper.isIOS()).toBe(true);
      expect(KritzelDevicesHelper.isMobile()).toBe(true);
    });

    it('should not treat a desktop Mac without touch as mobile', () => {
      setNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15', 0);

      expect(KritzelDevicesHelper.isIPadOS()).toBe(false);
      expect(KritzelDevicesHelper.isMobile()).toBe(false);
    });

    it('should not treat a Windows touch laptop as mobile', () => {
      setNavigator('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36', 10);

      expect(KritzelDevicesHelper.isMobile()).toBe(false);
    });
  });
});
