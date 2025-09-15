import { Component, Host, Prop, h, State, Element } from '@stencil/core';
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

  @State() childMenuAnchor: HTMLElement = null;

  private inputRef: HTMLInputElement;

  componentDidUpdate() {
    if (this.item.isEditing && this.inputRef) {
      this.inputRef.focus();
      this.inputRef.select();
    }
  }

  private handleInputChange = (event: Event) => {
    this.item.label = (event.target as HTMLInputElement).value;
  };

  private renderViewMode() {
    return [
      <div class="menu-item-content left">
        <div>{this.item.label}</div>
      </div>,
      <div class="menu-item-content right">
        {this.item.children &&
          this.item.children.length > 0 && [
            <button id="child-menu-toggle" class="action-button" onClick={(event) => this.item.toggleChildMenu?.(this.item, event.target as HTMLElement)} disabled={this.item.isDisabled}>
              <kritzel-icon name="ellipsis-vertical" size={16}></kritzel-icon>
            </button>,
            <kritzel-portal anchor={this.item.childMenuAnchor} offsetY={4}>
              <kritzel-menu-new items={this.item.children} parent={this.item}></kritzel-menu-new>
            </kritzel-portal>,
          ]}
      </div>,
    ];
  }

  private renderEditMode() {
    return [
      <div class="menu-item-content left">
        <input ref={el => (this.inputRef = el)} type="text" class="edit-input" value={this.item.label} onInput={this.handleInputChange} />
      </div>,
      <div class="menu-item-content right">
        <button class="action-button" onClick={() => this.item.save(this.item)}>
          <kritzel-icon name="check" size={16}></kritzel-icon>
        </button>
        <button class="action-button" onClick={() => this.item.cancel(this.item)}>
          <kritzel-icon name="x" size={16}></kritzel-icon>
        </button>
      </div>,
    ];
  }

  render() {
    return (
      <Host
        class={{
          selected: this.item.isSelected,
          editing: this.item.isEditing,
          disabled: this.item.isDisabled,
          childOpen: this.childMenuAnchor !== null,
        }}
        tabIndex={this.item.isDisabled ? -1 : 0}
        onClick={() => this.item.select?.(this.item, this.parent)}
      >
        <div class="menu-item-overlay"></div>
        {this.item.isEditing ? this.renderEditMode() : this.renderViewMode()}
      </Host>
    );
  }
}
