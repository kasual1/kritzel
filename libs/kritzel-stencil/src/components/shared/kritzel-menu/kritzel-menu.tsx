import { Component, h, Prop, Host, State, Listen, Element } from '@stencil/core';

export interface MenuItem<T = any> {
  value: T;
  label: string;
  action?: () => void;
  disabled?: boolean;
  children?: MenuItem[];
  inEditMode?: boolean;
}

@Component({
  tag: 'kritzel-menu',
  styleUrl: 'kritzel-menu.css',
  shadow: true,
})
export class KritzelMenu {
  @Element() 
  host: HTMLElement;

  @Prop()
  items: MenuItem[] = [];

  @State()
  openChildMenuIndex: number | null = null;

  @Listen('click', { target: 'window' })
  handleWindowClick(event: MouseEvent) {
    if (this.openChildMenuIndex === null) {
      return;
    }

    const target = event.target as HTMLElement;
    if (!this.host.contains(target)) {
      this.openChildMenuIndex = null;
    }
  }

  private toggleChildMenu(index: number, event: MouseEvent) {
    event.stopPropagation();
    this.openChildMenuIndex = this.openChildMenuIndex === index ? null : index;

  }

  render() {
    return (
      <Host>
        {this.items.map((item, index )=> (
          <div
            class={{
              'menu-item': true,
              'disabled': item.disabled,
              'inactive': this.openChildMenuIndex !== null && this.openChildMenuIndex !== index,
              'child-open': this.openChildMenuIndex === index,
              'edit-mode': item.inEditMode,
            }}
            onClick={() => item.action?.()}
          >
            {item.inEditMode ? (
              <div style={{ flexGrow: '1' }}>
                <input
                  type="text"
                  name={'menu-item-' + index}
                  value={item.label}
                  style={{ width: '100%' }}
                />
              </div>
            ) : (
              <span>{item.label}</span>
            )}


            {item.inEditMode && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <kritzel-icon name="x" size={16} onClick={(e) => this.toggleChildMenu(index, e)}></kritzel-icon>
                <kritzel-icon name="check" size={16}></kritzel-icon>
              </div>
            )}


            {!item.inEditMode && item.children && item.children.length > 0 && (
              <div style={{ position: 'relative' }}>
                <kritzel-icon name="ellipsis-vertical" size={16} onClick={(e) => this.toggleChildMenu(index, e)}></kritzel-icon>

                {this.openChildMenuIndex === index && (
                  <kritzel-menu style={{ position: 'absolute', left: '0', top: '100%', zIndex: '3', minWidth: '100px' }} items={item.children}></kritzel-menu>
                )}
              </div>
            )}
          </div>
        ))}
      </Host>
    );
  }
}
