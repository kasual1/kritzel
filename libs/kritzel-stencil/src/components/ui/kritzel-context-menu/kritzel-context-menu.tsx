import { Component, Host, h, Prop, Event, EventEmitter, Element } from '@stencil/core';
import { ContextMenuItem } from '../../../interfaces/context-menu-item.interface';

@Component({
  tag: 'kritzel-context-menu',
  styleUrl: 'kritzel-context-menu.css',
  shadow: true,
})
export class KritzelContextMenu {
  @Prop()
  items: ContextMenuItem[];

  @Event()
  actionSelected: EventEmitter<ContextMenuItem>;

  @Element()
  hostElement: HTMLElement;

  private handleItemClick(item: ContextMenuItem) {
    
    const isDisabled = typeof item.disabled === 'function' ? item.disabled() : item.disabled;

    if (!isDisabled) {
      this.actionSelected.emit(item);
    }
  }

  render() {
    return (
      <Host>
        <div class="menu-container">
          {this.items.map(item => (
            <button
              key={`${item.label}-${this.items.indexOf(item)}`}
              class={{ 'menu-item': true, 'disabled': typeof item.disabled === 'function' ? item.disabled() : item.disabled }}
              onClick={() => this.handleItemClick(item)}
              onTouchStart={() => this.handleItemClick(item)}
              disabled={typeof item.disabled === 'function' ? item.disabled() : item.disabled}
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
