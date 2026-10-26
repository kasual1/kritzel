import { vi } from 'vitest';
import { preventSwipeNavigation } from './swipe-navigation';

describe('preventSwipeNavigation', () => {
  let stop: () => void;

  beforeEach(() => {
    stop = preventSwipeNavigation();
  });

  afterEach(() => {
    stop();
    document.body.replaceChildren();
  });

  function swipe(target: Element, init: WheelEventInit = { deltaX: -40 }): WheelEvent {
    const event = new WheelEvent('wheel', { bubbles: true, composed: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    return event;
  }

  function scroller(overflowX: string, scrollLeft: number, scrollWidth = 300): HTMLElement {
    const element = document.createElement('div');
    // jsdom does not expand the overflow shorthand into computed longhands.
    element.style.overflowX = overflowX;
    Object.defineProperties(element, {
      clientWidth: { value: 100 },
      scrollWidth: { value: scrollWidth },
      scrollLeft: { value: scrollLeft },
    });
    return element;
  }

  it('cancels a swipe over the canvas', () => {
    const canvas = document.body.appendChild(document.createElement('div'));

    expect(swipe(canvas).defaultPrevented).toBe(true);
  });

  it('leaves a swipe to a scroll container that can still scroll that way', () => {
    const toolbar = document.body.appendChild(scroller('auto', 50));
    const button = toolbar.appendChild(document.createElement('button'));

    expect(swipe(button, { deltaX: -40 }).defaultPrevented).toBe(false);
    expect(swipe(button, { deltaX: 40 }).defaultPrevented).toBe(false);
  });

  it('cancels a swipe past the edge of a scroll container', () => {
    const atStart = document.body.appendChild(scroller('auto', 0));
    const atEnd = document.body.appendChild(scroller('auto', 200));

    expect(swipe(atStart, { deltaX: -40 }).defaultPrevented).toBe(true);
    expect(swipe(atEnd, { deltaX: 40 }).defaultPrevented).toBe(true);
  });

  it('cancels a swipe over content that is clipped rather than scrollable', () => {
    const clipped = document.body.appendChild(scroller('hidden', 50));

    expect(swipe(clipped).defaultPrevented).toBe(true);
  });

  it('finds scroll containers inside shadow roots', () => {
    const host = document.body.appendChild(document.createElement('div'));
    const panel = host.attachShadow({ mode: 'open' }).appendChild(scroller('scroll', 50));

    expect(swipe(panel).defaultPrevented).toBe(false);
  });

  it('leaves events that can no longer be cancelled alone', () => {
    const canvas = document.body.appendChild(document.createElement('div'));
    const event = new WheelEvent('wheel', { bubbles: true, cancelable: false, deltaX: -40 });
    const preventDefault = vi.spyOn(event, 'preventDefault');

    canvas.dispatchEvent(event);

    expect(preventDefault).not.toHaveBeenCalled();
  });
});
