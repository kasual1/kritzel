// import { Component, Element, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
// import { KritzelWorkspace } from '../../../classes/workspace.class';
// import { ObjectHelper } from '../../../helpers/object.helper';
// import { KritzelMenuItem } from '../../../interfaces/menu-item.interface';

import { Component } from "@stencil/core";

@Component({
  tag: 'kritzel-workspace-manager',
  styleUrl: 'kritzel-workspace-manager.css',
  shadow: true,
})
export class KritzelWorkspaceManager {
  // @Prop()
  // workspaces: KritzelWorkspace[] = [];

  // @Prop({ mutable: true })
  // activeWorkspace: KritzelWorkspace;

  // @State()
  // editingIndex: number | null = null;

  // @State()
  // newWorkspace: KritzelWorkspace | null = null;

  // @Event()
  // isWorkspaceManagerReady: EventEmitter<void>;

  // @Event()
  // workspaceChange: EventEmitter<KritzelWorkspace>;

  // @Element()
  // host!: HTMLElement;

  // kritzelEngine: HTMLKritzelEngineElement | null = null;

  // splitButtonRef!: HTMLKritzelSplitButtonElement;

  // get sortedWorkspaces() {
  //   const uniqueWorkspaces = [...new Map(this.workspaces.map(workspace => [workspace.id, workspace])).values()];
  //   return [this.newWorkspace, ...uniqueWorkspaces].filter(ws => ws !== null).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  // }

  // get activeItemIndex() {
  //   return this.sortedWorkspaces.findIndex(ws => ws.id === this.activeWorkspace?.id);
  // }

  // async componentWillLoad() {
  //   await this.initializeEngine();
  //   this.isWorkspaceManagerReady.emit();
  // }

  // private async initializeEngine() {
  //   await customElements.whenDefined('kritzel-engine');
  //   this.kritzelEngine = this.host.parentElement.querySelector('kritzel-engine');

  //   if (!this.kritzelEngine) {
  //     throw new Error('kritzel-engine not found in parent element.');
  //   }
  // }

  // private handleSelect(workspace: KritzelWorkspace) {
  //   this.selectWorkspace(workspace);
  // }

  // private handleNewWorkspace = async () => {
  //   await this.splitButtonRef?.openMenu();

  //   requestAnimationFrame(() => {
  //     this.newWorkspace = new KritzelWorkspace(ObjectHelper.generateUUID(), 'New Workspace');
  //     this.editingIndex = 0;
  //   });
  // };

  // private handleMenuClosed = () => {
  //   this.editingIndex = null;
  //   this.newWorkspace = null;
  // };

  // private handleSave = async (item: KritzelMenuItem<KritzelWorkspace>) => {
  //   const workspace = item.value;
  //   const updatedWorkspace = { ...workspace, name: item.label };

  //   if (this.newWorkspace) {
  //     await this.kritzelEngine.createWorkspace(updatedWorkspace);

  //     this.editingIndex = null;
  //     this.newWorkspace = null;

  //     this.selectWorkspace(updatedWorkspace);
  //   } else {
  //     await this.kritzelEngine.updateWorkspace(updatedWorkspace);

  //     this.editingIndex = null;
  //     this.newWorkspace = null;
  //   }
  // };

  // private handleRename = (index: number) => {
  //   this.editingIndex = index;
  // };

  // private handleDelete = async (workspaceToDelete: KritzelWorkspace) => {
  //   await this.kritzelEngine.deleteWorkspace(workspaceToDelete);

  //   if (this.activeWorkspace?.id === workspaceToDelete.id) {
  //     const newActiveWorkspace = this.sortedWorkspaces.find(w => w.id !== workspaceToDelete.id) || null;
  //     this.selectWorkspace(newActiveWorkspace);
  //   }
  // };

  // private selectWorkspace(workspace: KritzelWorkspace) {
  //   if (this.editingIndex !== null) return;
  //   this.activeWorkspace = this.sortedWorkspaces.find(ws => ws.id === workspace.id);
  //   this.workspaceChange.emit(workspace);
  // }

  // render() {
  //   const workspaceSelectionOptions: KritzelMenuItem<KritzelWorkspace>[] = this.sortedWorkspaces.map((ws, index) => ({
  //     label: ws.name,
  //     value: ws,
  //     select: () => this.handleSelect(ws),
  //     cancel: this.handleMenuClosed,
  //     save: this.handleSave,
  //     children: [
  //       {
  //         label: 'Rename',
  //         value: 'rename',
  //         select: () => this.handleRename(index),
  //       },
  //       {
  //         label: 'Delete',
  //         value: 'delete',
  //         disabled: this.sortedWorkspaces.length <= 1,
  //         select: () => this.handleDelete(ws),
  //       },
  //     ],
  //   }));

  //   return (
  //     <Host>
  //       {/* <kritzel-split-button
  //         ref={el => (this.splitButtonRef = el)}
  //         buttonIcon="plus"
  //         // options={workspaceSelectionOptions}
  //         activeItemIndex={this.activeItemIndex}
  //         editingIndex={this.editingIndex}
  //         onButtonClick={this.handleNewWorkspace}
  //         onMenuClosed={this.handleMenuClosed}
  //       ></kritzel-split-button> */}
  //     </Host>
  //   );
  // }
}
