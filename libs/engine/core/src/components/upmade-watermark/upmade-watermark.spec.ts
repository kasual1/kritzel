jest.mock('@stencil/core', () => ({
  ...jest.requireActual('@stencil/core/internal/testing'),
  Component: () => (cls: any) => cls,
  Prop: () => () => {},
}));

import { UpmadeWatermark } from './upmade-watermark';
import { UpmadeCore, UPMADE_WEBSITE_URL } from '@upmade/core';

describe('UpmadeWatermark', () => {
  let component: UpmadeWatermark;
  let translate: jest.Mock;

  beforeEach(() => {
    translate = jest.fn().mockReturnValue('Powered by Upmade');

    component = new UpmadeWatermark();
    component.core = {
      localizationManager: {
        translate,
      },
    } as unknown as UpmadeCore;
  });

  it('should resolve the localized "Powered by Upmade" term', () => {
    component.render();

    expect(translate).toHaveBeenCalledWith('watermark.poweredBy');
  });

  it('should prefer the resolved label prop over resolving from core', () => {
    component.label = 'Propulsé par Upmade';

    const vnode: any = component.render();
    const anchor = vnode.$children$[0];

    expect(anchor.$children$[0].$text$).toBe('Propulsé par Upmade');
    expect(translate).not.toHaveBeenCalled();
  });

  it('should reflect late label prop updates so locale changes apply immediately', () => {
    component.label = 'Powered by Upmade';
    let anchor: any = component.render().$children$[0];
    expect(anchor.$children$[0].$text$).toBe('Powered by Upmade');

    component.label = 'Mit Upmade erstellt';
    anchor = component.render().$children$[0];
    expect(anchor.$children$[0].$text$).toBe('Mit Upmade erstellt');
  });

  it('should render a link to the Upmade website opening in a new tab', () => {
    const vnode: any = component.render();

    const anchor = vnode.$children$[0];
    expect(anchor.$tag$).toBe('a');
    expect(anchor.$attrs$.href).toBe(UPMADE_WEBSITE_URL);
    expect(anchor.$attrs$.target).toBe('_blank');
    expect(anchor.$attrs$.rel).toBe('noopener noreferrer');
  });

  it('should render the resolved label as the link text', () => {
    translate.mockReturnValue('Propulsé par Upmade');

    const vnode: any = component.render();
    const anchor = vnode.$children$[0];

    expect(anchor.$children$[0].$text$).toBe('Propulsé par Upmade');
  });

  it('should stop pointer events from reaching the engine so the link click is not suppressed', () => {
    const vnode: any = component.render();
    const anchor = vnode.$children$[0];

    const pointerDownEvent = { stopPropagation: jest.fn() } as unknown as PointerEvent;
    const pointerUpEvent = { stopPropagation: jest.fn() } as unknown as PointerEvent;

    anchor.$attrs$.onPointerDown(pointerDownEvent);
    anchor.$attrs$.onPointerUp(pointerUpEvent);

    expect(pointerDownEvent.stopPropagation).toHaveBeenCalled();
    expect(pointerUpEvent.stopPropagation).toHaveBeenCalled();
  });
});
