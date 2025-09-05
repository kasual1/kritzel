import { Component, h, Prop, Event, EventEmitter, Listen, Element, Host } from '@stencil/core';

export interface MenuItem<T = any> {
  value: T;
  label: string;
  action?: () => void;
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

  @Event()
  itemSelect: EventEmitter<MenuItem>;

  render() {
    return (
      <Host>
        {this.items.map(item => (
          <div
            class={{
              'menu-item': true,
              'disabled': item.disabled,
            }}
            onClick={() => item.action?.()}
          >
            <span>{item.label}</span>
            {item.suffix && item.suffix()}
          </div>
        ))}
      </Host>
    );
  }
}
