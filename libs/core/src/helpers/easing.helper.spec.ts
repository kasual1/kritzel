import { KritzelEasingHelper } from './easing.helper';

describe('KritzelEasingHelper', () => {
  const curves = [KritzelEasingHelper.linear, KritzelEasingHelper.easeInCubic, KritzelEasingHelper.easeOutCubic, KritzelEasingHelper.easeInOutCubic];

  it('should map 0 to 0 and 1 to 1 for all curves', () => {
    for (const curve of curves) {
      expect(curve(0)).toBeCloseTo(0);
      expect(curve(1)).toBeCloseTo(1);
    }
  });

  it('should be symmetric at the midpoint for ease-in-out', () => {
    expect(KritzelEasingHelper.easeInOutCubic(0.5)).toBeCloseTo(0.5);
  });

  it('should resolve named easings', () => {
    expect(KritzelEasingHelper.resolve('linear')).toBe(KritzelEasingHelper.linear);
    expect(KritzelEasingHelper.resolve('ease-in')).toBe(KritzelEasingHelper.easeInCubic);
    expect(KritzelEasingHelper.resolve('ease-out')).toBe(KritzelEasingHelper.easeOutCubic);
    expect(KritzelEasingHelper.resolve('ease-in-out')).toBe(KritzelEasingHelper.easeInOutCubic);
  });

  it('should default to ease-in-out', () => {
    expect(KritzelEasingHelper.resolve(undefined)).toBe(KritzelEasingHelper.easeInOutCubic);
  });

  it('should pass through custom easing functions', () => {
    const custom = (t: number) => t * t;
    expect(KritzelEasingHelper.resolve(custom)).toBe(custom);
  });
});
