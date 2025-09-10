import { Component, h, Prop, Host, State, Listen, Element, Watch } from '@stencil/core';

export interface MenuItem<T = any> {
  value: T;
  label: string;
  select?: (item: MenuItem) => void;
  save?: (item: MenuItem) => void;
  cancel?: (item: MenuItem) => void;
  disabled?: boolean;
  children?: MenuItem[];
}

@Component({
  tag: 'kritzel-menu',
  styleUrl: 'kritzel-menu.css',
  shadow: { delegatesFocus: true },
})
export class KritzelMenu {
  @Element()
  host: HTMLElement;

  @Prop()
  items: MenuItem[] = [];

  @Prop()
  parentIndex: number | null = null;

  @Prop()
  parent: MenuItem = null;

  @Prop()
  activeItemIndex: number | null = null;

  @Prop()
  editingIndex: number | null = null;

  @State()
  openChildMenuIndex: number | null = null;

  private editInput?: HTMLInputElement;

  @Watch('editingIndex')
  onEditingIndexChange(newValue: number | null) {
    if (newValue === null) {
      this.openChildMenuIndex = null;
      this.editInput = undefined;
      return;
    }

    requestAnimationFrame(() => {
      if (this.editInput) {
        this.editInput.focus();
      }
    });
  }

  @Listen('click', { target: 'window' })
  handleWindowClick(event: MouseEvent) {
    if (this.openChildMenuIndex === null) {
      return;
    }

    const target = event.target as HTMLElement;
    if (!this.host.contains(target)) {
      this.openChildMenuIndex = null;
    }
  }

  private blur() {
    const activeEl = this.host.shadowRoot.activeElement as HTMLElement;
    if (activeEl && typeof activeEl.blur === 'function') {
      activeEl.blur();
    }
  }

  render() {
    return (
      <Host>
        {this.items.map((item, index) => (
          <div
            class={{
              'menu-item': true,
              'disabled': item.disabled,
              'inactive': this.openChildMenuIndex !== null && this.openChildMenuIndex !== index,
              'child-open': this.openChildMenuIndex === index,
              'edit-mode': this.editingIndex === index,
              'active': this.activeItemIndex === index,
            }}
            onClick={() => {
              debugger;
              if (item.disabled || this.editingIndex !== null || this.openChildMenuIndex === index) return;
              item['_parentIndex'] = this.parentIndex;
              item['_parent'] = this.parent;
              item.select?.(item);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (item.disabled || this.editingIndex !== null || this.openChildMenuIndex === index) return;
                item['_parentIndex'] = this.parentIndex;
                item['_parent'] = this.parent;
                item.select?.(item);
              }
            }}
            tabIndex={0}
          >
            {this.editingIndex === index ? (
              <div class="edit-container">
                <input
                  ref={el => {
                    if (this.editingIndex === index) this.editInput = el as HTMLInputElement;
                  }}
                  type="text"
                  name={'menu-item-' + index}
                  tabIndex={0}
                  value={item.label}
                  onInput={e => (item.label = (e.target as HTMLInputElement).value)}
                />
              </div>
            ) : (
              <span>{item.label}</span>
            )}

            {this.editingIndex === index && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  class="menu-item-button"
                  tabIndex={0}
                  onClick={() => {
                    item.cancel?.(item);
                    this.blur();
                  }}
                >
                  <kritzel-icon name="x" size={16}></kritzel-icon>
                </button>

                <button
                  class="menu-item-button"
                  tabIndex={0}
                  onClick={() => {
                    item.save?.(item);
                    this.blur();
                  }}
                >
                  <kritzel-icon name="check" size={16}></kritzel-icon>
                </button>
              </div>
            )}

            {this.editingIndex !== index && item.children && item.children.length > 0 && (
              <div style={{ position: 'relative' }}>
                <button
                  class="menu-item-button"
                  tabIndex={0}
                  onClick={event => {
                    if (this.editingIndex !== null) return;
                    event.stopPropagation();
                    this.openChildMenuIndex = this.openChildMenuIndex === index ? null : index;
                  }}
                >
                  <kritzel-icon name="ellipsis-vertical" size={16}></kritzel-icon>
                </button>

                {this.openChildMenuIndex === index && (
                  <kritzel-menu
                    style={{ position: 'absolute', left: '0', top: '100%', zIndex: '3', minWidth: '100px' }}
                    items={item.children}
                    parentIndex={index}
                    parent={item}
                  ></kritzel-menu>
                )}
              </div>
            )}
          </div>
        ))}
      </Host>
    );
  }
}
