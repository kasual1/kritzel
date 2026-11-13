import { UpdrawEasingHelper } from './easing.helper';

describe('UpdrawEasingHelper', () => {
  const curves = [UpdrawEasingHelper.linear, UpdrawEasingHelper.easeInCubic, UpdrawEasingHelper.easeOutCubic, UpdrawEasingHelper.easeInOutCubic];

  it('should map 0 to 0 and 1 to 1 for all curves', () => {
    for (const curve of curves) {
      expect(curve(0)).toBeCloseTo(0);
      expect(curve(1)).toBeCloseTo(1);
    }
  });

  it('should be symmetric at the midpoint for ease-in-out', () => {
    expect(UpdrawEasingHelper.easeInOutCubic(0.5)).toBeCloseTo(0.5);
  });

  it('should resolve named easings', () => {
    expect(UpdrawEasingHelper.resolve('linear')).toBe(UpdrawEasingHelper.linear);
    expect(UpdrawEasingHelper.resolve('ease-in')).toBe(UpdrawEasingHelper.easeInCubic);
    expect(UpdrawEasingHelper.resolve('ease-out')).toBe(UpdrawEasingHelper.easeOutCubic);
    expect(UpdrawEasingHelper.resolve('ease-in-out')).toBe(UpdrawEasingHelper.easeInOutCubic);
  });

  it('should default to ease-in-out', () => {
    expect(UpdrawEasingHelper.resolve(undefined)).toBe(UpdrawEasingHelper.easeInOutCubic);
  });

  it('should pass through custom easing functions', () => {
    const custom = (t: number) => t * t;
    expect(UpdrawEasingHelper.resolve(custom)).toBe(custom);
  });
});
