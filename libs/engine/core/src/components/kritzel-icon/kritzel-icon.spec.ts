jest.mock('@stencil/core', () => ({
  ...jest.requireActual('@stencil/core/internal/testing'),
  Component: () => (component: unknown) => component,
  Prop: () => () => {},
  forceUpdate: jest.fn(),
}));

import { forceUpdate } from '@stencil/core';
import { KritzelIconRegistry } from '../../classes/registries/icon-registry.class';
import { KritzelIcon } from './kritzel-icon';

describe('kritzel-icon', () => {
  let component: KritzelIcon;

  beforeEach(() => {
    jest.clearAllMocks();
    component = new KritzelIcon();
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

    KritzelIconRegistry.register('late-custom-icon', '<svg viewBox="0 0 24 24"><path d="M2 2L22 22"/></svg>');

    expect(forceUpdate).toHaveBeenCalledWith(component);
  });

  it('refreshes when an existing icon is replaced but ignores unrelated registrations', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    component.name = 'replace-custom-icon';
    KritzelIconRegistry.register(component.name, '<svg/>');
    component.connectedCallback();
    jest.mocked(forceUpdate).mockClear();

    KritzelIconRegistry.register('unrelated-custom-icon', '<svg/>');
    expect(forceUpdate).not.toHaveBeenCalled();

    KritzelIconRegistry.register(component.name, '<svg><path d="M1 1L2 2"/></svg>');
    expect(forceUpdate).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes on disconnect and refreshes after reconnecting', () => {
    component.name = 'reconnected-custom-icon';
    component.connectedCallback();
    component.disconnectedCallback();
    jest.mocked(forceUpdate).mockClear();

    KritzelIconRegistry.register(component.name, '<svg/>');
    expect(forceUpdate).not.toHaveBeenCalled();

    component.connectedCallback();
    expect(forceUpdate).toHaveBeenCalledWith(component);
  });

  it('uses the current icon name after a prop update', () => {
    component.name = 'previous-custom-icon';
    component.connectedCallback();
    component.name = 'next-custom-icon';
    jest.mocked(forceUpdate).mockClear();

    KritzelIconRegistry.register('previous-custom-icon', '<svg/>');
    expect(forceUpdate).not.toHaveBeenCalled();
    KritzelIconRegistry.register('next-custom-icon', '<svg/>');
    expect(forceUpdate).toHaveBeenCalledWith(component);
  });
});