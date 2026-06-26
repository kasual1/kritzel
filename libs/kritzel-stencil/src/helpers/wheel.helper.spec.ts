import { KritzelWheelHelper } from './wheel.helper';

describe('KritzelWheelHelper', () => {
  const createWheelEvent = (overrides: Partial<WheelEvent> = {}): WheelEvent =>
    ({
      ctrlKey: false,
      deltaX: 0,
      deltaY: 0,
      composedPath: () => [],
      ...overrides,
    }) as WheelEvent;

  it('returns false for Ctrl+wheel', () => {
    const customElement = { isSelected: true } as any;

    const result = KritzelWheelHelper.shouldKeepWheelInCustomElement(createWheelEvent({ ctrlKey: true }), customElement);

    expect(result).toBe(false);
  });

  it('returns false for non-selected custom elements', () => {
    const customElement = { isSelected: false } as any;

    const result = KritzelWheelHelper.shouldKeepWheelInCustomElement(createWheelEvent({ deltaY: 10 }), customElement);

    expect(result).toBe(false);
  });

  it('returns true when no scroll container is found', () => {
    const root = document.createElement('div');
    const customElement = { isSelected: true, elementRef: root } as any;

    const result = KritzelWheelHelper.shouldKeepWheelInCustomElement(
      createWheelEvent({
        deltaY: 10,
        composedPath: () => [document.createElement('div')],
      }),
      customElement,
    );

    expect(result).toBe(true);
  });

  it('keeps wheel inside while vertical scroll can continue downward', () => {
    const scrollHost = document.createElement('div');
    scrollHost.style.overflowY = 'auto';
    Object.defineProperty(scrollHost, 'scrollHeight', { value: 300, configurable: true });
    Object.defineProperty(scrollHost, 'clientHeight', { value: 100, configurable: true });
    scrollHost.scrollTop = 50;

    const root = document.createElement('div');
    root.appendChild(scrollHost);

    const customElement = { isSelected: true, elementRef: root } as any;

    const result = KritzelWheelHelper.shouldKeepWheelInCustomElement(
      createWheelEvent({
        deltaY: 10,
        composedPath: () => [scrollHost, root],
      }),
      customElement,
    );

    expect(result).toBe(true);
  });

  it('releases wheel when vertical scroll is at bottom edge', () => {
    const scrollHost = document.createElement('div');
    scrollHost.style.overflowY = 'auto';
    Object.defineProperty(scrollHost, 'scrollHeight', { value: 300, configurable: true });
    Object.defineProperty(scrollHost, 'clientHeight', { value: 100, configurable: true });
    scrollHost.scrollTop = 200;

    const root = document.createElement('div');
    root.appendChild(scrollHost);

    const customElement = { isSelected: true, elementRef: root } as any;

    const result = KritzelWheelHelper.shouldKeepWheelInCustomElement(
      createWheelEvent({
        deltaY: 10,
        composedPath: () => [scrollHost, root],
      }),
      customElement,
    );

    expect(result).toBe(false);
  });

  it('keeps wheel inside while horizontal scroll can continue right', () => {
    const scrollHost = document.createElement('div');
    scrollHost.style.overflowX = 'auto';
    Object.defineProperty(scrollHost, 'scrollWidth', { value: 300, configurable: true });
    Object.defineProperty(scrollHost, 'clientWidth', { value: 100, configurable: true });
    scrollHost.scrollLeft = 20;

    const root = document.createElement('div');
    root.appendChild(scrollHost);

    const customElement = { isSelected: true, elementRef: root } as any;

    const result = KritzelWheelHelper.shouldKeepWheelInCustomElement(
      createWheelEvent({
        deltaX: 10,
        composedPath: () => [scrollHost, root],
      }),
      customElement,
    );

    expect(result).toBe(true);
  });

  it('releases wheel when horizontal scroll is at right edge', () => {
    const scrollHost = document.createElement('div');
    scrollHost.style.overflowX = 'auto';
    Object.defineProperty(scrollHost, 'scrollWidth', { value: 300, configurable: true });
    Object.defineProperty(scrollHost, 'clientWidth', { value: 100, configurable: true });
    scrollHost.scrollLeft = 200;

    const root = document.createElement('div');
    root.appendChild(scrollHost);

    const customElement = { isSelected: true, elementRef: root } as any;

    const result = KritzelWheelHelper.shouldKeepWheelInCustomElement(
      createWheelEvent({
        deltaX: 10,
        composedPath: () => [scrollHost, root],
      }),
      customElement,
    );

    expect(result).toBe(false);
  });
});
