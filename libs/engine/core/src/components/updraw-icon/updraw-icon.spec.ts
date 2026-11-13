jest.mock('@stencil/core', () => ({
  ...jest.requireActual('@stencil/core/internal/testing'),
  Component: () => (component: unknown) => component,
  Prop: () => () => {},
  forceUpdate: jest.fn(),
}));

import { forceUpdate } from '@stencil/core';
import { UpdrawIconRegistry } from '@updraw/core';
import { UpdrawIcon } from './updraw-icon';

describe('updraw-icon', () => {
  let component: UpdrawIcon;

  beforeEach(() => {
    jest.clearAllMocks();
    component = new UpdrawIcon();
  });

  afterEach(() => {
    component.disconnectedCallback();
    jest.restoreAllMocks();
  });

  it('refreshes an icon registered after the component has mounted', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    component.name = 'late-custom-icon';
    component.connectedCallback();
    component.render();
    jest.mocked(forceUpdate).mockClear();

    UpdrawIconRegistry.register('late-custom-icon', '<svg viewBox="0 0 24 24"><path d="M2 2L22 22"/></svg>');

    expect(forceUpdate).toHaveBeenCalledWith(component);
  });

  it('refreshes when an existing icon is replaced but ignores unrelated registrations', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    component.name = 'replace-custom-icon';
    UpdrawIconRegistry.register(component.name, '<svg/>');
    component.connectedCallback();
    jest.mocked(forceUpdate).mockClear();

    UpdrawIconRegistry.register('unrelated-custom-icon', '<svg/>');
    expect(forceUpdate).not.toHaveBeenCalled();

    UpdrawIconRegistry.register(component.name, '<svg><path d="M1 1L2 2"/></svg>');
    expect(forceUpdate).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes on disconnect and refreshes after reconnecting', () => {
    component.name = 'reconnected-custom-icon';
    component.connectedCallback();
    component.disconnectedCallback();
    jest.mocked(forceUpdate).mockClear();

    UpdrawIconRegistry.register(component.name, '<svg/>');
    expect(forceUpdate).not.toHaveBeenCalled();

    component.connectedCallback();
    expect(forceUpdate).toHaveBeenCalledWith(component);
  });

  it('uses the current icon name after a prop update', () => {
    component.name = 'previous-custom-icon';
    component.connectedCallback();
    component.name = 'next-custom-icon';
    jest.mocked(forceUpdate).mockClear();

    UpdrawIconRegistry.register('previous-custom-icon', '<svg/>');
    expect(forceUpdate).not.toHaveBeenCalled();
    UpdrawIconRegistry.register('next-custom-icon', '<svg/>');
    expect(forceUpdate).toHaveBeenCalledWith(component);
  });
});