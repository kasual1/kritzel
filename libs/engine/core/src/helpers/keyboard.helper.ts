import { KritzelDevicesHelper } from './devices.helper';

export class KritzelKeyboardHelper {
  static forceHideKeyboard(): void {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  static enableInteractiveWidget(): void {
    const meta = document.querySelector('meta[name="viewport"][content*="interactive-widget=resizes-content"]');
    if (meta) {
      let currentContent = meta.getAttribute('content');
      if (!currentContent?.includes('interactive-widget=resizes-content')) {
        currentContent += ', interactive-widget=resizes-content';
      }

      if (currentContent) {
        meta.setAttribute('content', currentContent);
      }
    }
  }

  static disableInteractiveWidget(): void {
    const meta = document.querySelector('meta[name="viewport"][content*="interactive-widget=resizes-content"]');
    if (meta) {
      let currentContent = meta.getAttribute('content');
      let newContent = currentContent?.replace(/\s*interactive-widget=resizes-content\s*[,;]?/g, '');
      if(newContent !== undefined){
        newContent = newContent
          .replace(/,(\s*,)+/g, ',')
          .replace(/^,/, '')
          .replace(/,$/, '')
          .trim();
  
  
        meta.setAttribute('content', newContent);
      }
    }
  }

  /** Ratio of visible height to full height below which the virtual keyboard is considered open. */
  private static readonly KEYBOARD_OPEN_HEIGHT_RATIO = 0.75;

  /**
   * Largest viewport height seen per viewport width, i.e. the height without a virtual keyboard.
   * Keyed by width so portrait and landscape keep separate baselines.
   */
  private static readonly viewportBaselineHeights = new Map<number, number>();

  /**
   * Records the current viewport height as the keyboard-free baseline for the current width,
   * if it is the largest seen so far. Called automatically by {@link isKeyboardOpen}; call it
   * early (before any keyboard can be open) so the first check has a reliable baseline.
   */
  static recordViewportBaseline(visualViewport: VisualViewport | null | undefined = window.visualViewport): void {
    if (!visualViewport) {
      return;
    }
    const key = Math.round(visualViewport.width);
    const height = Math.max(visualViewport.height * visualViewport.scale, window.innerHeight);
    const baseline = KritzelKeyboardHelper.viewportBaselineHeights.get(key) ?? 0;
    if (height > baseline) {
      KritzelKeyboardHelper.viewportBaselineHeights.set(key, height);
    }
  }

  /** Clears the recorded viewport baselines. */
  static resetViewportBaseline(): void {
    KritzelKeyboardHelper.viewportBaselineHeights.clear();
  }

  /**
   * Returns whether a virtual keyboard is currently open on a mobile device (iOS, iPadOS, Android).
   * Always returns false on other devices, regardless of their viewport size.
   * Compares the visible height to the keyboard-free height recorded for the same viewport width,
   * so it works in both portrait and landscape.
   */
  static isKeyboardOpen(visualViewport: VisualViewport | null | undefined = window.visualViewport): boolean {
    if (!visualViewport || !KritzelDevicesHelper.isMobile()) {
      return false;
    }
    KritzelKeyboardHelper.recordViewportBaseline(visualViewport);
    const baseline = KritzelKeyboardHelper.viewportBaselineHeights.get(Math.round(visualViewport.width));
    if (!baseline) {
      return false;
    }
    return (visualViewport.height * visualViewport.scale) / baseline < KritzelKeyboardHelper.KEYBOARD_OPEN_HEIGHT_RATIO;
  }

  static onKeyboardVisibleChanged(callback: (isOpen: boolean) => void): () => void {
    if ('visualViewport' in window) {
      const onResize = (event: Event) => {
        callback(KritzelKeyboardHelper.isKeyboardOpen(event.target as VisualViewport));
      };

      window.visualViewport?.addEventListener('resize', onResize);
      return () => window.visualViewport?.removeEventListener('resize', onResize);
    } else {
      // Fallback for older browsers does not provide a reliable event-based mechanism.
      console.warn('Listening for keyboard visibility changes is not reliably supported in this browser.');
      // Return a no-op cleanup function.
      return () => {};
    }
  }
}
