import { Component, Host, h, Prop, State, Element, Event, EventEmitter, Watch, Method } from '@stencil/core';
import { KritzelDevicesHelper } from '@kritzel/engine';
import { IKritzelMenuItem } from '@kritzel/engine';
import { KritzelTermKey } from '@kritzel/engine';

@Component({
  tag: 'kritzel-more-menu',
  styleUrl: 'kritzel-more-menu.css',
  shadow: true,
})
export class KritzelMoreMenu {
  @Element() host!: HTMLElement;

  /**
   * Whether the menu button is visible
   */
  @Prop() visible: boolean = false;

  /**
   * The menu items to display in the dropdown.
   * Items with `isVisible` set to `false` will be filtered out.
   * Items with an `action` will have that action invoked on selection.
   */
  @Prop() items: IKritzelMenuItem[] = [];

  /**
   * The icon to display on the button
   */
  @Prop() icon: string = 'ellipsisVertical';

  /**
   * The size of the icon
   */
  @Prop() iconSize: number = 24;

  /**
   * Offset Y for the portal positioning
   */
  @Prop() offsetY: number = 4;

  /** Resolved localized strings keyed by term key, supplied by the editor. */
  @Prop() terms: Partial<Record<KritzelTermKey, string>> = {};

  /**
   * Emitted when a menu item is selected
   */
  @Event() itemSelect: EventEmitter<{ item: IKritzelMenuItem; parent: IKritzelMenuItem }>;

  @State() menuAnchor: HTMLElement = null;
  @State() isTouchDevice: boolean = KritzelDevicesHelper.isTouchDevice();
  @State() visibleItems: IKritzelMenuItem[] = [];

  private visibilityResolveVersion = 0;

  @Watch('items')
  onItemsChange() {
    void this.resolveVisibleItems();
  }

  @Method()
  async open(): Promise<void> {
    if (!this.visible || this.menuAnchor) {
      return;
    }

    window.dispatchEvent(new CustomEvent('kritzel-dismiss-menus'));
    this.menuAnchor = this.host;
    this.visibleItems = this.filterVisibleItemsSync(this.items ?? []);
    await this.resolveVisibleItems();
  }

  @Method()
  async close(): Promise<void> {
    this.closeMenu();
  }

  componentWillLoad() {
    void this.resolveVisibleItems();
  }

  private toggleMenu = (event: MouseEvent): void => {
    event.stopPropagation();
    if (this.menuAnchor) {
      this.closeMenu();
    } else {
      void this.open();
    }
  };

  private closeMenu = (): void => {
    this.menuAnchor = null;
  };

  private async evaluateVisibility(visibility?: boolean | (() => boolean | Promise<boolean>)): Promise<boolean> {
    if (typeof visibility === 'function') {
      try {
        return (await visibility()) !== false;
      } catch {
        return false;
      }
    }

    return visibility !== false;
  }

  private evaluateVisibilitySync(visibility?: boolean | (() => boolean | Promise<boolean>)): boolean | null {
    if (typeof visibility === 'function') {
      try {
        const result = visibility();
        return result instanceof Promise ? null : result !== false;
      } catch {
        return false;
      }
    }

    return visibility !== false;
  }

  private filterVisibleItemsSync(items: IKritzelMenuItem[]): IKritzelMenuItem[] {
    return items.reduce<IKritzelMenuItem[]>((visibleItems, item) => {
      const isVisible = this.evaluateVisibilitySync(item.isVisible);
      if (isVisible === null || !isVisible) {
        return visibleItems;
      }

      if (!item.children?.length) {
        visibleItems.push(item);
        return visibleItems;
      }

      visibleItems.push({
        ...item,
        children: this.filterVisibleItemsSync(item.children),
      });

      return visibleItems;
    }, []);
  }

  private async filterVisibleItems(items: IKritzelMenuItem[]): Promise<IKritzelMenuItem[]> {
    const resolved = await Promise.all(
      items.map(async item => {
        const isVisible = await this.evaluateVisibility(item.isVisible);
        if (!isVisible) {
          return null;
        }

        if (!item.children?.length) {
          return item;
        }

        return {
          ...item,
          children: await this.filterVisibleItems(item.children),
        };
      }),
    );

    return resolved.filter((item): item is IKritzelMenuItem => !!item);
  }

  private async resolveVisibleItems(): Promise<void> {
    const version = ++this.visibilityResolveVersion;
    const items = this.items ?? [];
    const resolvedItems = await this.filterVisibleItems(items);

    if (version !== this.visibilityResolveVersion) {
      return;
    }

    this.visibleItems = resolvedItems;
  }

  private resolveMenuLabels(items: IKritzelMenuItem[]): IKritzelMenuItem[] {
    return items.map(item => ({
      ...item,
      label: this.terms[item.label as KritzelTermKey] ?? item.label,
      children: item.children ? this.resolveMenuLabels(item.children) : undefined,
    }));
  }

  private handleMenuItemSelect = (event: CustomEvent<{ item: IKritzelMenuItem; parent: IKritzelMenuItem }>): void => {
    const { item, parent } = event.detail;

    if (item.action) {
      item.action(item, parent);
    }
    this.itemSelect.emit(event.detail);
    this.closeMenu();
  };

  render() {
    return (
      <Host class={{ mobile: this.isTouchDevice }} style={{ display: this.visible ? '' : 'none' }}>
        <div class={{ 'more-menu-wrapper': true, visible: this.visible }}>
          <button
            class="more-menu-button"
            data-testid="more-menu-button"
            onClick={this.toggleMenu}
            aria-label={this.terms['moreMenu.ariaLabel'] ?? 'More options'}
          >
            <kritzel-icon name={this.icon} size={this.iconSize}></kritzel-icon>
          </button>

          <kritzel-portal anchor={this.menuAnchor} offsetY={this.offsetY} onClose={this.closeMenu}>
            <kritzel-menu
              items={this.resolveMenuLabels(this.visibleItems)}
              onItemSelect={this.handleMenuItemSelect}
            ></kritzel-menu>
          </kritzel-portal>
        </div>
      </Host>
    );
  }
}
