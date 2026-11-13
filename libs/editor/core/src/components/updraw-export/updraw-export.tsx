import { Component, Host, h, State, Event, EventEmitter, Method, Prop } from '@stencil/core';
import { DropdownOption } from '../updraw-dropdown/updraw-dropdown';
import { UpdrawPillTab } from '../updraw-pill-tabs/updraw-pill-tabs';
import { UpdrawTermKey } from '@updraw/core';

type ExportTab = 'viewport' | 'workspace';
type ViewportExportFormat = 'png' | 'svg';

@Component({
  tag: 'updraw-export',
  styleUrl: 'updraw-export.css',
  shadow: true,
})
export class UpdrawExport {
  /**
   * The name of the current workspace, used as default filename
   */
  @Prop() workspaceName: string = 'workspace';

  /** Resolved localized strings keyed by term key, supplied by the editor. */
  @Prop() terms: Partial<Record<UpdrawTermKey, string>> = {};

  @State() isDialogOpen: boolean = false;
  @State() previewUrl: string;
  @State() isLoading: boolean = false;
  @State() activeTab: ExportTab = 'viewport';
  @State() exportFilename: string = '';
  @State() viewportExportFormat: ViewportExportFormat = 'png';

  @Event() exportPng: EventEmitter<void>;
  @Event() exportSvg: EventEmitter<void>;
  @Event() exportJson: EventEmitter<string>;

  private get tabs(): UpdrawPillTab[] {
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
        <updraw-input
          label={this.terms['export.filename.label'] ?? 'Filename'}
          value={this.exportFilename}
          placeholder={this.terms['export.filename.placeholder'] ?? 'Enter filename'}
          suffix={`.${this.viewportExportFormat}`}
          onValueChange={this.handleFilenameChange}
        ></updraw-input>
        <div class="format-selection">
          <label>{this.terms['export.format.label'] ?? 'Format'}</label>
          <updraw-dropdown
            options={this.viewportFormatOptions}
            value={this.viewportExportFormat}
            forceOpenDirection="up"
            onValueChanged={this.handleViewportFormatChange}
          ></updraw-dropdown>
        </div>
      </div>
    );
  }

  private renderWorkspaceExport() {
    return (
      <div class="export-tab-content">
        <updraw-input
          label={this.terms['export.filename.label'] ?? 'Filename'}
          value={this.exportFilename}
          placeholder={this.terms['export.filename.placeholder'] ?? 'Enter filename'}
          suffix=".json"
          onValueChange={this.handleFilenameChange}
        ></updraw-input>
      </div>
    );
  }

  render() {
    return (
      <Host>
        <updraw-dialog
          isOpen={this.isDialogOpen}
          dialogTitle={this.terms['export.dialogTitle'] ?? 'Export'}
          closable={true}
          contained={true}
          onDialogClose={this.closeDialog}
        >
          <div class="export-content">
            <updraw-pill-tabs
              tabs={this.tabs}
              value={this.activeTab}
              onValueChange={this.handleTabChange}
            ></updraw-pill-tabs>

            {this.activeTab === 'viewport' && this.renderViewportExport()}
            {this.activeTab === 'workspace' && this.renderWorkspaceExport()}
          </div>
          <div slot="footer">
            <button class="export-primary-button" onClick={this.handleExport}>
              {this.terms['export.exportButton'] ?? 'Export'}
            </button>
          </div>
        </updraw-dialog>
      </Host>
    );
  }
}
