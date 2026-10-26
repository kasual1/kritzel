/**
 * Chrome turns a two-finger trackpad swipe that the page does not consume into a back/forward
 * navigation, and `overscroll-behavior` does not reliably stop it. The canvas engine listens to
 * wheel events passively, so it never consumes them.
 *
 * Chrome only lets the page cancel the first wheel event of a gesture: once that one goes through,
 * the rest of the gesture is dispatched with `cancelable: false` and can no longer be stopped. So
 * every wheel event that no scroll container on its path can take is cancelled. The engine still
 * pans from the event deltas, and scrollable panels keep scrolling natively.
 */
export function preventSwipeNavigation(): () => void {
  const onWheel = (event: WheelEvent) => {
    if (event.cancelable && !canScrollNatively(event)) {
      event.preventDefault();
    }
  };

  // Chrome makes wheel listeners on window passive unless told otherwise, which ignores preventDefault().
  window.addEventListener('wheel', onWheel, { capture: true, passive: false });
  return () => window.removeEventListener('wheel', onWheel, { capture: true });
}

function canScrollNatively(event: WheelEvent): boolean {
  return event
    .composedPath()
    .some((target) => target instanceof Element && canScroll(target, event.deltaX, event.deltaY));
}

function canScroll(element: Element, deltaX: number, deltaY: number): boolean {
  const canMoveX = canScrollBy(element.scrollLeft, element.scrollWidth - element.clientWidth, deltaX);
  const canMoveY = canScrollBy(element.scrollTop, element.scrollHeight - element.clientHeight, deltaY);
  if (!canMoveX && !canMoveY) {
    return false;
  }

  const { overflowX, overflowY } = getComputedStyle(element);
  return (canMoveX && isScrollable(overflowX)) || (canMoveY && isScrollable(overflowY));
}

function isScrollable(overflow: string): boolean {
  return overflow === 'auto' || overflow === 'scroll';
}

// Scroll positions can be fractional on zoomed or high-DPI screens, so keep a pixel off each edge.
function canScrollBy(position: number, maxPosition: number, delta: number): boolean {
  return delta < 0 ? position >= 1 : delta > 0 && position < maxPosition - 1;
}
