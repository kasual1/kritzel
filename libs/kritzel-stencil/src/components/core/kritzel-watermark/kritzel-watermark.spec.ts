jest.mock('@stencil/core', () => ({
  ...jest.requireActual('@stencil/core/internal/testing'),
  Component: () => (cls: any) => cls,
  Prop: () => () => {},
}));

import { KritzelWatermark } from './kritzel-watermark';
import { KritzelCore } from '../../../classes/core/core.class';
import { KRITZEL_WEBSITE_URL } from '../../../constants/engine.constants';

describe('KritzelWatermark', () => {
  let component: KritzelWatermark;
  let translate: jest.Mock;

  beforeEach(() => {
    translate = jest.fn().mockReturnValue('Powered by Kritzel');

    component = new KritzelWatermark();
    component.core = {
      localizationManager: {
        translate,
      },
    } as unknown as KritzelCore;
  });

  it('should resolve the localized "Powered by Kritzel" term', () => {
    component.render();

    expect(translate).toHaveBeenCalledWith('watermark.poweredBy');
  });

  it('should prefer the resolved label prop over resolving from core', () => {
    component.label = 'Propulsé par Kritzel';

    const vnode: any = component.render();
    const anchor = vnode.$children$[0];

    expect(anchor.$children$[0].$text$).toBe('Propulsé par Kritzel');
    expect(translate).not.toHaveBeenCalled();
  });

  it('should reflect late label prop updates so locale changes apply immediately', () => {
    component.label = 'Powered by Kritzel';
    let anchor: any = component.render().$children$[0];
    expect(anchor.$children$[0].$text$).toBe('Powered by Kritzel');

    component.label = 'Mit Kritzel erstellt';
    anchor = component.render().$children$[0];
    expect(anchor.$children$[0].$text$).toBe('Mit Kritzel erstellt');
  });

  it('should render a link to the Kritzel website opening in a new tab', () => {
    const vnode: any = component.render();

    const anchor = vnode.$children$[0];
    expect(anchor.$tag$).toBe('a');
    expect(anchor.$attrs$.href).toBe(KRITZEL_WEBSITE_URL);
    expect(anchor.$attrs$.target).toBe('_blank');
    expect(anchor.$attrs$.rel).toBe('noopener noreferrer');
  });

  it('should render the resolved label as the link text', () => {
    translate.mockReturnValue('Propulsé par Kritzel');

    const vnode: any = component.render();
    const anchor = vnode.$children$[0];

    expect(anchor.$children$[0].$text$).toBe('Propulsé par Kritzel');
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
