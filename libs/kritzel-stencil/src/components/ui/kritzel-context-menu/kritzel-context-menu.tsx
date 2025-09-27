import { Component, Host, h, Prop, Event, EventEmitter, State, Watch, Listen, Element } from '@stencil/core';
import { ContextMenuItem } from '../../../interfaces/context-menu-item.interface';
import { KritzelBaseObject } from '../../../classes/objects/base-object.class';

interface ProcessedMenuItem {
  item: ContextMenuItem;
  isDisabled: boolean;
}

@Component({
  tag: 'kritzel-context-menu',
  styleUrl: 'kritzel-context-menu.css',
  shadow: true,
})
export class KritzelContextMenu {
  @Element() host: HTMLElement;

  @Prop() items: ContextMenuItem[];
  @Watch('items')
  onItemsChanged() {
    this.updateMenuItems();
  }

  @Prop() objects: KritzelBaseObject[];

  @Event() actionSelected: EventEmitter<ContextMenuItem>;
  @Event() close: EventEmitter<void>;

  @State() private processedItems: ProcessedMenuItem[] = [];

  @Listen('pointerdown', { target: 'window' })
  handleOutsideClick(event: MouseEvent) {
    event.preventDefault();
    const path = event.composedPath();
    if (!path.includes(this.host)) {
      this.close.emit();
    }
  }

  componentWillLoad() {
    this.updateMenuItems();
  }

  private handleItemClick(item: ContextMenuItem, isDisabled: boolean) {
    if (!isDisabled) {
      this.actionSelected.emit(item);
    }
  }

  private async updateMenuItems() {
    const processed: ProcessedMenuItem[] = [];

    for (const item of this.items) {
      const isVisible = await this.evaluateProperty(item.visible, true);
      if (isVisible) {
        const isDisabled = await this.evaluateProperty(item.disabled, false);
        processed.push({ item, isDisabled });
      }
    }

    this.processedItems = processed;
  }

  private async evaluateProperty(value: boolean | ((obj: KritzelBaseObject, objs: KritzelBaseObject[]) => boolean | Promise<boolean>), defaultValue: boolean): Promise<boolean> {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'function') {
      return await Promise.resolve(value(null, this.objects));
    }
    return defaultValue;
  }

  render() {
    return (
      <Host>
        <div class="menu-container">
          {this.processedItems.map(({ item, isDisabled }, index) => (
            <button
              key={`${item.label}-${index}`}
              class={{ 'menu-item': true, 'disabled': isDisabled }}
              onClick={() => this.handleItemClick(item, isDisabled)}
              disabled={isDisabled}
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
