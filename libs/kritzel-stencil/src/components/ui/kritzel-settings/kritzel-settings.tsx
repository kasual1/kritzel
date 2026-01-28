import { Component, Host, h, State, Event, EventEmitter } from '@stencil/core';
import { IKritzelMasterDetailItem, IKritzelMasterDetailSelectEvent } from '../../../interfaces/master-detail.interface';
import { IKritzelSettings } from '../../../interfaces/settings.interface';

const SETTINGS_STORAGE_KEY = 'kritzel-settings';
const DEFAULT_SCALE_MIN = 0.0001;
const DEFAULT_SCALE_MAX = 1000;
const DEFAULT_LOCK_DRAWING_SCALE = true;

const SETTINGS_CATEGORIES: IKritzelMasterDetailItem[] = [
  { id: 'general', label: 'General', icon: 'settings' },
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
  @State() scaleMin: number = DEFAULT_SCALE_MIN;
  @State() scaleMax: number = DEFAULT_SCALE_MAX;
  @State() lockDrawingScale: boolean = DEFAULT_LOCK_DRAWING_SCALE;

  /** Emitted when settings change */
  @Event() settingsChange: EventEmitter<IKritzelSettings>;

  componentWillLoad(): void {
    this.loadSettings();
  }

  private loadSettings(): void {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<IKritzelSettings>;
        if (typeof parsed.scaleMin === 'number') {
          this.scaleMin = parsed.scaleMin;
        }
        if (typeof parsed.scaleMax === 'number') {
          this.scaleMax = parsed.scaleMax;
        }
        if (typeof parsed.lockDrawingScale === 'boolean') {
          this.lockDrawingScale = parsed.lockDrawingScale;
        }
      } catch {
        // Invalid JSON, use defaults
      }
    }
  }

  private saveSettings(): void {
    const settings: IKritzelSettings = {
      scaleMin: this.scaleMin,
      scaleMax: this.scaleMax,
      lockDrawingScale: this.lockDrawingScale,
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    this.settingsChange.emit(settings);
  }

  private handleScaleMinChange = (event: CustomEvent<number>): void => {
    this.scaleMin = event.detail;
    this.saveSettings();
  };

  private handleScaleMaxChange = (event: CustomEvent<number>): void => {
    this.scaleMax = event.detail;
    this.saveSettings();
  };

  private handleLockDrawingScaleChange = (event: CustomEvent<boolean>): void => {
    this.lockDrawingScale = event.detail;
    this.saveSettings();
  };

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
            <div class="settings-group">
              <div class="settings-item">
                <label class="settings-label">Minimum Zoom Level</label>
                <p class="settings-description">
                  Sets the minimum zoom level. Lower values allow zooming out further to see more of the canvas.
                </p>
                <kritzel-numeric-input
                  value={this.scaleMin}
                  min={0.0001}
                  max={1}
                  step={0.0001}
                  onValueChange={this.handleScaleMinChange}
                />
              </div>
              <div class="settings-item">
                <label class="settings-label">Maximum Zoom Level</label>
                <p class="settings-description">
                  Sets the maximum zoom level. Higher values allow zooming in closer for detailed work.
                </p>
                <kritzel-numeric-input
                  value={this.scaleMax}
                  min={1}
                  max={1000}
                  step={1}
                  onValueChange={this.handleScaleMaxChange}
                />
              </div>
              <div class="settings-item">
                <label class="settings-label">Lock Drawing Scale</label>
                <p class="settings-description">
                  When enabled, drawn objects maintain a fixed visual size regardless of the current zoom level.
                </p>
                <kritzel-slide-toggle
                  checked={this.lockDrawingScale}
                  label="Lock Drawing Scale"
                  onCheckedChange={this.handleLockDrawingScaleChange}
                />
              </div>
            </div>
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
