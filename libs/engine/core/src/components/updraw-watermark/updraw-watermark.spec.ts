jest.mock('@stencil/core', () => ({
  ...jest.requireActual('@stencil/core/internal/testing'),
  Component: () => (cls: any) => cls,
  Prop: () => () => {},
}));

import { UpdrawWatermark } from './updraw-watermark';
import { UpdrawCore, UPDRAW_WEBSITE_URL } from '@updraw/core';

describe('UpdrawWatermark', () => {
  let component: UpdrawWatermark;
  let translate: jest.Mock;

  beforeEach(() => {
    translate = jest.fn().mockReturnValue('Powered by Updraw');

    component = new UpdrawWatermark();
    component.core = {
      localizationManager: {
        translate,
      },
    } as unknown as UpdrawCore;
  });

  it('should resolve the localized "Powered by Updraw" term', () => {
    component.render();

    expect(translate).toHaveBeenCalledWith('watermark.poweredBy');
  });

  it('should prefer the resolved label prop over resolving from core', () => {
    component.label = 'Propulsé par Updraw';

    const vnode: any = component.render();
    const anchor = vnode.$children$[0];

    expect(anchor.$children$[0].$text$).toBe('Propulsé par Updraw');
    expect(translate).not.toHaveBeenCalled();
  });

  it('should reflect late label prop updates so locale changes apply immediately', () => {
    component.label = 'Powered by Updraw';
    let anchor: any = component.render().$children$[0];
    expect(anchor.$children$[0].$text$).toBe('Powered by Updraw');

    component.label = 'Mit Updraw erstellt';
    anchor = component.render().$children$[0];
    expect(anchor.$children$[0].$text$).toBe('Mit Updraw erstellt');
  });

  it('should render a link to the Updraw website opening in a new tab', () => {
    const vnode: any = component.render();

    const anchor = vnode.$children$[0];
    expect(anchor.$tag$).toBe('a');
    expect(anchor.$attrs$.href).toBe(UPDRAW_WEBSITE_URL);
    expect(anchor.$attrs$.target).toBe('_blank');
    expect(anchor.$attrs$.rel).toBe('noopener noreferrer');
  });

  it('should render the resolved label as the link text', () => {
    translate.mockReturnValue('Propulsé par Updraw');

    const vnode: any = component.render();
    const anchor = vnode.$children$[0];

    expect(anchor.$children$[0].$text$).toBe('Propulsé par Updraw');
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
