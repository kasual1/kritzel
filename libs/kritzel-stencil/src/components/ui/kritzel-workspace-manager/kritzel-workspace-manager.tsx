import { Component, Element, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { KritzelWorkspace } from '../../../classes/workspace.class';
import { ObjectHelper } from '../../../helpers/object.helper';
import { MenuItem } from '../../shared/kritzel-menu/kritzel-menu';

@Component({
  tag: 'kritzel-workspace-manager',
  styleUrl: 'kritzel-workspace-manager.css',
  shadow: true,
})
export class KritzelWorkspaceManager {
  @Prop()
  workspaces: KritzelWorkspace[] = [];

  @Prop({ mutable: true })
  activeWorkspace: KritzelWorkspace;

  @State()
  editingIndex: number | null = null;

  @State()
  newWorkspace: KritzelWorkspace | null = null;

  @Event()
  isWorkspaceManagerReady: EventEmitter<void>;

  @Event()
  workspaceChange: EventEmitter<KritzelWorkspace>;

  @Element()
  host!: HTMLElement;

  kritzelEngine: HTMLKritzelEngineElement | null = null;

  splitButtonRef!: HTMLKritzelSplitButtonElement;

  get sortedWorkspaces() {
    return [...this.workspaces].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  get activeItemIndex() {
    return this.sortedWorkspaces.findIndex(ws => ws.id === this.activeWorkspace?.id);
  }

  async componentWillLoad() {
    await this.initializeEngine();
    this.isWorkspaceManagerReady.emit();
  }

  private async initializeEngine() {
    await customElements.whenDefined('kritzel-engine');
    this.kritzelEngine = this.host.parentElement.querySelector('kritzel-engine');

    if (!this.kritzelEngine) {
      throw new Error('kritzel-engine not found in parent element.');
    }
  }

  changeWorkspace(workspace: KritzelWorkspace) {
    if (this.editingIndex !== null) return;
    this.activeWorkspace = this.sortedWorkspaces.find(ws => ws.id === workspace.id);
    this.workspaceChange.emit(workspace);
  }

  render() {
    const workspaceSelectionOptions: MenuItem<KritzelWorkspace>[] = [this.newWorkspace, ...this.sortedWorkspaces]
      .filter(ws => ws !== null)
      .map(ws => ({
        label: ws.name,
        value: ws,
        select: () => this.changeWorkspace(ws),
        cancel: () => {
          if (this.newWorkspace) {
            this.newWorkspace = null;
          }

          this.editingIndex = null;
        },
        save: async (item: MenuItem) => {
          if (this.newWorkspace) {
            await this.kritzelEngine.createWorkspace(Object.assign(ws, { name: item.label }));
            this.newWorkspace = null;
          } else {
            await this.kritzelEngine.updateWorkspace(Object.assign(ws, { name: item.label }));
          }

          this.editingIndex = null;
        },
        children: [
          {
            label: 'Rename',
            value: 'rename',
            select: (item: MenuItem) => (this.editingIndex = item['_parentIndex']),
          },
          {
            label: 'Delete',
            value: 'delete',
            select: async () => await this.kritzelEngine.deleteWorkspace(ws),
          },
        ],
      }));

    return (
      <Host>
        <kritzel-split-button
          ref={el => (this.splitButtonRef = el)}
          buttonIcon="plus"
          options={workspaceSelectionOptions}
          activeItemIndex={this.activeItemIndex}
          editingIndex={this.editingIndex}
          onButtonClick={() => {
            this.splitButtonRef?.openMenu().then(() => {
              this.newWorkspace = new KritzelWorkspace(ObjectHelper.generateUUID(), 'New Workspace');
              this.editingIndex = 0;
            });
          }}
          onMenuClosed={() => {
            this.editingIndex = null;
            this.newWorkspace = null;
          }}
        ></kritzel-split-button>
      </Host>
    );
  }
}
