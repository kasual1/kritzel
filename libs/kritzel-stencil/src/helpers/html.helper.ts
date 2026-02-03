export class KritzelHTMLHelper {
 static getNumericValueFromStyle(element: HTMLElement, property: string): number {
   const value = window.getComputedStyle(element).getPropertyValue(property);
   return parseFloat(value) || 0;
 }

 static getScrollableParent(element: HTMLElement): HTMLElement | Window {
    if (!element) {
      return window;
    }

    const parent = ((element.parentNode as ShadowRoot)?.host as HTMLElement) ?? element.parentElement;

    if (!parent || parent.tagName === 'BODY') {
      return window;
    }

    const style = window.getComputedStyle(parent);
    if (style.overflow === 'auto' || style.overflowY === 'auto' || style.overflow === 'scroll' || style.overflowY === 'scroll') {
      return parent;
    }

    return this.getScrollableParent(parent);
  }

  static isElementInViewport(element: HTMLElement): boolean {
    if (!element) {
      return false;
    }

    const scrollableParent = this.getScrollableParent(element);
    const rect = element.getBoundingClientRect();

    if (scrollableParent === window) {
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

      return rect.top >= 0 && rect.left >= 0 && rect.bottom <= viewportHeight && rect.right <= viewportWidth;
    }

    const parentRect = (scrollableParent as HTMLElement).getBoundingClientRect();

    return rect.top >= parentRect.top && rect.left >= parentRect.left && rect.bottom <= parentRect.bottom && rect.right <= parentRect.right;
  }

  static getFocusableElements(root: HTMLElement): HTMLElement[] {
      if (!root) return [];
  
      const focusableElements: HTMLElement[] = [];
      const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), details, [tabindex]:not([tabindex="-1"])';
  
      const isVisible = (el: HTMLElement) => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      };
  
      const find = (element: Element) => {
        // Check if the element itself is focusable
        if (element instanceof HTMLElement && element.matches(focusableSelector) && !element.hasAttribute('disabled') && isVisible(element)) {
          focusableElements.push(element);
        }
  
        // Traverse shadow DOM
        if (element.shadowRoot) {
          Array.from(element.shadowRoot.children).forEach(find);
        }
  
        // Traverse slotted content
        if (element.tagName === 'SLOT') {
          (element as HTMLSlotElement).assignedElements({ flatten: true }).forEach(find);
        }
  
        // Traverse light DOM children if there is no shadow root
        if (!element.shadowRoot) {
          Array.from(element.children).forEach(find);
        }
      };
  
      find(root);
  
      return focusableElements;
    }
}