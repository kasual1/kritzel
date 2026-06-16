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
});
