import { Component, Host, h, State, Event, EventEmitter, Method } from '@stencil/core';

@Component({
  tag: 'kritzel-export',
  styleUrl: 'kritzel-export.css',
  shadow: true,
})
export class KritzelExport {
  @State() isDialogOpen: boolean = false;
  @State() previewUrl: string;
  @State() isLoading: boolean = false;
  
  @Event() exportPng: EventEmitter<void>;
  @Event() exportSvg: EventEmitter<void>;

  @Method()
  async open(previewUrl?: string): Promise<void> {
    this.previewUrl = previewUrl;
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
            {this.previewUrl && (
              <div class="preview-container">
                <img src={this.previewUrl} alt="Viewport Preview" />
              </div>
            )}
            <p>Select a format to export the current viewport:</p>
            <div class="export-options">
              <button class="export-button" onClick={this.handleExportPng}>
                <div class="icon-container">
                    <kritzel-icon name="image" size={24}></kritzel-icon>
                </div>
                <span>Export as PNG</span>
              </button>
              <button class="export-button" onClick={this.handleExportSvg}>
                <div class="icon-container">
                    <kritzel-icon name="shape-rectangle" size={24}></kritzel-icon>
                </div>
                <span>Export as SVG</span>
              </button>
            </div>
          </div>
        </kritzel-dialog>
      </Host>
    );
  }
}
