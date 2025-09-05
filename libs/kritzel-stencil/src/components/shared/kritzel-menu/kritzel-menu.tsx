import { Component, h, Prop, Event, EventEmitter, Listen, Element, Host } from '@stencil/core';

export interface MenuItem<T = any> {
  value: T;
  label: string;
  suffix?: () => JSX.Element;
  disabled?: boolean;
}

@Component({
  tag: 'kritzel-menu',
  styleUrl: 'kritzel-menu.css',
  shadow: true,
})
export class KritzelMenu {
  @Prop()
  items: MenuItem[] = [];

  @Prop({ mutable: true })
  isOpen = false;

  @Event()
  itemSelect: EventEmitter<MenuItem>;

  @Element()
  private element: HTMLElement;

  @Listen('click', { target: 'document' })
  handleDocumentClick(event: MouseEvent) {
    if (this.isOpen && !this.element.contains(event.target as Node)) {
      this.isOpen = false;
    }
  }

  private handleItemClick = (item: MenuItem) => {
    if (!item.disabled) {
      this.itemSelect.emit(item);
      this.isOpen = false;
    }
  };

  render() {
    if (!this.isOpen) {
      return null;
    }

    return (
      <Host>
        {this.items.map(item => (
          <div
            class={{
              'menu-item': true,
              disabled: item.disabled,
            }}
            onClick={() => this.handleItemClick(item)}
          >
            <span>{item.label}</span>
            {item.suffix && item.suffix()}
          </div>
        ))}
      </Host>
    );
  }
}

