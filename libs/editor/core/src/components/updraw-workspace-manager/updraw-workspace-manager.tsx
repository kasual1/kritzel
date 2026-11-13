import { UpdrawWorkspace } from '@updraw/core';
import { IUpdrawMenuItem } from '@updraw/core';
import { UpdrawTermKey } from '@updraw/core';
import { Host, h, Component, State, Prop, Event, EventEmitter, Element, Listen, Method } from '@stencil/core';

@Component({
  tag: 'updraw-workspace-manager',
  styleUrl: 'updraw-workspace-manager.css',
  shadow: true,
})
export class UpdrawWorkspaceManager {
  @Element() host!: HTMLElement;

  /**
   * Whether the workspace manager is visible
   */
  @Prop() visible: boolean = false;

  @Prop({ mutable: true }) activeWorkspace: UpdrawWorkspace;
  @Prop() workspaces: UpdrawWorkspace[] = [];

  /** Resolved localized strings keyed by term key, supplied by the editor. */
  @Prop() terms: Partial<Record<UpdrawTermKey, string>> = {};

  @Event() isWorkspaceManagerReady: EventEmitter<void>;
  @Event() workspaceChange: EventEmitter<UpdrawWorkspace>;

  @State() childMenuAnchor: HTMLElement = null;
  @State() openChildMenuItem: IUpdrawMenuItem = null;
  @State() newWorkspace: UpdrawWorkspace | null = null;
  @State() editingItemId: string | null = null;

  @Listen('wheel', { target: 'window', passive: false })
  handleWheel(event: WheelEvent) {
    if(event.ctrlKey){
      event.preventDefault();
    }
  }

  updrawEngineRef: HTMLUpdrawEngineElement | null = null;
  splitButtonRef!: HTMLUpdrawSplitButtonElement;

  get sortedWorkspaces() {
    return [this.newWorkspace, ...this.workspaces].filter(ws => ws != null).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async componentWillLoad() {
    await this.initializeEngine();
    this.isWorkspaceManagerReady.emit();
  }

  @Method()
  async open(): Promise<void> {
    if (!this.visible) {
      return;
    }

    await this.splitButtonRef?.open();
  }

  @Method()
  async close(): Promise<void> {
    await this.splitButtonRef?.close();
  }

  private async initializeEngine() {
    await customElements.whenDefined('updraw-engine');
    // Search for updraw-engine in the closest updraw-editor ancestor
    const editor = this.host.closest('updraw-editor');
    this.updrawEngineRef = editor?.querySelector('updraw-engine') ?? null;

    if (!this.updrawEngineRef) {
      console.warn('updraw-engine not found in updraw-editor.');
    }
  }

  private async select(item: IUpdrawMenuItem, parent: IUpdrawMenuItem) {
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
    await this.splitButtonRef.open();
    this.newWorkspace = new UpdrawWorkspace({ name: 'New Workspace' });
    this.editingItemId = this.newWorkspace.id;
  }

  private edit(item: IUpdrawMenuItem) {
    this.openChildMenuItem = null;
    this.childMenuAnchor = null;
    requestAnimationFrame(() => {
      this.editingItemId = item.id;
    });
  }

  private async save(item: IUpdrawMenuItem) {
    if (this.newWorkspace) {
      this.newWorkspace.name = item.label;
      await this.updrawEngineRef?.createWorkspace(this.newWorkspace);
      this.workspaceChange.emit(this.newWorkspace);
    } else {
      const workspace = item.value;
      workspace.name = item.label;
      await this.updrawEngineRef?.updateWorkspace(workspace);
    }

    this.editingItemId = null;
    this.newWorkspace = null;
  }

  private cancel() {
    this.newWorkspace = null;
    this.editingItemId = null;
  }

  private async delete(item: IUpdrawMenuItem) {
    this.openChildMenuItem = null;
    this.childMenuAnchor = null;

    await this.updrawEngineRef?.deleteWorkspace(item.value);

    if (item.value.id === this.activeWorkspace?.id) {
      this.activeWorkspace = this.sortedWorkspaces.find(ws => ws.id !== item.value.id) || null;
      this.workspaceChange.emit(this.activeWorkspace);
    }

    await this.splitButtonRef.focusMenu();
  }

  private toggleChildMenu(item: IUpdrawMenuItem, anchor: HTMLElement) {
    this.openChildMenuItem = item;
    this.childMenuAnchor = anchor;
  }

  private closeChildMenu() {
    this.openChildMenuItem = null;
    this.childMenuAnchor = null;
  }

  private handleMenuOpen() {
    // Menu open - engine remains interactive
  }

  private handleMenuClose() {
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
          icon: ws.isPublic ? 'usersRound' : undefined,
          iconTooltip: ws.isPublic ? (this.terms['workspace.sharedTooltip'] ?? 'Shared workspace') : undefined,
          value: ws,
          isEditing: this.editingItemId === ws.id,
          isSelected: this.activeWorkspace?.id === ws.id,
          isNewItem: this.newWorkspace?.id === ws.id,
          isChildMenuOpen: this.openChildMenuItem?.id === ws.id,
          childMenuAnchor: this.openChildMenuItem?.id === ws.id ? this.childMenuAnchor : null,
          children: [
            {
              id: `${ws.id}-rename`,
              label: this.terms['workspace.rename'] ?? 'Rename',
              value: 'rename',
              action: (_item, parent) => this.edit(parent),
            },
            {
              id: `${ws.id}-delete`,
              label: this.terms['workspace.delete'] ?? 'Delete',
              value: 'delete',
              isDisabled: this.sortedWorkspaces.length <= 1,
              action: (_item, parent) => this.delete(parent),
            },
          ],
        };
      });

    return (
      <Host style={{ display: this.visible ? '' : 'none' }}>
        <div class={{ manager: true, visible: this.visible }}>
          <updraw-split-button
            ref={el => (this.splitButtonRef = el)}
            items={menuItems}
            mainButtonDisabled={this.editingItemId != null}
            onMainButtonClick={() => this.add()}
            onItemSelect={event => this.select(event.detail.item, event.detail.parent)}
            onItemToggleChildMenu={event => this.toggleChildMenu(event.detail.item, event.detail.childMenuAnchor)}
            onItemSave={event => this.save(event.detail)}
            onItemCancel={() => this.cancel()}
            onItemCloseChildMenu={() => this.closeChildMenu()}
            onMenuOpen={() => this.handleMenuOpen()}
            onMenuClose={() => this.handleMenuClose()}
          ></updraw-split-button>
        </div>
      </Host>
    );
  }
}
