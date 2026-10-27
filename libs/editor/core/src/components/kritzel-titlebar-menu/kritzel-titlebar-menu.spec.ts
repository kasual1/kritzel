jest.mock('@stencil/core', () => ({
  ...jest.requireActual('@stencil/core/internal/testing'),
  Component: () => (cls: any) => cls,
  Prop: () => () => {},
  Event: () => () => {},
}));

import { KritzelTitlebarMenu } from './kritzel-titlebar-menu';

describe('KritzelTitlebarMenu', () => {
  let component: KritzelTitlebarMenu;

  const renderMenu = (): any => {
    const host: any = component.render();
    return host.$children$.find((child: any) => child.$tag$ === 'kritzel-menu');
  };

  beforeEach(() => {
    component = new KritzelTitlebarMenu();
    component.menuItemSelect = { emit: jest.fn() } as any;
  });

  it('passes the resolved menu items to kritzel-menu without their actions', () => {
    component.items = [
      { id: 'copy', label: 'Copy', icon: 'copy', isDisabled: false, action: jest.fn() },
      { id: 'lock', label: 'Lock', isDisabled: true },
    ];

    expect(renderMenu().$attrs$.items).toEqual([
      { id: 'copy', label: 'Copy', icon: 'copy', isDisabled: false },
      { id: 'lock', label: 'Lock', icon: undefined, isDisabled: true },
    ]);
  });

  it('reports the id of the selected menu item and stops the kritzel-menu event', () => {
    component.items = [{ id: 'copy', label: 'Copy' }];
    const event = { detail: { item: { id: 'copy' }, parent: null }, stopPropagation: jest.fn() };

    renderMenu().$attrs$.onItemSelect(event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(component.menuItemSelect.emit).toHaveBeenCalledWith('copy');
  });
});
