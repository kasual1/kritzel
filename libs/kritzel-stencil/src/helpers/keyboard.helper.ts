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
      if (!currentContent.includes('interactive-widget=resizes-content')) {
        currentContent += ', interactive-widget=resizes-content';
      }
      meta.setAttribute('content', currentContent);
    }
  }

  static disableInteractiveWidget(): void {
    const meta = document.querySelector('meta[name="viewport"][content*="interactive-widget=resizes-content"]');
    if (meta) {
      let currentContent = meta.getAttribute('content');
      let newContent = currentContent.replace(/\s*interactive-widget=resizes-content\s*[,;]?/g, '');
      newContent = newContent
        .replace(/,(\s*,)+/g, ',')
        .replace(/^,/, '')
        .replace(/,$/, '')
        .trim();
      meta.setAttribute('content', newContent);
    }
  }

  private static isTextInputFocused(): boolean {
    const activeElement = document.activeElement;
    if (!activeElement) return false;

    // Check for standard text input elements
    if (activeElement instanceof HTMLInputElement) {
      const textTypes = ['text', 'password', 'email', 'number', 'search', 'tel', 'url'];
      return textTypes.includes(activeElement.type);
    }

    if (activeElement instanceof HTMLTextAreaElement) {
      return true;
    }

    // Check for contenteditable elements
    if (activeElement instanceof HTMLElement && activeElement.isContentEditable) {
      return true;
    }

    return false;
  }

  static onKeyboardVisibleChanged(callback: (isOpen: boolean) => void): () => void {
    const os = KritzelDevicesHelper.detectOS();
    if (os !== 'iOS' && os !== 'Android') {
      return () => {};
    }

    // Use VirtualKeyboard API if available (modern browsers)
    if ('virtualKeyboard' in navigator) {
      const vk = (navigator as Navigator & { virtualKeyboard: { overlaysContent: boolean; boundingRect: DOMRect; addEventListener: (type: string, listener: () => void) => void; removeEventListener: (type: string, listener: () => void) => void } }).virtualKeyboard;
      const onGeometryChange = () => {
        const isOpen = vk.boundingRect.height > 0;
        callback(isOpen);
      };
      vk.addEventListener('geometrychange', onGeometryChange);
      return () => vk.removeEventListener('geometrychange', onGeometryChange);
    }

    // Fallback: combine focus detection with viewport changes
    if ('visualViewport' in window) {
      const VIEWPORT_VS_CLIENT_HEIGHT_RATIO = 0.75;
      let initialHeight = window.visualViewport.height;

      const checkKeyboardState = () => {
        const viewportRatio = (window.visualViewport.height * window.visualViewport.scale) / initialHeight;
        const viewportShrunk = viewportRatio < VIEWPORT_VS_CLIENT_HEIGHT_RATIO;
        const isOpen = viewportShrunk && this.isTextInputFocused();
        callback(isOpen);
      };

      const onResize = () => {
        checkKeyboardState();
      };

      const onFocusIn = () => {
        // Update initial height when focus changes to capture pre-keyboard state
        if (!this.isTextInputFocused()) {
          initialHeight = window.visualViewport.height;
        }
        // Small delay to allow viewport to adjust
        setTimeout(checkKeyboardState, 100);
      };

      const onFocusOut = () => {
        // Keyboard closes when focus leaves text inputs
        setTimeout(() => {
          if (!this.isTextInputFocused()) {
            callback(false);
            // Reset initial height after keyboard closes
            setTimeout(() => {
              initialHeight = window.visualViewport.height;
            }, 300);
          }
        }, 100);
      };

      window.visualViewport.addEventListener('resize', onResize);
      document.addEventListener('focusin', onFocusIn);
      document.addEventListener('focusout', onFocusOut);

      return () => {
        window.visualViewport.removeEventListener('resize', onResize);
        document.removeEventListener('focusin', onFocusIn);
        document.removeEventListener('focusout', onFocusOut);
      };
    }

    return () => {};
  }
}
