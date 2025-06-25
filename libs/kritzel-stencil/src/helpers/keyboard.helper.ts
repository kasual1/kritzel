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
}
