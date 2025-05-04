import { Component, Host, h, Prop, Event, EventEmitter } from '@stencil/core';
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
    { id: 'paste', label: 'Paste', icon: 'paste', disabled: true },
    { id: 'delete', label: 'Delete', icon: 'delete' },
    { id: 'bring-to-front', label: 'Bring to Front', icon: 'bring-to-front' },
    { id: 'send-to-back', label: 'Send to Back', icon: 'send-to-back' },
  ];

  @Event() 
  actionSelected: EventEmitter<string>;

  private handleItemClick(item: ContextMenuItem) {
    if (!item.disabled) {
      this.actionSelected.emit(item.id);
    }
  }

  render() {
    return (
      <Host>
        <div class="menu-container">
          {this.items.map(item => (
            <button
              key={item.id}
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
