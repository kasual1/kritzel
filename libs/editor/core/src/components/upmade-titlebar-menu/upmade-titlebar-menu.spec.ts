jest.mock('@stencil/core', () => ({
  ...jest.requireActual('@stencil/core/internal/testing'),
  Component: () => (cls: any) => cls,
  Prop: () => () => {},
  Event: () => () => {},
}));

import { UpmadeTitlebarMenu } from './upmade-titlebar-menu';

describe('UpmadeTitlebarMenu', () => {
  let component: UpmadeTitlebarMenu;

  const renderMenu = (): any => {
    const host: any = component.render();
    return host.$children$.find((child: any) => child.$tag$ === 'upmade-menu');
  };

  beforeEach(() => {
    component = new UpmadeTitlebarMenu();
    component.menuItemSelect = { emit: jest.fn() } as any;
  });

  it('passes the resolved menu items to upmade-menu without their actions', () => {
    component.items = [
      { id: 'copy', label: 'Copy', icon: 'copy', isDisabled: false, action: jest.fn() },
      { id: 'lock', label: 'Lock', isDisabled: true },
    ];

    expect(renderMenu().$attrs$.items).toEqual([
      { id: 'copy', label: 'Copy', icon: 'copy', isDisabled: false },
      { id: 'lock', label: 'Lock', icon: undefined, isDisabled: true },
    ]);
  });

  it('reports the id of the selected menu item and stops the upmade-menu event', () => {
    component.items = [{ id: 'copy', label: 'Copy' }];
    const event = { detail: { item: { id: 'copy' }, parent: null }, stopPropagation: jest.fn() };

    renderMenu().$attrs$.onItemSelect(event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(component.menuItemSelect.emit).toHaveBeenCalledWith('copy');
  });
});
