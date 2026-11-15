import { Component, Host, Prop, h, Element, State, Watch, Event, EventEmitter } from '@stencil/core';
import { IUpdrawMenuItem, IUpdrawMenuItemSelectEvent, IUpdrawMenuItemToggleChildMenuEvent } from '@updraw/core';
import { UpdrawDevicesHelper } from '@updraw/core';

@Component({
  tag: 'updraw-menu-item',
  styleUrl: 'updraw-menu-item.css',
  shadow: true,
})
export class UpdrawMenuItem {
  @Element() host: HTMLElement;

  @Prop() item: IUpdrawMenuItem;
  @Watch('item')
  onItemChange(newValue: IUpdrawMenuItem, oldValue: IUpdrawMenuItem) {
    if (newValue !== oldValue) {
      this.isDirty = false;
    }
  }
  @Prop() parent: IUpdrawMenuItem = null;

  @Event() itemSelect: EventEmitter<IUpdrawMenuItemSelectEvent>;
  @Event() itemSave: EventEmitter<IUpdrawMenuItem>;
  @Event() itemCancel: EventEmitter<IUpdrawMenuItem>;
  @Event() itemToggleChildMenu: EventEmitter<IUpdrawMenuItemToggleChildMenuEvent>;
  @Event() itemCloseChildMenu: EventEmitter<IUpdrawMenuItem>;

  @State()
  isDirty: boolean = false;

  private inputRef: HTMLInputElement;

  private focusInput() {
    if (this.item.isEditing && !this.isDirty) {
      requestAnimationFrame(() => {
        if (this.inputRef) {
          this.inputRef.focus();

          if (UpdrawDevicesHelper.isIOS()) {
            const length = this.inputRef.value.length;
            this.inputRef.setSelectionRange(length, length);
          } else {
            this.inputRef.select();
          }
        }
      });
    }
  }

  componentDidLoad() {
    this.setDeviceSpecificStyles();
    this.focusInput();
  }

  componentDidUpdate() {
    this.focusInput();
  }

  private setDeviceSpecificStyles = () => {
    const isTouchDevice = UpdrawDevicesHelper.isTouchDevice();
    if (isTouchDevice) {
      this.host.style.setProperty('--updraw-menu-item-overlay-background-color', 'transparent');
      this.host.style.setProperty('--updraw-menu-item-button-hover-background-color', 'transparent');
    }
  };

  private handleItemSelect = (event: MouseEvent) => {
    event.stopPropagation();
    this.itemSelect.emit({ item: this.item, parent: this.parent });
  };

  private handleInputChange = (event: Event) => {
    event.stopPropagation();
    const target = event.target as HTMLInputElement;
    this.item.label = target.value;
    this.isDirty = true;
  };

  private handleSave = (event: MouseEvent) => {
    event.stopPropagation();
    this.host.focus();
    this.itemSave.emit(this.item);
  };

  private handleCancel = (event: MouseEvent) => {
    event.stopPropagation();
    this.host.focus();
    this.itemCancel.emit(this.item);
  };

  private handleMenuToggle = (event: MouseEvent) => {
    event.stopPropagation();
    this.itemToggleChildMenu.emit({ item: this.item, childMenuAnchor: event.target as HTMLElement });
  };

  private handleMenuClose = () => {
    this.itemCloseChildMenu.emit(this.item);
  };

  private renderViewMode() {
    const childMenuTag = ['updraw', 'menu'].join('-');

    return [
      <div class="menu-item-content left">
        {this.item.icon && (
          <span title={this.item.iconTooltip}>
            <updraw-icon name={this.item.icon} size={16} style={this.item.color ? { '--updraw-icon-color': this.item.color } : undefined}></updraw-icon>
          </span>
        )}
        <div style={this.item.color ? { color: this.item.color } : undefined}>{this.item.label}</div>
      </div>,
      <div class="menu-item-content right">
        {this.item.children &&
          this.item.children.length > 0 && [
            <button id="child-menu-toggle" class="action-button" onClick={this.handleMenuToggle} disabled={this.item.isDisabled}>
              <updraw-icon name="ellipsisVertical" size={16}></updraw-icon>
            </button>,
            <updraw-portal anchor={this.item.childMenuAnchor} offsetY={4} onClose={this.handleMenuClose}>
              {h(childMenuTag, {
                items: this.item.children,
                parent: this.item,
                onItemSelect: event => this.itemSelect.emit(event.detail),
                onItemSave: event => this.itemSave.emit(event.detail),
                onItemCancel: event => this.itemCancel.emit(event.detail),
                onClose: this.handleMenuClose,
              })}
            </updraw-portal>,
          ]}
      </div>,
    ];
  }

  private renderEditMode() {
    return [
      <div class="menu-item-content left">
        <input
          ref={el => (this.inputRef = el)}
          type="text"
          class="edit-input"
          value={this.item.label}
          onInput={this.handleInputChange}
        />
      </div>,
      <div class="menu-item-content right">
        <div tabIndex={0} class="action-button" onClick={this.handleCancel}>
          <updraw-icon name="x" size={16}></updraw-icon>
        </div>
        <div
          tabIndex={!this.isDirty && !this.item.isNewItem ? -1 : 0}
          class={{ 'action-button': true, 'disabled': !this.isDirty && !this.item.isNewItem }}
          onClick={this.handleSave}
        >
          <updraw-icon name="check" size={16}></updraw-icon>
        </div>
      </div>,
    ];
  }

  render() {
    return (
      <Host
        tabIndex={this.item.isDisabled ? -1 : 0}
        class={{
          'selected': this.item.isSelected,
          'editing': this.item.isEditing,
          'disabled': this.item.isDisabled,
          'child-open': this.item.isChildMenuOpen,
        }}
        onClick={this.handleItemSelect}
      >
        <div class="menu-item-overlay"></div>
        {this.item.isEditing ? this.renderEditMode() : this.renderViewMode()}
      </Host>
    );
  }
}
