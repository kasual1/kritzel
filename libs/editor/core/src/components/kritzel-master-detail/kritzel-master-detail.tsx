import { Component, Element, Event, EventEmitter, Host, h, Prop, State, Watch } from '@stencil/core';
import { IKritzelMasterDetailItem, IKritzelMasterDetailSelectEvent } from '@kritzel/engine';

@Component({
  tag: 'kritzel-master-detail',
  styleUrl: 'kritzel-master-detail.css',
  shadow: true,
})
export class KritzelMasterDetail {
  @Element() host: HTMLElement;

  /** Array of menu items to display in the master (left) panel */
  @Prop() items: IKritzelMasterDetailItem[] = [];

  /** ID of the currently selected item */
  @Prop() selectedItemId: string;

  /** Emitted when an item is selected */
  @Event() itemSelect: EventEmitter<IKritzelMasterDetailSelectEvent>;

  @State() focusedIndex: number = -1;
  @State() showMobileDetail: boolean = false;

  private tabRefs: HTMLButtonElement[] = [];

  @Watch('selectedItemId')
  watchSelectedItemId(newValue: string, oldValue: string) {
    if (newValue !== oldValue) {
      this.showMobileDetail = true;
    }
  }

  componentWillRender() {
    this.tabRefs = [];
  }

  private handleItemClick = (item: IKritzelMasterDetailItem) => {
    if (item.disabled) return;
    this.itemSelect.emit({ item });
    this.showMobileDetail = true;
  };

  private handleBackClick = () => {
    this.showMobileDetail = false;
  };

  private handleKeyDown = (event: KeyboardEvent, item: IKritzelMasterDetailItem, index: number) => {
    const enabledIndices = this.items
      .map((it, idx) => (!it.disabled ? idx : -1))
      .filter(idx => idx !== -1);

    const currentEnabledIndex = enabledIndices.indexOf(index);

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const nextIndex = enabledIndices[(currentEnabledIndex + 1) % enabledIndices.length];
        this.focusTab(nextIndex);
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const prevIndex = enabledIndices[(currentEnabledIndex - 1 + enabledIndices.length) % enabledIndices.length];
        this.focusTab(prevIndex);
        break;
      }
      case 'Home': {
        event.preventDefault();
        this.focusTab(enabledIndices[0]);
        break;
      }
      case 'End': {
        event.preventDefault();
        this.focusTab(enabledIndices[enabledIndices.length - 1]);
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        this.handleItemClick(item);
        break;
      }
    }
  };

  private focusTab(index: number) {
    this.focusedIndex = index;
    const tab = this.tabRefs[index];
    if (tab) {
      tab.focus();
    }
  }

  private handleFocus = (index: number) => {
    this.focusedIndex = index;
  };

  private handleBlur = () => {
    this.focusedIndex = -1;
  };

  private setTabRef = (el: HTMLButtonElement | undefined, index: number) => {
    if (el) {
      this.tabRefs[index] = el;
    }
  };

  private getTabIndex(item: IKritzelMasterDetailItem, _index: number): number {
    if (item.disabled) return -1;
    return 0;
  }

  render() {
    const selectedItem = this.items.find(item => item.id === this.selectedItemId);
    const panelId = 'master-detail-panel';
    const selectedTabId = selectedItem ? `tab-${selectedItem.id}` : undefined;

    return (
      <Host>
        <div class={{
          'master-detail-container': true,
          'is-mobile-detail-visible': this.showMobileDetail,
        }}>
          <nav
            class="master-menu"
            role="tablist"
            aria-orientation="vertical"
            aria-label="Settings categories"
          >
            {this.items.map((item, index) => (
              <button
                key={item.id}
                id={`tab-${item.id}`}
                ref={el => this.setTabRef(el, index)}
                class={{
                  'menu-item': true,
                  'is-selected': item.id === this.selectedItemId,
                  'is-disabled': !!item.disabled,
                  'is-focused': index === this.focusedIndex,
                }}
                role="tab"
                aria-selected={item.id === this.selectedItemId ? 'true' : 'false'}
                aria-controls={panelId}
                aria-disabled={item.disabled ? 'true' : undefined}
                tabIndex={this.getTabIndex(item, index)}
                disabled={item.disabled}
                onClick={() => this.handleItemClick(item)}
                onKeyDown={e => this.handleKeyDown(e, item, index)}
                onFocus={() => this.handleFocus(index)}
                onBlur={this.handleBlur}
              >
                {item.icon && (
                  <kritzel-icon name={item.icon} size={20} class="menu-item-icon"></kritzel-icon>
                )}
                <span class="menu-item-label">{item.label}</span>
                <span class="menu-item-chevron" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </span>
              </button>
            ))}
          </nav>

          <div
            id={panelId}
            class="detail-panel"
            role="tabpanel"
            aria-labelledby={selectedTabId}
          >
            <button class="mobile-back-button" onClick={this.handleBackClick} aria-label="Back to menu">
              <kritzel-icon name="chevronLeft" size={20} class="mobile-back-icon"></kritzel-icon>
              Back
            </button>
            <slot></slot>
          </div>
        </div>
      </Host>
    );
  }
}
