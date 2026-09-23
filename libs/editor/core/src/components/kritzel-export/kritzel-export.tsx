import { Component, Host, h, State, Event, EventEmitter, Method, Prop } from '@stencil/core';
import { DropdownOption } from '../kritzel-dropdown/kritzel-dropdown';
import { KritzelPillTab } from '../kritzel-pill-tabs/kritzel-pill-tabs';
import { KritzelTermKey } from '@kritzel/engine';

type ExportTab = 'viewport' | 'workspace';
type ViewportExportFormat = 'png' | 'svg';

@Component({
  tag: 'kritzel-export',
  styleUrl: 'kritzel-export.css',
  shadow: true,
})
export class KritzelExport {
  /**
   * The name of the current workspace, used as default filename
   */
  @Prop() workspaceName: string = 'workspace';

  /** Resolved localized strings keyed by term key, supplied by the editor. */
  @Prop() terms: Partial<Record<KritzelTermKey, string>> = {};

  @State() isDialogOpen: boolean = false;
  @State() previewUrl: string;
  @State() isLoading: boolean = false;
  @State() activeTab: ExportTab = 'viewport';
  @State() exportFilename: string = '';
  @State() viewportExportFormat: ViewportExportFormat = 'png';

  @Event() exportPng: EventEmitter<void>;
  @Event() exportSvg: EventEmitter<void>;
  @Event() exportJson: EventEmitter<string>;

  private get tabs(): KritzelPillTab[] {
    return [
      { id: 'viewport', label: this.terms['export.tabs.viewport'] ?? 'Export Viewport' },
      { id: 'workspace', label: this.terms['export.tabs.workspace'] ?? 'Export Workspace' },
    ];
  }

  private viewportFormatOptions: DropdownOption[] = [
    { value: 'png', label: 'PNG' },
    { value: 'svg', label: 'SVG' },
  ];

  @Method()
  async open(previewUrl?: string): Promise<void> {
    this.previewUrl = previewUrl;
    this.activeTab = 'viewport';
    this.viewportExportFormat = 'png';
    this.exportFilename = this.generateDefaultFilename();
    this.isDialogOpen = true;
  }

  @Method()
  async close(): Promise<void> {
    this.closeDialog();
  }

  private generateDefaultFilename(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${this.workspaceName}-${timestamp}`;
  }

  private handleFilenameChange = (event: CustomEvent<string>): void => {
    this.exportFilename = event.detail;
  };

  private closeDialog = (): void => {
    this.isDialogOpen = false;
  };

  private handleTabChange = (event: CustomEvent<string>): void => {
    this.activeTab = event.detail as ExportTab;
  };

  private handleViewportFormatChange = (event: CustomEvent<string>): void => {
    this.viewportExportFormat = event.detail as ViewportExportFormat;
  };

  private handleExport = (): void => {
    if (this.activeTab === 'viewport') {
      if (this.viewportExportFormat === 'png') {
        this.exportPng.emit();
      } else {
        this.exportSvg.emit();
      }
    } else {
      this.exportJson.emit(this.exportFilename || this.generateDefaultFilename());
    }
    this.closeDialog();
  };

  private renderViewportExport() {
    return (
      <div class="export-tab-content">
        {this.previewUrl && (
          <div class="preview-container">
            <img src={this.previewUrl} alt="Viewport Preview" />
          </div>
        )}
        <kritzel-input
          label={this.terms['export.filename.label'] ?? 'Filename'}
          value={this.exportFilename}
          placeholder={this.terms['export.filename.placeholder'] ?? 'Enter filename'}
          suffix={`.${this.viewportExportFormat}`}
          onValueChange={this.handleFilenameChange}
        ></kritzel-input>
        <div class="format-selection">
          <label>{this.terms['export.format.label'] ?? 'Format'}</label>
          <kritzel-dropdown
            options={this.viewportFormatOptions}
            value={this.viewportExportFormat}
            forceOpenDirection="up"
            onValueChanged={this.handleViewportFormatChange}
          ></kritzel-dropdown>
        </div>
      </div>
    );
  }

  private renderWorkspaceExport() {
    return (
      <div class="export-tab-content">
        <kritzel-input
          label={this.terms['export.filename.label'] ?? 'Filename'}
          value={this.exportFilename}
          placeholder={this.terms['export.filename.placeholder'] ?? 'Enter filename'}
          suffix=".json"
          onValueChange={this.handleFilenameChange}
        ></kritzel-input>
      </div>
    );
  }

  render() {
    return (
      <Host>
        <kritzel-dialog
          isOpen={this.isDialogOpen}
          dialogTitle={this.terms['export.dialogTitle'] ?? 'Export'}
          closable={true}
          contained={true}
          onDialogClose={this.closeDialog}
        >
          <div class="export-content">
            <kritzel-pill-tabs
              tabs={this.tabs}
              value={this.activeTab}
              onValueChange={this.handleTabChange}
            ></kritzel-pill-tabs>

            {this.activeTab === 'viewport' && this.renderViewportExport()}
            {this.activeTab === 'workspace' && this.renderWorkspaceExport()}
          </div>
          <div slot="footer">
            <button class="export-primary-button" onClick={this.handleExport}>
              {this.terms['export.exportButton'] ?? 'Export'}
            </button>
          </div>
        </kritzel-dialog>
      </Host>
    );
  }
}
