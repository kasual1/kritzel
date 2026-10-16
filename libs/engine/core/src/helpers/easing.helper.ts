import { KritzelEasing } from '../interfaces/easing.interface';

export class KritzelEasingHelper {
  static linear(t: number): number {
    return t;
  }

  static easeInCubic(t: number): number {
    return t * t * t;
  }

  static easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  static easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Resolves a named easing or custom easing function to a function.
   * Unknown names fall back to `ease-in-out`.
   */
  static resolve(easing: KritzelEasing | undefined): (t: number) => number {
    if (typeof easing === 'function') {
      return easing;
    }
    switch (easing) {
      case 'linear':
        return KritzelEasingHelper.linear;
      case 'ease-in':
        return KritzelEasingHelper.easeInCubic;
      case 'ease-out':
        return KritzelEasingHelper.easeOutCubic;
      case 'ease-in-out':
      default:
        return KritzelEasingHelper.easeInOutCubic;
    }
  }
}
