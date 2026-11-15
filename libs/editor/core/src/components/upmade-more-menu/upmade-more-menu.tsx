import { Component, Host, h, Prop, State, Element, Event, EventEmitter, Watch, Method } from '@stencil/core';
import { UpmadeDevicesHelper } from '@upmade/core';
import { IUpmadeMenuItem } from '@upmade/core';
import { UpmadeTermKey } from '@upmade/core';

@Component({
  tag: 'upmade-more-menu',
  styleUrl: 'upmade-more-menu.css',
  shadow: true,
})
export class UpmadeMoreMenu {
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
  @Prop() items: IUpmadeMenuItem[] = [];

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
  @Prop() terms: Partial<Record<UpmadeTermKey, string>> = {};

  /**
   * Emitted when a menu item is selected
   */
  @Event() itemSelect: EventEmitter<{ item: IUpmadeMenuItem; parent: IUpmadeMenuItem }>;

  @State() menuAnchor: HTMLElement = null;
  @State() isTouchDevice: boolean = UpmadeDevicesHelper.isTouchDevice();
  @State() visibleItems: IUpmadeMenuItem[] = [];

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

    window.dispatchEvent(new CustomEvent('upmade-dismiss-menus'));
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

  private filterVisibleItemsSync(items: IUpmadeMenuItem[]): IUpmadeMenuItem[] {
    return items.reduce<IUpmadeMenuItem[]>((visibleItems, item) => {
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

  private async filterVisibleItems(items: IUpmadeMenuItem[]): Promise<IUpmadeMenuItem[]> {
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

    return resolved.filter((item): item is IUpmadeMenuItem => !!item);
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

  private resolveMenuLabels(items: IUpmadeMenuItem[]): IUpmadeMenuItem[] {
    return items.map(item => ({
      ...item,
      label: this.terms[item.label as UpmadeTermKey] ?? item.label,
      children: item.children ? this.resolveMenuLabels(item.children) : undefined,
    }));
  }

  private handleMenuItemSelect = (event: CustomEvent<{ item: IUpmadeMenuItem; parent: IUpmadeMenuItem }>): void => {
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
            <upmade-icon name={this.icon} size={this.iconSize}></upmade-icon>
          </button>

          <upmade-portal anchor={this.menuAnchor} offsetY={this.offsetY} onClose={this.closeMenu}>
            <upmade-menu
              items={this.resolveMenuLabels(this.visibleItems)}
              onItemSelect={this.handleMenuItemSelect}
            ></upmade-menu>
          </upmade-portal>
        </div>
      </Host>
    );
  }
}
