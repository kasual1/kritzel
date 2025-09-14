import { Component, Host, Prop, Event, EventEmitter, State, h } from '@stencil/core';

@Component({
  tag: 'kritzel-menu-item',
  styleUrl: 'kritzel-menu-item.css',
  shadow: true,
})
export class KritzelMenuItem {
  @Prop()
  label: string;

  @Prop()
  isSelected: boolean = false;

  @Prop()
  isEditing: boolean = false;

  @Prop()
  isDisabled: boolean = false;

  @Event()
  save: EventEmitter<string>;

  @Event()
  cancel: EventEmitter<void>;

  @State()
  private editValue: string;

  componentWillLoad() {
    this.editValue = this.label;
  }

  private handleInputChange = (event: Event) => {
    this.editValue = (event.target as HTMLInputElement).value;
  };

  private handleEdit = () => {
    this.isEditing = true;
  }

  private handleSave = () => {
    this.isEditing = false;
    this.save.emit(this.editValue);
  };

  private handleCancel = () => {
    this.isEditing = false;
    this.editValue = this.label;
    this.cancel.emit();
  };

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
        
        {this.isEditing ? [
          <div class="menu-item-content left">
            <input type="text" value={this.editValue} onInput={this.handleInputChange} class="edit-input" autoFocus />
          </div>,
          <div class="menu-item-content right">
            <button class="action-button save" onClick={this.handleSave}>
              Save
            </button>
            <button class="action-button cancel" onClick={this.handleCancel}>
              Cancel
            </button>
          </div>
        ] : [
          <div class="menu-item-content left">
            <div>Prefix</div>
            <div>{this.label}</div>
          </div>,
          <div class="menu-item-content right">
            <button class="action-button edit" onClick={this.handleEdit}>
              Edit
            </button>
          </div>
        ]}
      </Host>
    );
  }
}
