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
});
