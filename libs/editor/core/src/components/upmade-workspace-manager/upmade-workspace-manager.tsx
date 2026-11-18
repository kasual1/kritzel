import { UpmadeWorkspace } from '@upmade/core';
import { IUpmadeMenuItem } from '@upmade/core';
import { UpmadeTermKey } from '@upmade/core';
import { Host, h, Component, State, Prop, Event, EventEmitter, Element, Listen, Method } from '@stencil/core';

@Component({
  tag: 'upmade-workspace-manager',
  styleUrl: 'upmade-workspace-manager.css',
  shadow: true,
})
export class UpmadeWorkspaceManager {
  @Element() host!: HTMLElement;

  /**
   * Whether the workspace manager is visible
   */
  @Prop() visible: boolean = false;

  @Prop({ mutable: true }) activeWorkspace: UpmadeWorkspace;
  @Prop() workspaces: UpmadeWorkspace[] = [];

  /** Resolved localized strings keyed by term key, supplied by the editor. */
  @Prop() terms: Partial<Record<UpmadeTermKey, string>> = {};

  @Event() isWorkspaceManagerReady: EventEmitter<void>;
  @Event() workspaceChange: EventEmitter<UpmadeWorkspace>;

  @State() childMenuAnchor: HTMLElement = null;
  @State() openChildMenuItem: IUpmadeMenuItem = null;
  @State() newWorkspace: UpmadeWorkspace | null = null;
  @State() editingItemId: string | null = null;

  @Listen('wheel', { target: 'window', passive: false })
  handleWheel(event: WheelEvent) {
    if(event.ctrlKey){
      event.preventDefault();
    }
  }

  upmadeEngineRef: HTMLUpmadeEngineElement | null = null;
  splitButtonRef!: HTMLUpmadeSplitButtonElement;

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
    await customElements.whenDefined('upmade-engine');
    // Search for upmade-engine in the closest upmade-editor ancestor
    const editor = this.host.closest('upmade-editor');
    this.upmadeEngineRef = editor?.querySelector('upmade-engine') ?? null;

    if (!this.upmadeEngineRef) {
      console.warn('upmade-engine not found in upmade-editor.');
    }
  }

  private async select(item: IUpmadeMenuItem, parent: IUpmadeMenuItem) {
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
    this.newWorkspace = new UpmadeWorkspace({ name: 'New Workspace' });
    this.editingItemId = this.newWorkspace.id;
  }

  private edit(item: IUpmadeMenuItem) {
    this.openChildMenuItem = null;
    this.childMenuAnchor = null;
    requestAnimationFrame(() => {
      this.editingItemId = item.id;
    });
  }

  private async save(item: IUpmadeMenuItem) {
    if (this.newWorkspace) {
      this.newWorkspace.name = item.label;
      await this.upmadeEngineRef?.createWorkspace(this.newWorkspace);
      this.workspaceChange.emit(this.newWorkspace);
    } else {
      const workspace = item.value;
      workspace.name = item.label;
      await this.upmadeEngineRef?.updateWorkspace(workspace);
    }

    this.editingItemId = null;
    this.newWorkspace = null;
  }

  private cancel() {
    this.newWorkspace = null;
    this.editingItemId = null;
  }

  private async delete(item: IUpmadeMenuItem) {
    this.openChildMenuItem = null;
    this.childMenuAnchor = null;

    await this.upmadeEngineRef?.deleteWorkspace(item.value);

    if (item.value.id === this.activeWorkspace?.id) {
      this.activeWorkspace = this.sortedWorkspaces.find(ws => ws.id !== item.value.id) || null;
      this.workspaceChange.emit(this.activeWorkspace);
    }

    await this.splitButtonRef.focusMenu();
  }

  private toggleChildMenu(item: IUpmadeMenuItem, anchor: HTMLElement) {
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
          <upmade-split-button
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
          ></upmade-split-button>
        </div>
      </Host>
    );
  }
}
