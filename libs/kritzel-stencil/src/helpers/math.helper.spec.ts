import { KritzelMathHelper } from './math.helper';

describe('KritzelMathHelper', () => {
  describe('average', () => {
    it('should return the average of two positive numbers', () => {
      expect(KritzelMathHelper.average(2, 4)).toBe(3);
    });

    it('should return the average of two negative numbers', () => {
      expect(KritzelMathHelper.average(-2, -4)).toBe(-3);
    });

    it('should return the average of a positive and a negative number', () => {
      expect(KritzelMathHelper.average(-2, 4)).toBe(1);
    });

    it('should return the average of a number and zero', () => {
      expect(KritzelMathHelper.average(0, 4)).toBe(2);
    });

    it('should return zero when averaging zero and zero', () => {
      expect(KritzelMathHelper.average(0, 0)).toBe(0);
    });
  });
});
