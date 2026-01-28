import { Component, Host, h, State } from '@stencil/core';
import { IKritzelMasterDetailItem, IKritzelMasterDetailSelectEvent } from '../../../interfaces/master-detail.interface';

const SETTINGS_CATEGORIES: IKritzelMasterDetailItem[] = [
  { id: 'general', label: 'General', icon: 'settings' },
  { id: 'appearance', label: 'Appearance', icon: 'palette' },
  { id: 'shortcuts', label: 'Shortcuts', icon: 'command' },
  { id: 'export', label: 'Export', icon: 'download' },
  { id: 'about', label: 'About', icon: 'info' },
];

@Component({
  tag: 'kritzel-settings',
  styleUrl: 'kritzel-settings.css',
  shadow: true,
})
export class KritzelSettings {
  @State() isDialogOpen: boolean = false;
  @State() selectedCategoryId: string = SETTINGS_CATEGORIES[0].id;

  private openDialog = (): void => {
    this.isDialogOpen = true;
  };

  private closeDialog = (): void => {
    this.isDialogOpen = false;
  };

  private handleCategorySelect = (event: CustomEvent<IKritzelMasterDetailSelectEvent>): void => {
    this.selectedCategoryId = event.detail.item.id;
  };

  private renderCategoryContent() {
    switch (this.selectedCategoryId) {
      case 'general':
        return (
          <div class="settings-content">
            <h3>General Settings</h3>
            <p>Configure general application settings here.</p>
          </div>
        );
      case 'appearance':
        return (
          <div class="settings-content">
            <h3>Appearance</h3>
            <p>Customize the look and feel of the application.</p>
          </div>
        );
      case 'shortcuts':
        return (
          <div class="settings-content">
            <h3>Keyboard Shortcuts</h3>
            <p>View and customize keyboard shortcuts.</p>
          </div>
        );
      case 'export':
        return (
          <div class="settings-content">
            <h3>Export Settings</h3>
            <p>Configure export options and formats.</p>
          </div>
        );
      case 'about':
        return (
          <div class="settings-content">
            <h3>About</h3>
            <p>Kritzel - A drawing application</p>
          </div>
        );
      default:
        return null;
    }
  }

  render() {
    return (
      <Host>
        <button class="settings-button" onClick={this.openDialog}>
          <kritzel-icon name="settings" size={24}></kritzel-icon>
        </button>

        <kritzel-dialog
          isOpen={this.isDialogOpen}
          dialogTitle="Settings"
          size="large"
          onDialogClose={this.closeDialog}
        >
          <kritzel-master-detail
            items={SETTINGS_CATEGORIES}
            selectedItemId={this.selectedCategoryId}
            onItemSelect={this.handleCategorySelect}
          >
            {this.renderCategoryContent()}
          </kritzel-master-detail>
        </kritzel-dialog>
      </Host>
    );
  }
}
