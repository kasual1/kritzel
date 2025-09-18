import { Component, Host, h, Prop, Event, EventEmitter, Element, State, Listen } from '@stencil/core';

export interface NavigationItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  action?: () => void;
}

@Component({
  tag: 'kritzel-navigation-drawer',
  styleUrl: 'kritzel-navigation-drawer.css',
  shadow: true,
})
export class KritzelNavigationDrawer {
  @Prop()
  items: NavigationItem[] = [];

  @Prop()
  isOpen: boolean = false;

  @Prop()
  drawerTitle: string = 'Settings';

  @Event()
  itemSelected: EventEmitter<NavigationItem>;

  @Event()
  drawerClosed: EventEmitter<void>;

  @Element()
  hostElement: HTMLElement;

  @State()
  private scrollPosition: number = 0;

  private scrollContainer!: HTMLElement;

  componentDidLoad() {
    this.restoreScrollPosition();
  }

  componentDidUpdate() {
    if (this.isOpen) {
      this.restoreScrollPosition();
    }
  }

  private saveScrollPosition() {
    if (this.scrollContainer) {
      this.scrollPosition = this.scrollContainer.scrollTop;
    }
  }

  private restoreScrollPosition() {
    if (this.scrollContainer && this.scrollPosition > 0) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        this.scrollContainer.scrollTop = this.scrollPosition;
      });
    }
  }

  @Listen('scroll', { target: 'body' })
  onScroll(event: Event) {
    // Save scroll position when the user scrolls within the drawer
    const target = event.target as HTMLElement;
    if (target && target.classList.contains('drawer-scroll-container')) {
      this.scrollPosition = target.scrollTop;
    }
  }

  private handleItemClick(item: NavigationItem, event: Event) {
    // Save current scroll position before navigation
    this.saveScrollPosition();
    
    // Prevent default behavior that might cause scroll reset
    event.preventDefault();
    event.stopPropagation();
    
    // Execute custom action if provided
    if (item.action) {
      item.action();
    }
    
    // Emit the selected item
    this.itemSelected.emit(item);
  }

  private handleOverlayClick() {
    this.drawerClosed.emit();
  }

  private handleCloseClick() {
    this.drawerClosed.emit();
  }

  render() {
    return (
      <Host>
        <div class={`drawer-overlay ${this.isOpen ? 'open' : ''}`} onClick={() => this.handleOverlayClick()}>
          <div class={`drawer-container ${this.isOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div class="drawer-header">
              <h2 class="drawer-title">{this.drawerTitle}</h2>
              <button class="drawer-close-btn" onClick={() => this.handleCloseClick()}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
            <div 
              class="drawer-scroll-container" 
              ref={(el) => this.scrollContainer = el}
              onScroll={() => this.saveScrollPosition()}
            >
              <ul class="drawer-items-list">
                {this.items.map((item) => (
                  <li key={item.id} class="drawer-item">
                    <button
                      class="drawer-item-button"
                      onClick={(event) => this.handleItemClick(item, event)}
                    >
                      {item.icon && (
                        <span class="drawer-item-icon">
                          {item.icon}
                        </span>
                      )}
                      <span class="drawer-item-label">{item.label}</span>
                      <span class="drawer-item-arrow">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Host>
    );
  }
}