import { LocalizationHelper } from './localization.helper';

describe('LocalizationHelper', () => {
  describe('interpolate', () => {
    it('should return the template unchanged when no vars are provided', () => {
      expect(LocalizationHelper.interpolate('Hello world')).toBe('Hello world');
    });

    it('should replace a single placeholder', () => {
      expect(LocalizationHelper.interpolate('Hello {name}', { name: 'Ada' })).toBe('Hello Ada');
    });

    it('should replace multiple placeholders', () => {
      expect(LocalizationHelper.interpolate('{greeting}, {name}', { greeting: 'Hi', name: 'Ada' })).toBe('Hi, Ada');
    });

    it('should coerce numeric values to strings', () => {
      expect(LocalizationHelper.interpolate('Count: {count}', { count: 5 })).toBe('Count: 5');
    });

    it('should leave unknown placeholders untouched', () => {
      expect(LocalizationHelper.interpolate('Hello {name}', { other: 'x' })).toBe('Hello {name}');
    });
  });
});
