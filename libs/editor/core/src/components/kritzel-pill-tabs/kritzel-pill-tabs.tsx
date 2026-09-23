import { Component, Host, h, Prop, Event, EventEmitter } from '@stencil/core';

export interface KritzelPillTab {
  /** Unique identifier for the tab */
  id: string;
  /** Display label for the tab */
  label: string;
  /** Optional icon name to display before the label */
  icon?: string;
}

@Component({
  tag: 'kritzel-pill-tabs',
  styleUrl: 'kritzel-pill-tabs.css',
  shadow: true,
})
export class KritzelPillTabs {
  /**
   * Array of tab definitions to render
   */
  @Prop() tabs: KritzelPillTab[] = [];

  /**
   * Currently selected tab ID
   */
  @Prop({ mutable: true }) value: string;

  /**
   * Emitted when the selected tab changes
   */
  @Event() valueChange: EventEmitter<string>;

  private handleTabClick(tabId: string) {
    if (this.value !== tabId) {
      this.value = tabId;
      this.valueChange.emit(tabId);
    }
  }

  private handleKeyDown(event: KeyboardEvent, index: number) {
    const tabButtons = this.tabs;
    let newIndex = index;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = index > 0 ? index - 1 : tabButtons.length - 1;
        break;
      case 'ArrowRight':
        event.preventDefault();
        newIndex = index < tabButtons.length - 1 ? index + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = tabButtons.length - 1;
        break;
      default:
        return;
    }

    const newTab = tabButtons[newIndex];
    this.handleTabClick(newTab.id);

    // Focus the new tab button
    const container = event.currentTarget as HTMLElement;
    const parent = container.parentElement;
    const buttons = parent?.querySelectorAll('button');
    buttons?.[newIndex]?.focus();
  }

  render() {
    return (
      <Host>
        <div class="pill-tabs-container" role="tablist">
          {this.tabs.map((tab, index) => (
            <button
              key={tab.id}
              class={{
                'pill-tab': true,
                'selected': this.value === tab.id,
              }}
              role="tab"
              aria-selected={this.value === tab.id ? 'true' : 'false'}
              tabIndex={this.value === tab.id ? 0 : -1}
              onClick={() => this.handleTabClick(tab.id)}
              onKeyDown={(e) => this.handleKeyDown(e, index)}
            >
              {tab.icon && <kritzel-icon name={tab.icon} size={16}></kritzel-icon>}
              <span class="pill-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </Host>
    );
  }
}
