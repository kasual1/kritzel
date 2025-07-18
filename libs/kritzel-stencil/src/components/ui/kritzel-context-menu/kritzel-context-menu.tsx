import { Component, Host, h, Prop, Event, EventEmitter, Element, State, Watch } from '@stencil/core';
import { ContextMenuItem } from '../../../interfaces/context-menu-item.interface';
import { KritzelBaseObject } from '../../../classes/objects/base-object.class';

@Component({
  tag: 'kritzel-context-menu',
  styleUrl: 'kritzel-context-menu.css',
  shadow: true,
})
export class KritzelContextMenu {
  @Prop()
  items: ContextMenuItem[];

  @Prop()
  objects: KritzelBaseObject[];

  @Event()
  actionSelected: EventEmitter<ContextMenuItem>;

  @Element()
  hostElement: HTMLElement;

  @State()
  private disabledStates: Map<number, boolean> = new Map();

  @State()
  private visibleItems: ContextMenuItem[] = [];

  componentWillLoad() {
    this.resolveVisibleItems();
    this.resolveDisabledStates();
  }


  @Watch('items')
  onItemsChanged() {
    this.resolveVisibleItems();
    this.resolveDisabledStates();
  }

  private handleItemClick(item: ContextMenuItem, index: number) {
    if (!this.disabledStates.get(index)) {
      this.actionSelected.emit(item);
    }
  }

  private async resolveVisibleItems() {
    const visibleItems: ContextMenuItem[] = [];
    const visibilityPromises = this.items.map(async (item, index) => {
      let isVisible = true;
      if (item.visible !== undefined) {
        if (typeof item.visible === 'boolean') {
          isVisible = item.visible;
        } else if (typeof item.visible === 'function') {
          const result = item.visible(null, this.objects);
          if (result instanceof Promise) {
            isVisible = await result;
          } else {
            isVisible = result;
          }
        }
      }
      return { item, index, isVisible };
    });

    const visibilityResults = await Promise.all(visibilityPromises);
    visibilityResults.forEach(({ item, isVisible }) => {
      if (isVisible) {
        visibleItems.push(item);
      }
    });

    this.visibleItems = visibleItems;
  }

  private async resolveDisabledStates() {
    const newStates = new Map<number, boolean>();
    const disabledPromises = this.visibleItems.map(async (item, index) => {
      let isDisabled = false;
      if (typeof item.disabled === 'boolean') {
        isDisabled = item.disabled;
      } else if (typeof item.disabled === 'function') {
        const result = item.disabled(null, this.objects);
        if (result instanceof Promise) {
          isDisabled = await result;
        } else {
          isDisabled = result;
        }
      }
      newStates.set(index, isDisabled);
    });

    await Promise.all(disabledPromises);
    this.disabledStates = new Map(newStates);
  }

  render() {
    return (
      <Host>
        <div class="menu-container">
          {this.visibleItems.map((item, index) => {
            const isDisabled = this.disabledStates.get(index) ?? false;
            return (
              <button
                key={`${item.label}-${index}`}
                class={{ 'menu-item': true, 'disabled': isDisabled }}
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
