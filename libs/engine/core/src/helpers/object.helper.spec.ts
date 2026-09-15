import { ObjectHelper } from './object.helper';

describe('ObjectHelper', () => {
  describe('generateUUID', () => {
    it('should return a string', () => {
      expect(typeof ObjectHelper.generateUUID()).toBe('string');
    });

    it('should return a string of length 16', () => {
      expect(ObjectHelper.generateUUID().length).toBe(16);
    });

    it('should return different values on subsequent calls', () => {
      const uuid1 = ObjectHelper.generateUUID();
      const uuid2 = ObjectHelper.generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('isEmpty', () => {
    it('should return true for null', () => {
      expect(ObjectHelper.isEmpty(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(ObjectHelper.isEmpty(undefined)).toBe(true);
    });

    it('should return true for an empty object literal', () => {
      expect(ObjectHelper.isEmpty({})).toBe(true);
    });

    it('should return false for a non-empty object literal', () => {
      expect(ObjectHelper.isEmpty({ a: 1 })).toBe(false);
    });

    it('should return false for an empty array', () => {
      expect(ObjectHelper.isEmpty([])).toBe(false);
    });

    it('should return false for a non-empty array', () => {
      expect(ObjectHelper.isEmpty([1, 2])).toBe(false);
    });

    it('should return false for a string', () => {
      expect(ObjectHelper.isEmpty('hello')).toBe(false);
    });

    it('should return false for an empty string', () => {
      expect(ObjectHelper.isEmpty('')).toBe(false);
    });

    it('should return false for a number', () => {
      expect(ObjectHelper.isEmpty(123)).toBe(false);
    });

    it('should return false for zero', () => {
      expect(ObjectHelper.isEmpty(0)).toBe(false);
    });

    it('should return false for a class instance with no own properties', () => {
      class MyClass {}
      const instance = new MyClass();
      expect(ObjectHelper.isEmpty(instance)).toBe(false);
    });
  });

  describe('isKritzelExportable', () => {
    it('should return false for null', () => {
      expect(ObjectHelper.isKritzelExportable(null)).toBe(false);
    });

    it('should return false when getSupportedExportFormats is missing', () => {
      const candidate = {
        exportAs: async () => 'data:image/png;base64,abc',
      };

      expect(ObjectHelper.isKritzelExportable(candidate)).toBe(false);
    });

    it('should return false when exportAs is missing', () => {
      const candidate = {
        getSupportedExportFormats: () => ['png'],
      };

      expect(ObjectHelper.isKritzelExportable(candidate)).toBe(false);
    });

    it('should return false when supported formats are empty', () => {
      const candidate = {
        getSupportedExportFormats: () => [],
        exportAs: async () => 'data:image/png;base64,abc',
      };

      expect(ObjectHelper.isKritzelExportable(candidate)).toBe(false);
    });

    it('should return false when supported formats are not an array', () => {
      const candidate = {
        getSupportedExportFormats: () => 'png',
        exportAs: async () => 'data:image/png;base64,abc',
      };

      expect(ObjectHelper.isKritzelExportable(candidate)).toBe(false);
    });

    it('should return true for valid exportable objects', () => {
      const candidate = {
        getSupportedExportFormats: () => ['png'],
        exportAs: async () => 'data:image/png;base64,abc',
      };

      expect(ObjectHelper.isKritzelExportable(candidate)).toBe(true);
    });
  });
});
