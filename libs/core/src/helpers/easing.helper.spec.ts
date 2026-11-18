import { UpmadeEasingHelper } from './easing.helper';

describe('UpmadeEasingHelper', () => {
  const curves = [UpmadeEasingHelper.linear, UpmadeEasingHelper.easeInCubic, UpmadeEasingHelper.easeOutCubic, UpmadeEasingHelper.easeInOutCubic];

  it('should map 0 to 0 and 1 to 1 for all curves', () => {
    for (const curve of curves) {
      expect(curve(0)).toBeCloseTo(0);
      expect(curve(1)).toBeCloseTo(1);
    }
  });

  it('should be symmetric at the midpoint for ease-in-out', () => {
    expect(UpmadeEasingHelper.easeInOutCubic(0.5)).toBeCloseTo(0.5);
  });

  it('should resolve named easings', () => {
    expect(UpmadeEasingHelper.resolve('linear')).toBe(UpmadeEasingHelper.linear);
    expect(UpmadeEasingHelper.resolve('ease-in')).toBe(UpmadeEasingHelper.easeInCubic);
    expect(UpmadeEasingHelper.resolve('ease-out')).toBe(UpmadeEasingHelper.easeOutCubic);
    expect(UpmadeEasingHelper.resolve('ease-in-out')).toBe(UpmadeEasingHelper.easeInOutCubic);
  });

  it('should default to ease-in-out', () => {
    expect(UpmadeEasingHelper.resolve(undefined)).toBe(UpmadeEasingHelper.easeInOutCubic);
  });

  it('should pass through custom easing functions', () => {
    const custom = (t: number) => t * t;
    expect(UpmadeEasingHelper.resolve(custom)).toBe(custom);
  });
});
