import { Component, Host, h, Prop, Event, EventEmitter, Listen } from '@stencil/core';
import { ContextMenuItem } from '../../interfaces/context-menu-item.interface';

@Component({
  tag: 'kritzel-context-menu',
  styleUrl: 'kritzel-context-menu.css',
  shadow: true,
})
export class KritzelContextMenu {
  @Prop() 
  items: ContextMenuItem[] = [
    { id: 'cut', label: 'Cut', icon: 'cut' },
    { id: 'copy', label: 'Copy', icon: 'copy' },
    { id: 'paste', label: 'Paste', icon: 'paste', disabled: true }, // Example disabled item
    { id: 'delete', label: 'Delete', icon: 'delete' },
    { id: 'bring-to-front', label: 'Bring to Front', icon: 'bring-to-front' },
    { id: 'send-to-back', label: 'Send to Back', icon: 'send-to-back' },
  ];

  @Event() 
  actionSelected: EventEmitter<string>;

  @Listen('click', { capture: true })
  handleClickInside(event: MouseEvent) {
    event.stopPropagation();
  }

  private handleItemClick(item: ContextMenuItem) {
    if (!item.disabled) {
      this.actionSelected.emit(item.id);
    }
  }

  render() {
    return (
      <Host onClick={ev => ev.stopPropagation()}>
        <div class="menu-container">
          {this.items.map(item => (
            <button
              class={{ 'menu-item': true, 'disabled': item.disabled }}
              onClick={() => this.handleItemClick(item)}
              disabled={item.disabled}
            >
              {item.icon && <kritzel-icon name={item.icon} size={16}></kritzel-icon>}
              <span class="label">{item.label}</span>
            </button>
          ))}
        </div>
      </Host>
    );
  }
}
