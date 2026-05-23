import { Component, Host, h, Prop, Event, EventEmitter, State, Watch, Listen, Element } from '@stencil/core';
import { ContextMenuItem } from '../../../interfaces/context-menu-item.interface';
import { KritzelBaseObject } from '../../../classes/objects/base-object.class';

interface ProcessedMenuItem {
  item: ContextMenuItem;
  isDisabled: boolean;
  processedChildren?: ProcessedMenuItem[];
}

const VIEWPORT_PADDING = 8;
const SUBMENU_DELAY = 150;
const ESTIMATED_SUBMENU_WIDTH = 160; // Estimated width for pre-calculation

@Component({
  tag: 'kritzel-context-menu',
  styleUrl: 'kritzel-context-menu.css',
  shadow: true,
})
export class KritzelContextMenu {
  @Element() host: HTMLElement;

  @Prop() items: ContextMenuItem[];
  @Watch('items')
  onItemsChanged() {
    this.updateMenuItems();
  }

  @Prop() objects: KritzelBaseObject[];

  @Event() actionSelected: EventEmitter<ContextMenuItem>;
  @Event() close: EventEmitter<void>;

  @State() private processedItems: ProcessedMenuItem[] = [];
  @State() private openSubmenuIndex: number | null = null;
  @State() private submenuPosition: 'right' | 'left' = 'right';

  private submenuTimer: ReturnType<typeof setTimeout> | null = null;
  private submenuRefs: Map<number, HTMLDivElement> = new Map();
  private menuItemWrapperRefs: Map<number, HTMLDivElement> = new Map();

  @Listen('pointerdown', { target: 'window' })
  handleOutsideClick(event: MouseEvent) {
    const path = event.composedPath();
    if (!path.includes(this.host)) {
      this.close.emit();
    }
  }

  componentWillLoad() {
    this.updateMenuItems();
  }

  componentDidLoad() {
    this.adjustPositionToViewport();
  }

  componentDidUpdate() {
    this.adjustPositionToViewport();
    this.adjustSubmenuPosition();
  }

  disconnectedCallback() {
    if (this.submenuTimer) {
      clearTimeout(this.submenuTimer);
    }
  }

  private adjustPositionToViewport() {
    const rect = this.host.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const currentLeft = parseFloat(this.host.style.left) || 0;
    const currentTop = parseFloat(this.host.style.top) || 0;

    let newLeft = currentLeft;
    let newTop = currentTop;

    // Check if menu extends beyond right edge
    if (rect.right > viewportWidth - VIEWPORT_PADDING) {
      newLeft = viewportWidth - rect.width - VIEWPORT_PADDING;
    }

    // Check if menu extends beyond bottom edge
    if (rect.bottom > viewportHeight - VIEWPORT_PADDING) {
      newTop = viewportHeight - rect.height - VIEWPORT_PADDING;
    }

    // Ensure menu doesn't go beyond left edge
    if (newLeft < VIEWPORT_PADDING) {
      newLeft = VIEWPORT_PADDING;
    }

    // Ensure menu doesn't go beyond top edge
    if (newTop < VIEWPORT_PADDING) {
      newTop = VIEWPORT_PADDING;
    }

    // Only update if position changed to avoid infinite loops
    if (newLeft !== currentLeft || newTop !== currentTop) {
      this.host.style.left = `${newLeft}px`;
      this.host.style.top = `${newTop}px`;
    }
  }

  private adjustSubmenuPosition() {
    if (this.openSubmenuIndex === null) return;

    const submenuEl = this.submenuRefs.get(this.openSubmenuIndex);
    if (!submenuEl) return;

    const submenuRect = submenuEl.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Adjust vertical position if needed (horizontal is pre-calculated)
    if (submenuRect.bottom > viewportHeight - VIEWPORT_PADDING) {
      const overflow = submenuRect.bottom - (viewportHeight - VIEWPORT_PADDING);
      submenuEl.style.top = `${-overflow}px`;
    } else {
      submenuEl.style.top = '0px';
    }
  }

  private handleItemClick(item: ContextMenuItem, isDisabled: boolean, hasChildren: boolean) {
    if (isDisabled) return;

    if (hasChildren) {
      // Toggle submenu on click for touch devices
      return;
    }

    if (item.action) {
      this.actionSelected.emit(item);
    }
  }

  private handleItemMouseEnter(index: number, hasChildren: boolean) {
    if (this.submenuTimer) {
      clearTimeout(this.submenuTimer);
      this.submenuTimer = null;
    }

    if (hasChildren) {
      this.submenuTimer = setTimeout(() => {
        // Pre-calculate position before opening to avoid flicker
        const wrapperEl = this.menuItemWrapperRefs.get(index);
        if (wrapperEl) {
          const rect = wrapperEl.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          // Check if opening to the right would overflow
          const wouldOverflowRight = rect.right + ESTIMATED_SUBMENU_WIDTH > viewportWidth - VIEWPORT_PADDING;
          this.submenuPosition = wouldOverflowRight ? 'left' : 'right';
        } else {
          this.submenuPosition = 'right';
        }
        this.openSubmenuIndex = index;
      }, SUBMENU_DELAY);
    } else {
      // Close any open submenu when hovering a non-parent item
      this.submenuTimer = setTimeout(() => {
        this.openSubmenuIndex = null;
      }, SUBMENU_DELAY);
    }
  }

