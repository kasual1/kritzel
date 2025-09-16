import { Component, Host, Prop, h, Element } from '@stencil/core';
import { KritzelMenuItemNew } from '../../../interfaces/menu-item-new.interface';

@Component({
  tag: 'kritzel-menu-item',
  styleUrl: 'kritzel-menu-item.css',
  shadow: true,
})
export class KritzelMenuItem {
  @Element() host: HTMLElement;

  @Prop() item: KritzelMenuItemNew;
  @Prop() parent: KritzelMenuItemNew = null;

  private inputRef: HTMLInputElement;

  componentDidUpdate() {
    if (this.item.isEditing && this.inputRef) {
      this.inputRef.focus();
      this.inputRef.select();
    }
  }

  private handleItemSelect = (event: MouseEvent) => {
    event.stopPropagation();
    this.item.select?.(this.item, this.parent);
  }

  private handleSave = (event: MouseEvent) => {
    event.stopPropagation();
    this.item.save(this.item);
  }

  private handleCancel = (event: MouseEvent) => {
    event.stopPropagation();
    this.item.cancel(this.item);
  }

   private handleMenuToggle = (event: MouseEvent) => {
    event.stopPropagation();
    this.item.toggleChildMenu?.(this.item, event.target as HTMLElement);
  }

  private handleMenuClose = () => {
    this.item.closeChildMenu?.(this.item);
  }

  private renderViewMode() {
    return [
      <div class="menu-item-content left">
        <div>{this.item.label}</div>
      </div>,
      <div class="menu-item-content right">
        {this.item.children &&
          this.item.children.length > 0 && [
            <button
              id="child-menu-toggle"
              class="action-button"
              onClick={this.handleMenuToggle}
              disabled={this.item.isDisabled}
            >
              <kritzel-icon name="ellipsis-vertical" size={16}></kritzel-icon>
            </button>,
            <kritzel-portal anchor={this.item.childMenuAnchor} offsetY={4}>
              <kritzel-menu-new items={this.item.children} parent={this.item} onClose={this.handleMenuClose}></kritzel-menu-new>
            </kritzel-portal>,
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
          onInput={event => (this.item.label = (event.target as HTMLInputElement).value)}
        />
      </div>,
      <div class="menu-item-content right">
        <div
          class="action-button"
          onClick={this.handleSave}
        >
          <kritzel-icon name="check" size={16}></kritzel-icon>
        </div>
        <div
          class="action-button"
          onClick={this.handleCancel}
        >
          <kritzel-icon name="x" size={16}></kritzel-icon>
        </div>
      </div>,
    ];
  }

  render() {
    return (
      <Host
        class={{
          'selected': this.item.isSelected,
          'editing': this.item.isEditing,
          'disabled': this.item.isDisabled,
          'child-open': this.item.isChildMenuOpen,
        }}
        tabIndex={this.item.isDisabled ? -1 : 0}
        onClick={this.handleItemSelect}
      >
        <div class="menu-item-overlay"></div>
        {this.item.isEditing ? this.renderEditMode() : this.renderViewMode()}
      </Host>
    );
  }
}
