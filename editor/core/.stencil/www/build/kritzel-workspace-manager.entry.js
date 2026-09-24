import { r as registerInstance, a as createEvent, e as getElement, h, d as Host } from './index-BDyeD8t8.js';
import { E as KritzelWorkspace } from './index-BEzQin2J.js';
import './yjs-CvNgPRai.js';

const kritzelWorkspaceManagerCss = () => `:host{display:flex;flex-direction:column;z-index:1}.manager{opacity:0;pointer-events:none;transition:opacity 0.2s ease-out}.manager.visible{opacity:1;pointer-events:auto}`;

const KritzelWorkspaceManager = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.isWorkspaceManagerReady = createEvent(this, "isWorkspaceManagerReady", 7);
        this.workspaceChange = createEvent(this, "workspaceChange", 7);
    }
    get host() { return getElement(this); }
    /**
     * Whether the workspace manager is visible
     */
    visible = false;
    activeWorkspace;
    workspaces = [];
    /** Resolved localized strings keyed by term key, supplied by the editor. */
    terms = {};
    isWorkspaceManagerReady;
    workspaceChange;
    childMenuAnchor = null;
    openChildMenuItem = null;
    newWorkspace = null;
    editingItemId = null;
    handleWheel(event) {
        if (event.ctrlKey) {
            event.preventDefault();
        }
    }
    kritzelEngineRef = null;
    splitButtonRef;
    get sortedWorkspaces() {
        return [this.newWorkspace, ...this.workspaces].filter(ws => ws != null).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    async componentWillLoad() {
        await this.initializeEngine();
        this.isWorkspaceManagerReady.emit();
    }
    async open() {
        if (!this.visible) {
            return;
        }
        await this.splitButtonRef?.open();
    }
    async close() {
        await this.splitButtonRef?.close();
    }
    async initializeEngine() {
        await customElements.whenDefined('kritzel-engine');
        // Search for kritzel-engine in the closest kritzel-editor ancestor
        const editor = this.host.closest('kritzel-editor');
        this.kritzelEngineRef = editor?.querySelector('kritzel-engine') ?? null;
        if (!this.kritzelEngineRef) {
            console.warn('kritzel-engine not found in kritzel-editor.');
        }
    }
    async select(item, parent) {
        if (this.editingItemId) {
            return;
        }
        if (item.action) {
            item.action(item, parent);
            return;
        }
        this.workspaceChange.emit(item.value);
    }
    async add() {
        await this.splitButtonRef.open();
        this.newWorkspace = new KritzelWorkspace({ name: 'New Workspace' });
        this.editingItemId = this.newWorkspace.id;
    }
    edit(item) {
        this.openChildMenuItem = null;
        this.childMenuAnchor = null;
        requestAnimationFrame(() => {
            this.editingItemId = item.id;
        });
    }
    async save(item) {
        if (this.newWorkspace) {
            this.newWorkspace.name = item.label;
            await this.kritzelEngineRef?.createWorkspace(this.newWorkspace);
            this.workspaceChange.emit(this.newWorkspace);
        }
        else {
            const workspace = item.value;
            workspace.name = item.label;
            await this.kritzelEngineRef?.updateWorkspace(workspace);
        }
        this.editingItemId = null;
        this.newWorkspace = null;
    }
    cancel() {
        this.newWorkspace = null;
        this.editingItemId = null;
    }
    async delete(item) {
        this.openChildMenuItem = null;
        this.childMenuAnchor = null;
        await this.kritzelEngineRef?.deleteWorkspace(item.value);
        if (item.value.id === this.activeWorkspace?.id) {
            this.activeWorkspace = this.sortedWorkspaces.find(ws => ws.id !== item.value.id) || null;
            this.workspaceChange.emit(this.activeWorkspace);
        }
        await this.splitButtonRef.focusMenu();
    }
    toggleChildMenu(item, anchor) {
        this.openChildMenuItem = item;
        this.childMenuAnchor = anchor;
    }
    closeChildMenu() {
        this.openChildMenuItem = null;
        this.childMenuAnchor = null;
    }
    handleMenuOpen() {
        // Menu open - engine remains interactive
    }
    handleMenuClose() {
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
        return (h(Host, { style: { display: this.visible ? '' : 'none' } }, h("div", { class: { manager: true, visible: this.visible } }, h("kritzel-split-button", { ref: el => (this.splitButtonRef = el), items: menuItems, mainButtonDisabled: this.editingItemId != null, onMainButtonClick: () => this.add(), onItemSelect: event => this.select(event.detail.item, event.detail.parent), onItemToggleChildMenu: event => this.toggleChildMenu(event.detail.item, event.detail.childMenuAnchor), onItemSave: event => this.save(event.detail), onItemCancel: () => this.cancel(), onItemCloseChildMenu: () => this.closeChildMenu(), onMenuOpen: () => this.handleMenuOpen(), onMenuClose: () => this.handleMenuClose() }))));
    }
};
KritzelWorkspaceManager.style = kritzelWorkspaceManagerCss();

export { KritzelWorkspaceManager as kritzel_workspace_manager };
//# sourceMappingURL=kritzel-workspace-manager.entry.esm.js.map

//# sourceMappingURL=kritzel-workspace-manager.entry.js.map