  private handleSubmenuMouseEnter() {
    if (this.submenuTimer) {
      clearTimeout(this.submenuTimer);
      this.submenuTimer = null;
    }
  }

  private handleSubmenuMouseLeave() {
    this.submenuTimer = setTimeout(() => {
      this.openSubmenuIndex = null;
    }, SUBMENU_DELAY);
  }

  private async updateMenuItems() {
    this.processedItems = await this.processItems(this.items);
  }

  private async processItems(items: ContextMenuItem[]): Promise<ProcessedMenuItem[]> {
    const processed: ProcessedMenuItem[] = [];

    for (const item of items) {
      const isVisible = await this.evaluateProperty(item.visible, true);
      if (isVisible) {
        const isDisabled = await this.evaluateProperty(item.disabled, false);
        let processedChildren: ProcessedMenuItem[] | undefined;

        if (item.children && item.children.length > 0) {
          processedChildren = await this.processItems(item.children);
        }

        processed.push({ item, isDisabled, processedChildren });
      }
    }

    return processed;
  }

  private async evaluateProperty(value: boolean | ((obj: KritzelBaseObject, objs: KritzelBaseObject[]) => boolean | Promise<boolean>), defaultValue: boolean): Promise<boolean> {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'function') {
      return await Promise.resolve(value(null, this.objects));
    }
    return defaultValue;
  }

  private renderSubmenu(processedChildren: ProcessedMenuItem[], parentIndex: number) {
    return (
      <div
        class={{ 'submenu-container': true, 'position-left': this.submenuPosition === 'left' }}
        ref={el => el && this.submenuRefs.set(parentIndex, el)}
        onMouseEnter={() => this.handleSubmenuMouseEnter()}
        onMouseLeave={() => this.handleSubmenuMouseLeave()}
      >
        {processedChildren.map(({ item, isDisabled, processedChildren: nestedChildren }, index) => {
          const prevItem = index > 0 ? processedChildren[index - 1].item : null;
          const showDivider = prevItem && prevItem.group !== item.group;
          const hasChildren = nestedChildren && nestedChildren.length > 0;

          return [
            showDivider && <div class="menu-divider" key={`submenu-divider-${index}`}></div>,
            <button
              key={`submenu-${item.label}-${index}`}
              class={{ 'menu-item': true, 'disabled': isDisabled, 'has-children': hasChildren }}
              onClick={() => this.handleItemClick(item, isDisabled, hasChildren)}
              disabled={isDisabled}
            >
              {item.icon && <kritzel-icon name={item.icon} size={16}></kritzel-icon>}
              <span class="label">{item.label}</span>
              {hasChildren && <kritzel-icon name="chevron-right" size={12} class="submenu-arrow"></kritzel-icon>}
            </button>
          ];
        })}
      </div>
    );
  }

  render() {
    if (!this.processedItems || this.processedItems.length === 0) {
      return null;
    }

    return (
      <Host>
        <div class="menu-container">
          {this.processedItems.map(({ item, isDisabled, processedChildren }, index) => {
            const prevItem = index > 0 ? this.processedItems[index - 1].item : null;
            const showDivider = prevItem && prevItem.group !== item.group;
            const hasChildren = processedChildren && processedChildren.length > 0;
            const isSubmenuOpen = this.openSubmenuIndex === index;

            return [
              showDivider && <div class="menu-divider" key={`divider-${index}`}></div>,
              <div
                class="menu-item-wrapper"
                ref={el => el && this.menuItemWrapperRefs.set(index, el)}
                onMouseEnter={() => this.handleItemMouseEnter(index, hasChildren)}
              >
                <button
                  key={`${item.label}-${index}`}
                  class={{ 'menu-item': true, 'disabled': isDisabled, 'has-children': hasChildren, 'submenu-open': isSubmenuOpen }}
                  onClick={() => this.handleItemClick(item, isDisabled, hasChildren)}
                  disabled={isDisabled && !hasChildren}
                >
                  {item.icon && <kritzel-icon name={item.icon} size={16}></kritzel-icon>}
                  <span class="label">{item.label}</span>
                  {hasChildren && <kritzel-icon name="chevron-right" size={12} class="submenu-arrow"></kritzel-icon>}
                </button>
                {hasChildren && isSubmenuOpen && this.renderSubmenu(processedChildren, index)}
              </div>
            ];
          })}
        </div>
      </Host>
    );
  }
}
