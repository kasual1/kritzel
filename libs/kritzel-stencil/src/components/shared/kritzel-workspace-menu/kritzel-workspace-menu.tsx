import { Component, h, Prop, State, Event, EventEmitter } from '@stencil/core';
import { KritzelWorkspace } from '../../../classes/workspace.class';

@Component({
  tag: 'kritzel-workspace-menu',
  styleUrl: 'kritzel-workspace-menu.css',
  shadow: true,
})
export class KritzelWorkspaceMenu {
  @Prop() 
  workspace: KritzelWorkspace;
  
  @Event() 
  deleteWorkspace: EventEmitter<KritzelWorkspace>;
  
  @Event() 
  renameWorkspace: EventEmitter<KritzelWorkspace>;

  @State() 
  isMenuOpen = false;

  private toggleMenu = (event: MouseEvent) => {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
  };

  render() {
    return (
      <div style={{ position: 'relative' }}>
        <kritzel-icon name="ellipsis-vertical" size={16} onClick={this.toggleMenu}></kritzel-icon>

        {this.isMenuOpen && (
          <kritzel-menu
            style={{ position: 'absolute', left: '0', top: '100%', zIndex: '3', minWidth: '100px' }}
            items={[
              { label: 'Rename', value: 'rename', action: () => this.renameWorkspace.emit(this.workspace) },
              { label: 'Delete', value: 'delete', action: () => this.deleteWorkspace.emit(this.workspace) },
            ]}
          ></kritzel-menu>
        )}
      </div>
    );
  }
}
