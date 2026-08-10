import { KritzelMoreMenu } from './kritzel-more-menu';

jest.mock('@stencil/core', () => ({
  ...jest.requireActual('@stencil/core/internal/testing'),
  Component: () => (cls: any) => cls,
  Prop: () => () => {},
  State: () => () => {},
  Watch: () => () => {},
  Event: () => () => {},
  Element: () => () => {},
}));

describe('KritzelMoreMenu', () => {
  let component: KritzelMoreMenu;

  beforeEach(() => {
    component = new KritzelMoreMenu();
    component.host = document.createElement('div');
  });

  it('re-evaluates item visibility when opening with unchanged item references', async () => {
    let hasRemoteProvider = false;

    component.items = [
      {
        id: 'share',
        label: 'menu.share',
        isVisible: () => hasRemoteProvider,
      } as any,
    ];

    await (component as any).resolveVisibleItems();
    expect((component as any).visibleItems).toHaveLength(0);

    hasRemoteProvider = true;

    (component as any).toggleMenu({
      stopPropagation: jest.fn(),
    } as unknown as MouseEvent);

    await Promise.resolve();

    expect((component as any).visibleItems).toHaveLength(1);
    expect((component as any).visibleItems[0].id).toBe('share');
  });
});
