import { KritzelCursorHelper } from './cursor.helper';

jest.mock('../classes/registries/icon-registry.class', () => ({
  KritzelIconRegistry: {
    get: jest.fn(),
  },
}));

import { KritzelIconRegistry } from '../classes/registries/icon-registry.class';

const mockedGet = KritzelIconRegistry.get as jest.Mock;

const FAKE_SVG = '<svg width="24" height="24"><path d="M0 0" fill="currentColor"/></svg>';

describe('KritzelCursorHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the cached pointer cursor
    (KritzelCursorHelper as any)._pointerCursor = null;
  });

  describe('getCursor', () => {
    it('should return "auto" when icon is not found in registry', () => {
      mockedGet.mockReturnValue(undefined);
      const spy = jest.spyOn(console, 'warn').mockImplementation();

      const result = KritzelCursorHelper.getCursor({ iconName: 'unknown' });

      expect(result).toBe('auto');
      expect(spy).toHaveBeenCalledWith('Icon "unknown" not found in registry.');
      spy.mockRestore();
    });

    it('should look up "mousePointer" when iconName is "default"', () => {
      mockedGet.mockReturnValue(FAKE_SVG);

      KritzelCursorHelper.getCursor({ iconName: 'default' });

      expect(mockedGet).toHaveBeenCalledWith('mousePointer');
    });

    it('should look up the provided iconName directly', () => {
      mockedGet.mockReturnValue(FAKE_SVG);

      KritzelCursorHelper.getCursor({ iconName: 'crosshair' });

      expect(mockedGet).toHaveBeenCalledWith('crosshair');
    });

    it('should return a cursor string with data URI', () => {
      mockedGet.mockReturnValue(FAKE_SVG);

      const result = KritzelCursorHelper.getCursor({ iconName: 'crosshair' });

      expect(result).toMatch(/^url\('data:image\/svg\+xml;charset=utf-8,.+'\) .+ .+, auto$/);
    });

    it('should use default size of 24', () => {
      mockedGet.mockReturnValue(FAKE_SVG);

      const result = KritzelCursorHelper.getCursor({ iconName: 'crosshair' });

      // For non-default icons, hotspot is center: size/2 = 12
      expect(result).toContain('12 12, auto');
    });

    it('should use custom size', () => {
      mockedGet.mockReturnValue(FAKE_SVG);

      const result = KritzelCursorHelper.getCursor({ iconName: 'crosshair', size: 32 });

      // Center hotspot: 32/2 = 16
      expect(result).toContain('16 16, auto');
    });

    it('should use hotspot (4, 4) for "default" icon', () => {
      mockedGet.mockReturnValue(FAKE_SVG);

      const result = KritzelCursorHelper.getCursor({ iconName: 'default' });

      expect(result).toContain('4 4, auto');
    });

    it('should use custom hotspot when provided', () => {
      mockedGet.mockReturnValue(FAKE_SVG);

      const result = KritzelCursorHelper.getCursor({ iconName: 'crosshair', hotspot: { x: 2, y: 3 } });

      expect(result).toContain('2 3, auto');
    });

    it('should replace currentColor with provided color', () => {
      mockedGet.mockReturnValue(FAKE_SVG);

      const result = KritzelCursorHelper.getCursor({ iconName: 'crosshair', color: 'red' });
      const decoded = decodeURIComponent(result);

      expect(decoded).toContain('red');
      expect(decoded).not.toContain('currentColor');
    });

    it('should default color to black', () => {
      mockedGet.mockReturnValue(FAKE_SVG);

      const result = KritzelCursorHelper.getCursor({ iconName: 'crosshair' });
      const decoded = decodeURIComponent(result);

      expect(decoded).toContain('black');
    });

    it('should apply rotation transform', () => {
      mockedGet.mockReturnValue(FAKE_SVG);

      const result = KritzelCursorHelper.getCursor({ iconName: 'crosshair', rotation: 45 });
      const decoded = decodeURIComponent(result);

      expect(decoded).toContain('rotate(45 12 12)');
    });

    it('should default rotation to 0', () => {
      mockedGet.mockReturnValue(FAKE_SVG);

      const result = KritzelCursorHelper.getCursor({ iconName: 'crosshair' });
      const decoded = decodeURIComponent(result);

      expect(decoded).toContain('rotate(0 12 12)');
    });

    it('should replace width and height in the SVG content', () => {
      mockedGet.mockReturnValue(FAKE_SVG);

      const result = KritzelCursorHelper.getCursor({ iconName: 'crosshair', size: 32 });
      const decoded = decodeURIComponent(result);

      expect(decoded).toContain('width="32"');
      expect(decoded).toContain('height="32"');
    });
  });

  describe('getPointerCursor', () => {
    it('should call getCursor with "pointer" iconName', () => {
      mockedGet.mockReturnValue(FAKE_SVG);

      const result = KritzelCursorHelper.getPointerCursor();

      expect(mockedGet).toHaveBeenCalledWith('pointer');
      expect(result).toMatch(/^url\('/);
    });

    it('should cache the result on subsequent calls', () => {
      mockedGet.mockReturnValue(FAKE_SVG);

      const first = KritzelCursorHelper.getPointerCursor();
      const second = KritzelCursorHelper.getPointerCursor();

      expect(first).toBe(second);
      // Only called once because the result is cached
      expect(mockedGet).toHaveBeenCalledTimes(1);
    });
  });
});
