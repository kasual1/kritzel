import { UpmadeMathHelper } from './math.helper';

describe('UpmadeMathHelper', () => {
  describe('average', () => {
    it('should return the average of two positive numbers', () => {
      expect(UpmadeMathHelper.average(2, 4)).toBe(3);
    });

    it('should return the average of two negative numbers', () => {
      expect(UpmadeMathHelper.average(-2, -4)).toBe(-3);
    });

    it('should return the average of a positive and a negative number', () => {
      expect(UpmadeMathHelper.average(-2, 4)).toBe(1);
    });

    it('should return the average of a number and zero', () => {
      expect(UpmadeMathHelper.average(0, 4)).toBe(2);
    });

    it('should return zero when averaging zero and zero', () => {
      expect(UpmadeMathHelper.average(0, 0)).toBe(0);
    });
  });
});
