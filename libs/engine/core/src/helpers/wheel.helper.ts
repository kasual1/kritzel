import { KritzelDynamicObject } from '../classes/objects/dynamic-object.class';

export class KritzelWheelHelper {
  public static shouldKeepWheelInDynamicObject(ev: WheelEvent, dynamicObject: KritzelDynamicObject): boolean {
    // Keep Ctrl+wheel available for viewport zoom gestures.
    if (ev.ctrlKey || dynamicObject.isSelected !== true) {
      return false;
    }

    const path = typeof ev.composedPath === 'function' ? (ev.composedPath() as EventTarget[]) : [];
    const scrollContainer = this.getScrollableContainerFromEventPath(path, dynamicObject);

    // No scroll container found inside the dynamic object: let the wheel
    // event pass through so the viewport can continue handling it.
    if (!scrollContainer) {
      return false;
    }

    return this.canElementConsumeWheel(scrollContainer, ev.deltaX, ev.deltaY);
  }

  private static getScrollableContainerFromEventPath(path: EventTarget[], dynamicObject: KritzelDynamicObject): HTMLElement | null {
    const potentialRoots: HTMLElement[] = [];

    if (dynamicObject.element instanceof HTMLElement) {
      potentialRoots.push(dynamicObject.element);
    }

    if (dynamicObject.elementRef instanceof HTMLElement) {
      potentialRoots.push(dynamicObject.elementRef);
    }

    const legacyElementRef = (dynamicObject as KritzelDynamicObject & { elmeentRef?: HTMLElement }).elmeentRef;
    if (legacyElementRef instanceof HTMLElement) {
      potentialRoots.push(legacyElementRef);
    }

    for (const root of potentialRoots) {
      const rootIndex = path.findIndex(entry => entry === root);
      if (rootIndex === -1) {
        continue;
      }

      for (const entry of path.slice(0, rootIndex + 1)) {
        if (!(entry instanceof HTMLElement)) {
          continue;
        }

        if (this.isScrollableElement(entry)) {
          return entry;
        }
      }
    }

    // Fallback for synthetic/custom wheel events where composedPath is absent
    // or does not include the dynamic-object subtree.
    for (const root of potentialRoots) {
      if (this.isScrollableElement(root)) {
        return root;
      }

      const firstChild = root.firstElementChild;
      if (firstChild instanceof HTMLElement && this.isScrollableElement(firstChild)) {
        return firstChild;
      }
    }

    return null;
  }

  private static isScrollableElement(element: HTMLElement): boolean {
    const canScrollVertically = element.scrollHeight - element.clientHeight > 0;
    const canScrollHorizontally = element.scrollWidth - element.clientWidth > 0;
    if (!canScrollVertically && !canScrollHorizontally) {
      return false;
    }

    const computedStyle = window.getComputedStyle(element);
    const overflowX = computedStyle.overflowX;
    const overflowY = computedStyle.overflowY;
    const allowsVerticalScroll = overflowY !== 'visible' && overflowY !== 'clip';
    const allowsHorizontalScroll = overflowX !== 'visible' && overflowX !== 'clip';

    return (canScrollVertically && allowsVerticalScroll) || (canScrollHorizontally && allowsHorizontalScroll);
  }

  private static canElementConsumeWheel(element: HTMLElement, deltaX: number, deltaY: number): boolean {
    const canConsumeVertical = this.canElementConsumeVerticalWheel(element, deltaY);
    const canConsumeHorizontal = this.canElementConsumeHorizontalWheel(element, deltaX);

    // Keep wheel events inside the dynamic object whenever at least one
    // requested axis can still be consumed by its scroll container.
    return canConsumeVertical || canConsumeHorizontal;
  }

  private static canElementConsumeVerticalWheel(element: HTMLElement, deltaY: number): boolean {
    if (deltaY === 0) {
      return false;
    }

    const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight);
    if (maxScrollTop === 0) {
      return false;
    }

    const epsilon = 1;
    const scrollingDown = deltaY > 0;
    const scrollingUp = deltaY < 0;

    if (scrollingDown) {
      return element.scrollTop < maxScrollTop - epsilon;
    }

    if (scrollingUp) {
      return element.scrollTop > epsilon;
    }

    return false;
  }

  private static canElementConsumeHorizontalWheel(element: HTMLElement, deltaX: number): boolean {
    if (deltaX === 0) {
      return false;
    }

    const maxScrollLeft = Math.max(0, element.scrollWidth - element.clientWidth);
    if (maxScrollLeft === 0) {
      return false;
    }

    const epsilon = 1;
    const scrollingRight = deltaX > 0;
    const scrollingLeft = deltaX < 0;

    if (scrollingRight) {
      return element.scrollLeft < maxScrollLeft - epsilon;
    }

    if (scrollingLeft) {
      return element.scrollLeft > epsilon;
    }

    return false;
  }
}