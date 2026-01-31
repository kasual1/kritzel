import { Component, Host, h, State, Event, EventEmitter, Method } from '@stencil/core';

@Component({
  tag: 'kritzel-export',
  styleUrl: 'kritzel-export.css',
  shadow: true,
})
export class KritzelExport {
  @State() isDialogOpen: boolean = false;
  
  @Event() exportPng: EventEmitter<void>;
  @Event() exportSvg: EventEmitter<void>;

  @Method()
  async open(): Promise<void> {
    this.isDialogOpen = true;
  }

  private closeDialog = (): void => {
    this.isDialogOpen = false;
  };

  private handleExportPng = (): void => {
    this.exportPng.emit();
    this.closeDialog();
  };

  private handleExportSvg = (): void => {
    this.exportSvg.emit();
    this.closeDialog();
  };

  render() {
    return (
      <Host>
        <kritzel-dialog
          isOpen={this.isDialogOpen}
          dialogTitle="Export Viewport"
          closable={true}
          onDialogClose={this.closeDialog}
        >
          <div class="export-content">
            <p>Select a format to export the current viewport:</p>
            <div class="export-options">
              <button class="export-button" onClick={this.handleExportPng}>
                <div class="icon-container">
                    <kritzel-icon name="image" size={32}></kritzel-icon>
                </div>
                <span>Export as attributes PNG</span>
              </button>
              <button class="export-button" onClick={this.handleExportSvg}>
                <div class="icon-container">
                    <kritzel-icon name="shape-rectangle" size={32}></kritzel-icon>
                </div>
                <span>Export as SVG</span>
              </button>
            </div>
          </div>
          <div slot="footer" class="dialog-footer">
            <button class="cancel-button" onClick={this.closeDialog}>
              Cancel
            </button>
          </div>
        </kritzel-dialog>
      </Host>
    );
  }
}
