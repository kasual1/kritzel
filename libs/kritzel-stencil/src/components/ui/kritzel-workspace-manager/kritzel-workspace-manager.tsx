import { KritzelWorkspace } from '../../../classes/workspace.class';
import { ObjectHelper } from '../../../helpers/object.helper';
import { IKritzelMenuItem } from '../../../interfaces/menu-item.interface';
import { Host, h, Component, State, Prop, Event, EventEmitter, Element } from '@stencil/core';

@Component({
  tag: 'kritzel-workspace-manager',
  styleUrl: 'kritzel-workspace-manager.css',
  shadow: true,
})
export class KritzelWorkspaceManager {
  @Element() host!: HTMLElement;

  @Prop() activeWorkspace: KritzelWorkspace;
  @Prop() workspaces: KritzelWorkspace[] = [];

  @Event() isWorkspaceManagerReady: EventEmitter<void>;
  @Event() workspaceChange: EventEmitter<KritzelWorkspace>;

  @State() childMenuAnchor: HTMLElement = null;
  @State() openChildMenuItem: IKritzelMenuItem = null;
  @State() newWorkspace: KritzelWorkspace | null = null;
  @State() editingItemId: string | null = null;

  kritzelEngineRef: HTMLKritzelEngineElement | null = null;
  splitButtonRef!: HTMLKritzelSplitButtonElement;

  get sortedWorkspaces() {
    return [this.newWorkspace, ...this.workspaces].filter(ws => ws != null).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async componentWillLoad() {
    await this.initializeEngine();
    this.isWorkspaceManagerReady.emit();
  }

  private async initializeEngine() {
    await customElements.whenDefined('kritzel-engine');
    this.kritzelEngineRef = this.host.parentElement.querySelector('kritzel-engine');

    if (!this.kritzelEngineRef) {
      throw new Error('kritzel-engine not found in parent element.');
    }
  }

  private async select(item: IKritzelMenuItem, parent: IKritzelMenuItem) {
    if (this.editingItemId) {
      return;
    }

    if (item.action) {
      item.action(item, parent);
      return;
    }

    this.workspaceChange.emit(item.value);
  }

  private async add() {
    this.newWorkspace = new KritzelWorkspace(ObjectHelper.generateUUID(), 'New Workspace');
    this.editingItemId = this.newWorkspace.id;
    await this.splitButtonRef.open();
  }

  private edit(item: IKritzelMenuItem) {
    this.openChildMenuItem = null;
    this.childMenuAnchor = null;
    requestAnimationFrame(() => {
      this.editingItemId = item.id;
    });
  }

  private async save(item: IKritzelMenuItem) {
    if (this.newWorkspace) {
      this.newWorkspace.name = item.label;
      await this.kritzelEngineRef.createWorkspace(this.newWorkspace);
      this.workspaceChange.emit(this.newWorkspace);
    } else {
      await this.kritzelEngineRef.updateWorkspace({ ...item.value, name: item.label });
    }

    this.editingItemId = null;
    this.newWorkspace = null;
  }

  private cancel() {
    this.newWorkspace = null;
    this.editingItemId = null;
  }

  private async delete(item: IKritzelMenuItem) {
    this.openChildMenuItem = null;
    this.childMenuAnchor = null;

    await this.kritzelEngineRef.deleteWorkspace(item.value);

    if(item.value.id === this.activeWorkspace?.id){
      this.activeWorkspace = this.sortedWorkspaces.find(ws => ws.id !== item.value.id) || null;
      this.workspaceChange.emit(this.activeWorkspace);
    }

    await this.splitButtonRef.focusMenu();
  }

  private toggleChildMenu(item: IKritzelMenuItem, anchor: HTMLElement) {
    this.openChildMenuItem = item;
    this.childMenuAnchor = anchor;
  }

  private closeChildMenu() {
    this.openChildMenuItem = null;
    this.childMenuAnchor = null;
  }

  private closeMenu() {
    this.cancel();
    this.closeChildMenu();
  }

  render() {
    const menuItems = this.sortedWorkspaces
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .filter(ws => ws !== null)
      .map(ws => {
        return {
          id: ws.id,
          label: ws.name,
          value: ws,
          isEditing: this.editingItemId === ws.id,
          isSelected: this.activeWorkspace?.id === ws.id,
          isNewItem: this.newWorkspace?.id === ws.id,
          isChildMenuOpen: this.openChildMenuItem?.id === ws.id,
          childMenuAnchor: this.openChildMenuItem?.id === ws.id ? this.childMenuAnchor : null,
          children: [
            {
              id: `${ws.id}-rename`,
              label: 'Rename',
              value: 'rename',
              action: (_item, parent) => this.edit(parent),
            },
            {
              id: `${ws.id}-delete`,
              label: 'Delete',
              value: 'delete',
              isDisabled: this.sortedWorkspaces.length <= 1,
              action: (_item, parent) => this.delete(parent),
            },
          ],
        };
      });

    return (
      <Host>
        <kritzel-split-button
          ref={el => (this.splitButtonRef = el)}
          items={menuItems}
          mainButtonDisabled={this.editingItemId != null}
          onButtonClick={() => this.add()}
          onItemSelect={event => this.select(event.detail.item, event.detail.parent)}
          onItemToggleChildMenu={event => this.toggleChildMenu(event.detail.item, event.detail.childMenuAnchor)}
          onItemSave={event => this.save(event.detail)}
          onItemCancel={() => this.cancel()}
          onItemCloseChildMenu={() => this.closeChildMenu()}
          onClose={() => {
            this.closeMenu();
          }}
        ></kritzel-split-button>
      </Host>
    );
  }
}
