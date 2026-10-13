export class KritzelDevicesHelper {
  static isTouchDevice(): boolean {
    return window.matchMedia('(any-pointer: coarse)').matches;
  }

  static isAndroid(): boolean {
    return /android/i.test(navigator.userAgent);
  }

  static isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || this.isIPadOS();
  }

  /**
   * Detects iPadOS 13+, whose Safari reports a desktop Mac user agent.
   * Desktop Macs have no touch points, so a "Macintosh" user agent with touch support is an iPad.
   */
  static isIPadOS(): boolean {
    return /Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1;
  }

  static detectOS(): 'iOS' | 'Android' | 'Other' {
    if (this.isIOS()) {
      return 'iOS';
    } else if (this.isAndroid()) {
      return 'Android';
    } else {
      return 'Other';
    }
  }

  static isMobile(): boolean {
    return this.isIOS() || this.isAndroid();
  }

  static isFirefox(): boolean {
    return /firefox/i.test(navigator.userAgent);
  }
}
