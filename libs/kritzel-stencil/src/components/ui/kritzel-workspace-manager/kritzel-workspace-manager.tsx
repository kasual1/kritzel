import { KritzelWorkspace } from '../../../classes/workspace.class';
import { IKritzelMenuItem } from '../../../interfaces/menu-item-new.interface';
import { Host, h, Component, State, Prop, Event, EventEmitter, Element, Watch } from '@stencil/core';

@Component({
  tag: 'kritzel-workspace-manager',
  styleUrl: 'kritzel-workspace-manager.css',
  shadow: true,
})
export class KritzelWorkspaceManager {
  @Element() host!: HTMLElement;

  @Prop() activeWorkspace: KritzelWorkspace;
  @Prop() workspaces: KritzelWorkspace[] = [];
  @Watch('workspaces')
  workspacesChanged(newValue: KritzelWorkspace[], oldValue: KritzelWorkspace[]) {
    console.log('Workspaces changed:', { newValue, oldValue });
  }

  @Event() isWorkspaceManagerReady: EventEmitter<void>;
  @Event() workspaceChange: EventEmitter<KritzelWorkspace>;

  @State() childMenuAnchor: HTMLElement = null;
  @State() openChildMenuItem: IKritzelMenuItem = null;
  @State() newWorkspace: KritzelWorkspace | null = null;
  @State() editingItem: IKritzelMenuItem | null = null;
  
  kritzelEngineRef: HTMLKritzelEngineElement | null = null;
  splitButtonRef!: HTMLKritzelSplitButtonElement;

  newItem: IKritzelMenuItem = {
    id: 'new',
    label: 'New Item',
    isEditing: true,
    isChildMenuOpen: false,
    isSelectable: false,
    children: [
      {
        id: 'edit-test-2',
        label: 'Edit',
        isSelectable: false,
      },
      {
        id: 'delete-test-2',
        label: 'Delete',
        isSelectable: false,
      },
    ],
  };

  async componentWillLoad() {
    await this.initializeEngine();
    this.isWorkspaceManagerReady.emit();
  }

  componentDidRender() {
    // Get reference to split button after rendering
    this.splitButtonRef = this.host.shadowRoot.querySelector('kritzel-split-button');
  }

  private async initializeEngine() {
    await customElements.whenDefined('kritzel-engine');
    this.kritzelEngineRef = this.host.parentElement.querySelector('kritzel-engine');

    if (!this.kritzelEngineRef) {
      throw new Error('kritzel-engine not found in parent element.');
    }
  }

  private select(item: IKritzelMenuItem, parent: IKritzelMenuItem) {
    if(item.value instanceof KritzelWorkspace) {
      this.workspaceChange.emit(item.value);
    }

    if (item.value === 'rename') {
      this.editingItem = parent;
      this.openChildMenuItem = null;
      this.childMenuAnchor = null;
    }
  }

  private toggleChildMenu(item: IKritzelMenuItem, anchor: HTMLElement) {
    this.openChildMenuItem = item;
    this.childMenuAnchor = anchor;
  }

  private cancel() {
    this.editingItem = null;
  }

  render() {
    const menuItems = [...this.workspaces]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(ws => {
        return {
          id: ws.id,
          label: ws.name,
          value: ws,
          isEditing: this.editingItem?.id === ws.id,
          isSelected: this.activeWorkspace?.id === ws.id,
          isChildMenuOpen: this.openChildMenuItem?.id === ws.id,
          childMenuAnchor: this.openChildMenuItem?.id === ws.id ? this.childMenuAnchor : null,
          children: [
            {
              id: `${ws.id}-rename`,
              label: 'Rename',
              value: 'rename',
            },
            {
              id: `${ws.id}-delete`,
              label: 'Delete',
              value: 'delete',
            },
          ],
        };
      });

    return (
      <Host>
        <kritzel-split-button
          items={menuItems}
          // mainButtonDisabled={this.hasEditingItem}
          // onButtonClick={this.handleItemAdd}
          // onClose={this.handleMenuClose}
          onItemSelect={event => this.select(event.detail.item, event.detail.parent)}
          onItemToggleChildMenu={event => this.toggleChildMenu(event.detail.item, event.detail.childMenuAnchor)}
          // onItemSave={event => this.save(event.detail)}
          onItemCancel={() => this.cancel()}
          // onItemCloseChildMenu={event => this.closeChildMenu(event.detail)}
        ></kritzel-split-button>
      </Host>
    );
  }
}
