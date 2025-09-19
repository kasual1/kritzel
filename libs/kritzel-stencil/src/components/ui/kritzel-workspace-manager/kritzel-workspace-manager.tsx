import { KritzelWorkspace } from '../../../classes/workspace.class';
import { ObjectHelper } from '../../../helpers/object.helper';
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

  private async select(item: IKritzelMenuItem, parent: IKritzelMenuItem) {
    if (item.value === 'rename') {
      this.edit(parent);
      return;
    }

    if (item.value === 'delete') {
      this.delete(parent);
      return;
    }

    this.workspaceChange.emit(item.value);
  }

  private toggleChildMenu(item: IKritzelMenuItem, anchor: HTMLElement) {
    this.openChildMenuItem = item;
    this.childMenuAnchor = anchor;
  }

  private async add() {
    this.newWorkspace = new KritzelWorkspace(ObjectHelper.generateUUID(), 'New Workspace');
    this.editingItem = {
      id: this.newWorkspace.id,
      label: this.newWorkspace.name,
      value: this.newWorkspace,
      isEditing: true,
      isSelected: false,
    };
    await this.splitButtonRef.open();
  }

  private edit(item: IKritzelMenuItem) {
    this.editingItem = item;
    this.openChildMenuItem = null;
    this.childMenuAnchor = null;
  }

  private async save(item: IKritzelMenuItem) {
    try {
      if (this.newWorkspace) {
        await this.kritzelEngineRef.createWorkspace({ ...item.value, name: item.label });
        this.newWorkspace = null;
        this.editingItem = null;
      } else {
        await this.kritzelEngineRef.updateWorkspace({ ...item.value, name: item.label });
        this.editingItem = null;
      }
    } catch (error) {
      console.error('Error saving workspace:', error);
    }
  }

  private cancel() {
    this.newWorkspace = null;
    this.editingItem = null;
  }

  private async delete(item: IKritzelMenuItem) {
    await this.kritzelEngineRef.deleteWorkspace(item.value);

    this.openChildMenuItem = null;
    this.childMenuAnchor = null;

    if (this.activeWorkspace?.id === item.value.id) {
      this.activeWorkspace = this.sortedWorkspaces[0] || null;
      this.workspaceChange.emit(null);
    }
  }

  private closeChildMenu(item: IKritzelMenuItem) {
    if (this.openChildMenuItem?.id === item.id) {
      this.openChildMenuItem = null;
      this.childMenuAnchor = null;
    }
  }

  get sortedWorkspaces() {
    return [this.newWorkspace, ...this.workspaces].filter(ws => ws != null).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  render() {
    const menuItems = this.sortedWorkspaces
      .filter(item => item != null)
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
          onButtonClick={() => this.add()}
          onItemSelect={event => this.select(event.detail.item, event.detail.parent)}
          onItemToggleChildMenu={event => this.toggleChildMenu(event.detail.item, event.detail.childMenuAnchor)}
          onItemSave={event => this.save(event.detail)}
          onItemCancel={() => this.cancel()}
          onItemCloseChildMenu={event => this.closeChildMenu(event.detail)}
        ></kritzel-split-button>
      </Host>
    );
  }
}
