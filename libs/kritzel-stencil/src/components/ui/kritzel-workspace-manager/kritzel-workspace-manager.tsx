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

  @Prop()
  activeWorkspace: KritzelWorkspace;

  @State()
  editingIndex: number | null = null;

  @State()
  isNewWorkspace: boolean = false;

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

  async createWorkspace() {
    const newWorkspace = new KritzelWorkspace(ObjectHelper.generateUUID(), 'New Workspace');

    await this.kritzelEngine.createWorkspace(newWorkspace);

    this.splitButtonRef?.openMenu();

    requestAnimationFrame(() => {
      this.isNewWorkspace = true;
      this.editingIndex = 0;
    });
  }

  changeWorkspace(workspace: KritzelWorkspace) {
    this.activeWorkspace = this.sortedWorkspaces.find(ws => ws.id === workspace.id);
    this.workspaceChange.emit(workspace);
  }

  render() {
    const workspaceSelectionOptions: MenuItem<KritzelWorkspace>[] = this.sortedWorkspaces.map(ws => ({
      label: ws.name,
      value: ws,
      select: () => {
        if (this.editingIndex !== null) return;
        this.changeWorkspace(ws);
      },
      cancel: () => {
        if (this.isNewWorkspace) {
          this.isNewWorkspace = false;
          this.kritzelEngine.deleteWorkspace(ws);
        }

        this.editingIndex = null;
      },
      save: (item: MenuItem) => {
        this.kritzelEngine.updateWorkspace({ ...ws, name: item.label });
        this.workspaces = this.sortedWorkspaces.map(w => (w.id === ws.id ? { ...w, name: item.label } : w));
        this.isNewWorkspace = false;
        this.editingIndex = null;
        this.activeWorkspace = this.sortedWorkspaces[0];
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
          select: async () => {
            await this.kritzelEngine.deleteWorkspace(ws);
            this.activeWorkspace = this.sortedWorkspaces[Math.min(this.sortedWorkspaces.findIndex(ws => ws.id === this.activeWorkspace.id), this.sortedWorkspaces.length - 2)];
          },
        },
      ],
    }));

    return (
      <Host>
        <kritzel-split-button
          ref={el => (this.splitButtonRef = el)}
          buttonIcon="plus"
          options={workspaceSelectionOptions}
          activeItemIndex={this.sortedWorkspaces.findIndex(ws => ws.id === this.activeWorkspace.id)}
          editingIndex={this.editingIndex}
          onButtonClick={() => this.createWorkspace()}
          onMenuClosed={() => {
            this.editingIndex = null;

            if (this.isNewWorkspace) {
              this.isNewWorkspace = false;
              this.kritzelEngine.deleteWorkspace(this.sortedWorkspaces[0]);
            }
          }}
        ></kritzel-split-button>
      </Host>
    );
  }
}
