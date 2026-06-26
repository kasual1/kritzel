import { KritzelCustomElement } from '../classes/objects/custom-element.class';

export class KritzelWheelHelper {
  public static shouldKeepWheelInCustomElement(ev: WheelEvent, customElement: KritzelCustomElement): boolean {
    // Keep Ctrl+wheel available for viewport zoom gestures.
    if (ev.ctrlKey || customElement.isSelected !== true) {
      return false;
    }

    const path = typeof ev.composedPath === 'function' ? (ev.composedPath() as EventTarget[]) : [];
    const scrollContainer = this.getScrollableContainerFromEventPath(path, customElement);

    // No scroll container found inside the custom element: preserve legacy
    // behavior and keep non-modified wheel input inside the element.
    if (!scrollContainer) {
      return true;
    }

    return this.canElementConsumeWheel(scrollContainer, ev.deltaX, ev.deltaY);
  }

  private static getScrollableContainerFromEventPath(path: EventTarget[], customElement: KritzelCustomElement): HTMLElement | null {
    const potentialRoots: HTMLElement[] = [];

    if (customElement.element instanceof HTMLElement) {
      potentialRoots.push(customElement.element);
    }

    if (customElement.elementRef instanceof HTMLElement) {
      potentialRoots.push(customElement.elementRef);
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

    // Keep wheel events inside the custom element whenever at least one
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