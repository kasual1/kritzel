import { Component, Host, h, Prop, Event, EventEmitter, Element, State, Watch } from '@stencil/core';
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

  @State()
  private disabledStates: Map<number, boolean> = new Map();

  componentWillLoad() {
    this.resolveDisabledStates();
  }

  @Watch('items')
  onItemsChanged() {
    this.resolveDisabledStates();
  }

  private handleItemClick(item: ContextMenuItem, index: number) {
      if (!this.disabledStates.get(index)) {
      this.actionSelected.emit(item);
    }
  }

   private async resolveDisabledStates() {
    const newStates = new Map<number, boolean>();
    const promises = this.items.map(async (item, index) => {
      let isDisabled = false;
      if (typeof item.disabled === 'boolean') {
        isDisabled = item.disabled;
      } else if (typeof item.disabled === 'function') {
        const result = item.disabled();
        if (result instanceof Promise) {
          isDisabled = await result;
        } else {
          isDisabled = result;
        }
      }
      newStates.set(index, isDisabled);
    });

    await Promise.all(promises);
    this.disabledStates = new Map(newStates);
  }

  render() {
    return (
      <Host>
        <div class="menu-container">
          {this.items.map((item, index) => {
            const isDisabled = this.disabledStates.get(index) ?? false;
            return (
              <button
                key={`${item.label}-${index}`}
                class={{ 'menu-item': true, disabled: isDisabled }}
                onClick={() => this.handleItemClick(item, index)}
                onTouchStart={() => this.handleItemClick(item, index)}
                disabled={isDisabled}
              >
                {item.icon && <kritzel-icon name={item.icon} size={16}></kritzel-icon>}
                <span class="label">{item.label}</span>
              </button>
            );
          })}
        </div>
      </Host>
    );
  }
}
