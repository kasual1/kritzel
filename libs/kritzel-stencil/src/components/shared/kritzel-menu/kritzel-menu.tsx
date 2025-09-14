import { Component, h, Prop, Host, State, Listen, Element, Watch, Event, EventEmitter } from '@stencil/core';
import { KritzelMenuItem } from '../../../interfaces/menu-item.interface';
import { KritzelDevicesHelper } from '../../../helpers/devices.helper';

@Component({
  tag: 'kritzel-menu',
  styleUrl: 'kritzel-menu.css',
  shadow: true,
})
export class KritzelMenu {
  @Element()
  host: HTMLElement;

  @Prop()
  items: KritzelMenuItem[] = [];

  @Prop()
  parentIndex: number | null = null;

  @Prop()
  parent: KritzelMenuItem = null;

  @Prop()
  activeItemIndex: number | null = null;

  @Prop()
  editingIndex: number | null = null;

  @Event()
  close: EventEmitter<void>;

  @State()
  openChildMenuIndex: number | null = null;

  @State()
  isTouchDevice: boolean = KritzelDevicesHelper.isTouchDevice();

  private editInput?: HTMLInputElement;

  private childMenuAnchor?: HTMLElement = null;

  private childMenu?: HTMLKritzelMenuElement = null;

  private cancelButton?: HTMLElement = null;

  private saveButton?: HTMLElement = null;

  @Watch('editingIndex')
  onEditingIndexChange(newValue: number | null) {
    if (newValue === null) {
      this.openChildMenuIndex = null;
      this.editInput = undefined;
      return;
    }
  }

  @Listen('pointerup', { target: 'window' })
  handleWindowClick(event: PointerEvent) {
    requestAnimationFrame(() => {
      if (this.childMenu === null) {
        return;
      }

      const target = event.target as HTMLElement;

      if (!target.contains(this.childMenu)) {
        this.openChildMenuIndex = null;
      }
    });
  }

  @Listen('keydown', { target: 'window' })
  handleEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (this.openChildMenuIndex !== null) {
        return;
      }

      if (this.editingIndex !== null) {
        this.cancelButton?.click();
        return;
      }

      this.close.emit();
    }
  }

  @Listen('keydown', { target: 'window' })
  handleEnter(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      if (this.editingIndex !== null) {
        this.saveButton?.click();
        return;
      }
    }
  }

  componentDidLoad() {
    requestAnimationFrame(() => {
      this.host.focus();
    });
  }

  isViewMode(index: number): boolean {
    return this.editingIndex !== index;
  }

  handleSelect(item: KritzelMenuItem) {
    if (item.disabled || this.editingIndex !== null || this.openChildMenuIndex !== null) {
      return;
    }
    item.select?.(item);
  }

  render() {
    return (
      <Host tabIndex={0} class={{ mobile: this.isTouchDevice }}>
        {this.items.map((item, index) => (
          <button
            tabIndex={0}
            class={{
              'menu-item': true,
              'disabled': item.disabled,
              'inactive': this.openChildMenuIndex !== null && this.openChildMenuIndex !== index,
              'child-open': this.openChildMenuIndex === index,
              'edit-mode': this.editingIndex === index,
              'active': this.activeItemIndex === index,
            }}
            style={{
              pointerEvents:
                (this.editingIndex !== null && this.editingIndex !== index) || (this.openChildMenuIndex !== null && this.openChildMenuIndex !== index) ? 'none' : 'auto',
            }}
            onClick={() => this.handleSelect(item)}
          >
            {this.isViewMode(index) === true && (
              <div class="view-container">
                <span class="menu-item-label">{item.label}</span>

                <div>
                  {item.children && item.children.length > 0 && (
                    <button
                      class="menu-item-button"
                      tabIndex={0}
                      onClick={event => {
                        if (this.editingIndex !== null) return;
                        event.stopPropagation();
                        this.childMenuAnchor = this.openChildMenuIndex === index ? null : (event.currentTarget as HTMLElement);
                        this.openChildMenuIndex = this.openChildMenuIndex === index ? null : index;
                      }}
                    >
                      <kritzel-icon name="ellipsis-vertical" size={16}></kritzel-icon>
                    </button>
                  )}

                  {this.openChildMenuIndex === index && (
                    <kritzel-portal anchor={this.childMenuAnchor} offsetY={4} onClose={() => (this.openChildMenuIndex = null)}>
                      <kritzel-menu
                        ref={el => {
                          this.childMenu = el;
                        }}
                        style={{ minWidth: '100px' }}
                        items={item.children}
                        parentIndex={index}
                        parent={item}
                        onClose={() => {
                          this.openChildMenuIndex = null;
                          this.childMenuAnchor?.focus();
                        }}
                      ></kritzel-menu>
                    </kritzel-portal>
                  )}
                </div>
              </div>
            )}

            {this.isViewMode(index) === false && (
              <div class="edit-container">
                <input
                  tabIndex={0}
                  ref={el => {
                    this.editInput = el as HTMLInputElement;
                    requestAnimationFrame(() => {
                      this.editInput?.focus();
                      this.editInput?.select();
                    });
                  }}
                  type="text"
                  name={'menu-item-' + index}
                  value={item.label}
                  onInput={e => (item.label = (e.target as HTMLInputElement).value)}
                />

                <div style={{ display: 'flex', gap: '8px' }}>
                  <div
                    class="menu-item-button"
                    ref={el => (this.cancelButton = el)}
                    tabIndex={0}
                    onClick={() => {
                      item.cancel?.(item);
                    }}
                  >
                    <kritzel-icon name="x" size={16}></kritzel-icon>
                  </div>

                  <div
                    class="menu-item-button"
                    ref={el => (this.saveButton = el)}
                    tabIndex={0}
                    onClick={() => {
                      item.save?.(item);
                    }}
                  >
                    <kritzel-icon name="check" size={16}></kritzel-icon>
                  </div>
                </div>
              </div>
            )}
          </button>
        ))}
      </Host>
    );
  }
}
