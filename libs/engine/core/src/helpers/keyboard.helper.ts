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

  static onKeyboardVisibleChanged(callback: (isOpen: boolean) => void): () => void {
    if ('visualViewport' in window) {
      const VIEWPORT_VS_CLIENT_HEIGHT_RATIO = 0.75;
      const onResize = (event: Event) => {
        const target = event.target as VisualViewport;
        const isMobileDevice = KritzelDevicesHelper.isMobile();
        const isViewportReduced = (target.height * target.scale) / window.screen.height < VIEWPORT_VS_CLIENT_HEIGHT_RATIO;
        const isOpen = isMobileDevice && isViewportReduced;
        callback(isOpen);
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
