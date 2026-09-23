import { Component, Host, h, Prop, Event, EventEmitter, State, Watch, Listen, Element } from '@stencil/core';
import { ContextMenuItem } from '@kritzel/engine';
import { KritzelBaseObject } from '@kritzel/engine';

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
  
  /** Current open submenu path (e.g. '0.2.1'). Empty if none. */
  @State() private openSubmenuPath: string = '';
  @State() private submenuPositions: { [path: string]: 'right' | 'left' } = {};

  private submenuTimer: ReturnType<typeof setTimeout> | null = null;
  private submenuRefs: Map<string, HTMLDivElement> = new Map();
  private menuItemWrapperRefs: Map<string, HTMLDivElement> = new Map();

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
    this.adjustSubmenuPositions();
    this.pruneStaleRefs();
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

  private adjustSubmenuPositions() {
    if (!this.openSubmenuPath) return;

    const viewportHeight = window.innerHeight;

    // Adjust every open submenu in the chain (every prefix of openSubmenuPath).
    for (const path of this.getOpenSubmenuPaths()) {
      const submenuEl = this.submenuRefs.get(path);
      const wrapperEl = this.menuItemWrapperRefs.get(path);
      if (!submenuEl || !wrapperEl) continue;

      const wrapperRect = wrapperEl.getBoundingClientRect();
      const submenuHeight = submenuEl.offsetHeight; // Constant regardless of current top shift
      const naturalBottom = wrapperRect.top + submenuHeight;

      if (naturalBottom > viewportHeight - VIEWPORT_PADDING) {
        let overflow = naturalBottom - (viewportHeight - VIEWPORT_PADDING);
        // Don't shift up so far that the top goes above the viewport
        if (wrapperRect.top - overflow < VIEWPORT_PADDING) {
          overflow = wrapperRect.top - VIEWPORT_PADDING;
        }
        submenuEl.style.top = `${-overflow}px`;
      } else {
        submenuEl.style.top = '0px';
      }
    }
  }

  private getOpenSubmenuPaths(): string[] {
    if (!this.openSubmenuPath) return [];
    const parts = this.openSubmenuPath.split('.');
    const paths: string[] = [];
    for (let i = 1; i <= parts.length; i++) {
      paths.push(parts.slice(0, i).join('.'));
    }
    return paths;
  }

  private isSubmenuOpen(path: string): boolean {
    return this.openSubmenuPath === path || this.openSubmenuPath.startsWith(path + '.');
  }

  private getParentPath(path: string): string {
    const idx = path.lastIndexOf('.');
    return idx === -1 ? '' : path.substring(0, idx);
  }

  private getMenuDepth(path: string): number {
    if (!path) return 0;
    return path.split('.').length;
  }

  private pruneStaleRefs() {
    const openPaths = new Set(this.getOpenSubmenuPaths());
    for (const key of Array.from(this.submenuRefs.keys())) {
      if (!openPaths.has(key)) {
        this.submenuRefs.delete(key);
      }
    }
    // Keep root-level wrapper refs (single-segment paths) always rendered; prune deeper
    // wrappers whose parent submenu is no longer open.
    for (const key of Array.from(this.menuItemWrapperRefs.keys())) {
      const parent = this.getParentPath(key);
      if (parent !== '' && !openPaths.has(parent)) {
        this.menuItemWrapperRefs.delete(key);
      }
    }
  }

  private handleItemClick(item: ContextMenuItem, isDisabled: boolean, hasChildren: boolean) {
    if (isDisabled) return;

    if (hasChildren) {
      // Hover handles open/close; click on a parent is a no-op.
      return;
    }

    if (item.action) {
      this.actionSelected.emit(item);
    }
  }

  private handleItemMouseEnter(path: string, hasChildren: boolean) {
    if (this.submenuTimer) {
      clearTimeout(this.submenuTimer);
      this.submenuTimer = null;
    }

    const parentPath = this.getParentPath(path);

    if (hasChildren) {
      this.submenuTimer = setTimeout(() => {
        // Pre-calculate horizontal position before opening to avoid flicker.
        const wrapperEl = this.menuItemWrapperRefs.get(path);
        let position: 'right' | 'left' = 'right';
        if (wrapperEl) {
          const rect = wrapperEl.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const wouldOverflowRight = rect.right + ESTIMATED_SUBMENU_WIDTH > viewportWidth - VIEWPORT_PADDING;
          position = wouldOverflowRight ? 'left' : 'right';
        }
        this.submenuPositions = { ...this.submenuPositions, [path]: position };
        this.openSubmenuPath = path;
      }, SUBMENU_DELAY);
    } else {
      // Hovering a sibling without children: collapse to the parent chain so any
      // sibling-rooted submenu closes, but the ancestor chain stays open.
      this.submenuTimer = setTimeout(() => {
        this.openSubmenuPath = parentPath;
      }, SUBMENU_DELAY);
    }
  }

  private handleSubmenuMouseEnter() {
    if (this.submenuTimer) {
      clearTimeout(this.submenuTimer);
      this.submenuTimer = null;
    }
  }

  private handleSubmenuMouseLeave(path: string) {
    // Close this submenu (and any deeper levels) but keep the ancestor chain open.
    const parentPath = this.getParentPath(path);
    this.submenuTimer = setTimeout(() => {
      this.openSubmenuPath = parentPath;
    }, SUBMENU_DELAY);
  }

  private async updateMenuItems() {
    this.processedItems = await this.processItems(this.items);
  }

  private async processItems(items: ContextMenuItem[]): Promise<ProcessedMenuItem[]> {
    const processed: ProcessedMenuItem[] = [];

    for (const item of items) {
      const isVisible = await this.evaluateProperty(item.isVisible, true);
      if (isVisible) {
        const isDisabled = await this.evaluateProperty(item.isDisabled, false);
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

  private renderItems(items: ProcessedMenuItem[], parentPath: string) {
    return items.map(({ item, isDisabled, processedChildren }, index) => {
      const path = parentPath === '' ? String(index) : `${parentPath}.${index}`;
      const prevItem = index > 0 ? items[index - 1].item : null;
      const showDivider = prevItem && prevItem.group !== item.group;
      const hasChildren = !!processedChildren && processedChildren.length > 0;
      const submenuOpen = hasChildren && this.isSubmenuOpen(path);

      return [
        showDivider && <div class="menu-divider" key={`divider-${path}`}></div>,
        <div
          class="menu-item-wrapper"
          key={`wrapper-${path}`}
          ref={el => el && this.menuItemWrapperRefs.set(path, el)}
          onMouseEnter={() => this.handleItemMouseEnter(path, hasChildren)}
        >
          <button
            key={`${item.label}-${path}`}
            class={{ 'menu-item': true, 'disabled': isDisabled, 'has-children': hasChildren, 'submenu-open': submenuOpen }}
            onClick={() => this.handleItemClick(item, isDisabled, hasChildren)}
            disabled={isDisabled && !hasChildren}
          >
            {item.icon && <kritzel-icon name={item.icon} size={16}></kritzel-icon>}
            <span class="label">{item.label}</span>
            {hasChildren && <kritzel-icon name="chevronRight" size={12} class="submenu-arrow"></kritzel-icon>}
          </button>
          {hasChildren && submenuOpen && this.renderSubmenu(processedChildren!, path)}
        </div>,
      ];
    });
  }

  private renderSubmenu(processedChildren: ProcessedMenuItem[], path: string) {
    const position = this.submenuPositions[path] === 'left' ? 'left' : 'right';
    const zIndex = this.getMenuDepth(path) + 1;

    return (
      <div
        class={{ 'submenu-container': true, 'position-left': position === 'left' }}
        key={`submenu-${path}`}
        style={{ zIndex: String(zIndex) }}
        ref={el => el && this.submenuRefs.set(path, el)}
        onMouseEnter={() => this.handleSubmenuMouseEnter()}
        onMouseLeave={() => this.handleSubmenuMouseLeave(path)}
      >
        {this.renderItems(processedChildren, path)}
      </div>
    );
  }

  render() {
    if (!this.processedItems || this.processedItems.length === 0) {
      return null;
    }

    return (
      <Host>
        <div class="menu-container">{this.renderItems(this.processedItems, '')}</div>
      </Host>
    );
  }
}
