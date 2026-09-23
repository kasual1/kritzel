import { KritzelKeyboardHelper } from './keyboard.helper';

describe('KritzelKeyboardHelper', () => {
  // Set up and tear down for meta tags
  let viewportMeta: HTMLMetaElement | null;

  beforeEach(() => {
    // Clear any existing meta tags
    document.head.innerHTML = '';
    viewportMeta = null;
  });

  // Tests for forceHideKeyboard
  describe('forceHideKeyboard', () => {
    it('should call blur on the active element', () => {
      jest.useFakeTimers();
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      requestAnimationFrame(() => {
        const blurSpy = jest.spyOn(input, 'blur');
        KritzelKeyboardHelper.forceHideKeyboard();

        expect(blurSpy).toHaveBeenCalledTimes(1);
        expect(document.activeElement).not.toBe(input);

        document.body.removeChild(input);
        blurSpy.mockRestore();
        jest.useRealTimers();
      });
    });

    it('should do nothing if no element is focused', () => {
      // Ensure no element is focused
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      const activeElementBefore = document.activeElement;
      KritzelKeyboardHelper.forceHideKeyboard();
      expect(document.activeElement).toBe(activeElementBefore);
    });
  });

  // Tests for enableInteractiveWidget
  describe('enableInteractiveWidget', () => {
    it('should add interactive-widget if meta tag exists but lacks the property', () => {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      viewportMeta.content = 'width=device-width, initial-scale=1.0';
      document.head.appendChild(viewportMeta);

      requestAnimationFrame(() => {
        KritzelKeyboardHelper.enableInteractiveWidget();
        expect(viewportMeta!.content).toContain('interactive-widget=resizes-content');
      });
    });

    it('should not add interactive-widget if it already exists', () => {
      const initialContent = 'width=device-width, interactive-widget=resizes-content';
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      viewportMeta.content = initialContent;
      document.head.appendChild(viewportMeta);

      KritzelKeyboardHelper.enableInteractiveWidget();
      expect(viewportMeta.content).toBe(initialContent);
    });

    it('should do nothing if no viewport meta tag is found', () => {
      KritzelKeyboardHelper.enableInteractiveWidget();
      const meta = document.querySelector('meta[name="viewport"]');
      expect(meta).toBeNull();
    });
  });

  // Tests for disableInteractiveWidget
  describe('disableInteractiveWidget', () => {
    it('should remove interactive-widget from the meta tag content', () => {
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      viewportMeta.setAttribute('content', 'width=device-width, interactive-widget=resizes-content, initial-scale=1.0');
      document.head.appendChild(viewportMeta);

      KritzelKeyboardHelper.disableInteractiveWidget();
      expect(viewportMeta.getAttribute('content')).not.toContain('interactive-widget=resizes-content');
      expect(viewportMeta.getAttribute('content')).toBe('width=device-width, initial-scale=1.0');
    });

    it('should handle various spacings and positions of the property', () => {
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      viewportMeta.setAttribute('content', 'interactive-widget=resizes-content, width=device-width');
      document.head.appendChild(viewportMeta);

      KritzelKeyboardHelper.disableInteractiveWidget();
      expect(viewportMeta.getAttribute('content')).toBe('width=device-width');
    });

    it('should do nothing if the property does not exist', () => {
      const initialContent = 'width=device-width, initial-scale=1.0';
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      viewportMeta.content = initialContent;
      document.head.appendChild(viewportMeta);

      KritzelKeyboardHelper.disableInteractiveWidget();
      expect(viewportMeta.content).toBe(initialContent);
    });

    it('should handle the property being the only content', () => {
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      viewportMeta.setAttribute('content', 'interactive-widget=resizes-content');
      document.head.appendChild(viewportMeta);

      KritzelKeyboardHelper.disableInteractiveWidget();
      expect(viewportMeta.getAttribute('content')).toBe('');
    });
  });
});
