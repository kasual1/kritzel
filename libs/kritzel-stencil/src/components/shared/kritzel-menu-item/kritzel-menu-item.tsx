import { Component, Host, Prop, Event, EventEmitter, State, h } from '@stencil/core';
import { KritzelMenuItemNew } from '../../../interfaces/menu-item-new.interface';

@Component({
  tag: 'kritzel-menu-item',
  styleUrl: 'kritzel-menu-item.css',
  shadow: true,
})
export class KritzelMenuItem {
  @Prop() label: string;
  @Prop() childMenuItems: KritzelMenuItemNew[];
  @Prop() isSelected: boolean = false;
  @Prop() isEditing: boolean = false;
  @Prop() isDisabled: boolean = false;

  @Event() kritzelSave: EventEmitter<string>;
  @Event() kritzelCancel: EventEmitter<void>;

  @State() private editValue: string;

  private inputRef: HTMLInputElement;

  componentWillLoad() {
    this.editValue = this.label;
  }

  componentDidUpdate() {
    if (this.isEditing && this.inputRef) {
      this.inputRef.focus();
      this.inputRef.select();
    }
  }

  private handleInputChange = (event: Event) => {
    this.editValue = (event.target as HTMLInputElement).value;
  };

  private handleEdit = () => {
    this.isEditing = true;
  };

  private handleSave = () => {
    this.isEditing = false;
    this.kritzelSave.emit(this.editValue);
  };

  private handleCancel = () => {
    this.isEditing = false;
    this.editValue = this.label;
    this.kritzelCancel.emit();
  };

  private renderViewMode() {
    return [
      <div class="menu-item-content left">
        <div>{this.label}</div>
      </div>,
      <div class="menu-item-content right">
        <button class="action-button" onClick={this.handleEdit} disabled={this.isDisabled}>
          <kritzel-icon name="ellipsis-vertical" size={16}></kritzel-icon>
        </button>
      </div>,
    ];
  }

  private renderEditMode() {
    return [
      <div class="menu-item-content left">
        <input ref={el => (this.inputRef = el)} type="text" class="edit-input" value={this.editValue} onInput={this.handleInputChange} />
      </div>,
      <div class="menu-item-content right">
        <button class="action-button" onClick={this.handleSave}>
          <kritzel-icon name="check" size={16}></kritzel-icon>
        </button>
        <button class="action-button" onClick={this.handleCancel}>
          <kritzel-icon name="x" size={16}></kritzel-icon>
        </button>
      </div>,
    ];
  }

  render() {
    return (
      <Host
        class={{
          selected: this.isSelected,
          editing: this.isEditing,
          disabled: this.isDisabled,
        }}
      >
        <div class="menu-item-overlay"></div>
        {this.isEditing ? this.renderEditMode() : this.renderViewMode()}
      </Host>
    );
  }
}
