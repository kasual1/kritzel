import { Component, Host, h, State, Event, EventEmitter, Method, Element, Prop, Watch } from '@stencil/core';
import { IKritzelMasterDetailItem, IKritzelMasterDetailSelectEvent } from '../../../interfaces/master-detail.interface';
import { KritzelSettingsConfig } from '../../../interfaces/settings.interface';
import { KritzelDebugInfo } from '../../../interfaces/debug-info.interface';
import { KRITZEL_VERSION } from '../../../constants/version';
import { CURRENT_APP_STATE_SCHEMA_VERSION, CURRENT_WORKSPACE_SCHEMA_VERSION } from '../../../constants/schema.constants';
import { ThemeName } from '../../../interfaces/theme.interface';
import { KritzelThemeManager } from '../../../classes/managers/theme.manager';
import { KritzelShortcut } from '../../../interfaces/shortcut.interface';
const DEFAULT_SCALE_MIN = 0.0001;
const DEFAULT_SCALE_MAX = 1000;
const DEFAULT_LOCK_DRAWING_SCALE = true;
const DEFAULT_VIEWPORT_BOUNDARY_LEFT = -Infinity;
const DEFAULT_VIEWPORT_BOUNDARY_RIGHT = Infinity;
const DEFAULT_VIEWPORT_BOUNDARY_TOP = -Infinity;
const DEFAULT_VIEWPORT_BOUNDARY_BOTTOM = Infinity;

const DEFAULT_DEBUG_INFO: KritzelDebugInfo = {
  showViewportInfo: false,
  showObjectInfo: false,
  showSyncProviderInfo: true,
  showMigrationInfo: true,
};

const SETTINGS_CATEGORIES: IKritzelMasterDetailItem[] = [
  { id: 'general', label: 'General', icon: 'settings' },
  { id: 'viewport', label: 'Viewport', icon: 'viewport' },
  { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: 'command' },
  { id: 'developer', label: 'Developer Options', icon: 'braces' },
  { id: 'about', label: 'About', icon: 'info' },
];

@Component({
  tag: 'kritzel-settings',
  styleUrl: 'kritzel-settings.css',
  shadow: true,
})
export class KritzelSettings {
  @Element() host!: HTMLElement;

  /** Keyboard shortcuts to display in the settings dialog */
  @Prop() shortcuts: Omit<KritzelShortcut, 'action' | 'condition'>[] = [];

  /** Current settings values. Used to initialize and sync the component's internal state. */
  @Prop() settings?: Partial<KritzelSettingsConfig>;
  @Watch('settings')
  onSettingsPropChange(newSettings?: Partial<KritzelSettingsConfig>) {
    if (newSettings) {
      this.applySettings(newSettings);
    }
  }

  @State() isDialogOpen: boolean = false;
  @State() selectedCategoryId: string = SETTINGS_CATEGORIES[0].id;
  @State() scaleMin: number = DEFAULT_SCALE_MIN;
  @State() scaleMax: number = DEFAULT_SCALE_MAX;
  @State() lockDrawingScale: boolean = DEFAULT_LOCK_DRAWING_SCALE;
  @State() theme: ThemeName = 'light';
  @State() viewportBoundaryLeft: number = DEFAULT_VIEWPORT_BOUNDARY_LEFT;
  @State() viewportBoundaryRight: number = DEFAULT_VIEWPORT_BOUNDARY_RIGHT;
  @State() viewportBoundaryTop: number = DEFAULT_VIEWPORT_BOUNDARY_TOP;
  @State() viewportBoundaryBottom: number = DEFAULT_VIEWPORT_BOUNDARY_BOTTOM;
  @State() debugInfo: KritzelDebugInfo = { ...DEFAULT_DEBUG_INFO };

  /** Emitted when settings change */
  @Event() settingsChange: EventEmitter<KritzelSettingsConfig>;

  componentWillLoad(): void {
    if (this.settings) {
      this.applySettings(this.settings);
    }
  }

  private applySettings(settings: Partial<KritzelSettingsConfig>): void {
    if (typeof settings.scaleMin === 'number') {
      this.scaleMin = settings.scaleMin;
    }
    if (typeof settings.scaleMax === 'number') {
      this.scaleMax = settings.scaleMax;
    }
    if (typeof settings.lockDrawingScale === 'boolean') {
      this.lockDrawingScale = settings.lockDrawingScale;
    }
    if (typeof settings.theme === 'string') {
      this.theme = settings.theme;
    }
    if (typeof settings.viewportBoundaryLeft === 'number') {
      this.viewportBoundaryLeft = settings.viewportBoundaryLeft;
    }
    if (typeof settings.viewportBoundaryRight === 'number') {
      this.viewportBoundaryRight = settings.viewportBoundaryRight;
    }
    if (typeof settings.viewportBoundaryTop === 'number') {
      this.viewportBoundaryTop = settings.viewportBoundaryTop;
    }
    if (typeof settings.viewportBoundaryBottom === 'number') {
      this.viewportBoundaryBottom = settings.viewportBoundaryBottom;
    }
    if (settings.debugInfo) {
      this.debugInfo = { ...DEFAULT_DEBUG_INFO, ...settings.debugInfo };
    }
  }

  private emitSettings(): void {
    const settings: KritzelSettingsConfig = {
      scaleMin: this.scaleMin,
      scaleMax: this.scaleMax,
      lockDrawingScale: this.lockDrawingScale,
      theme: this.theme,
      viewportBoundaryLeft: this.viewportBoundaryLeft,
      viewportBoundaryRight: this.viewportBoundaryRight,
      viewportBoundaryTop: this.viewportBoundaryTop,
      viewportBoundaryBottom: this.viewportBoundaryBottom,
      debugInfo: this.debugInfo,
    };
    this.settingsChange.emit(settings);
  }

  private handleScaleMinChange = (event: CustomEvent<number>): void => {
    this.scaleMin = event.detail;
    this.emitSettings();
  };

  private handleScaleMaxChange = (event: CustomEvent<number>): void => {
    this.scaleMax = event.detail;
    this.emitSettings();
  };

  private handleLockDrawingScaleChange = (event: CustomEvent<boolean>): void => {
    this.lockDrawingScale = event.detail;
    this.emitSettings();
  };

  private handleThemeChange = (event: CustomEvent<string>): void => {
    this.theme = event.detail;
    this.emitSettings();
  };

  private handleViewportBoundaryLeftChange = (event: CustomEvent<number | undefined>): void => {
    this.viewportBoundaryLeft = event.detail ?? DEFAULT_VIEWPORT_BOUNDARY_LEFT;
    this.emitSettings();
  };

  private handleViewportBoundaryRightChange = (event: CustomEvent<number | undefined>): void => {
    this.viewportBoundaryRight = event.detail ?? DEFAULT_VIEWPORT_BOUNDARY_RIGHT;
    this.emitSettings();
  };

  private handleViewportBoundaryTopChange = (event: CustomEvent<number | undefined>): void => {
    this.viewportBoundaryTop = event.detail ?? DEFAULT_VIEWPORT_BOUNDARY_TOP;
    this.emitSettings();
  };

  private handleViewportBoundaryBottomChange = (event: CustomEvent<number | undefined>): void => {
    this.viewportBoundaryBottom = event.detail ?? DEFAULT_VIEWPORT_BOUNDARY_BOTTOM;
    this.emitSettings();
  };

  private handleDebugInfoChange = (key: keyof KritzelDebugInfo) => (event: CustomEvent<boolean>): void => {
    this.debugInfo = { ...this.debugInfo, [key]: event.detail };
    this.emitSettings();
  };

  @Method()
  async open(): Promise<void> {
    this.isDialogOpen = true;
  }

  private closeDialog = (): void => {
    this.isDialogOpen = false;
  };

  private handleCategorySelect = (event: CustomEvent<IKritzelMasterDetailSelectEvent>): void => {
    this.selectedCategoryId = event.detail.item.id;
  };

  private formatKeyCombo(shortcut: Omit<KritzelShortcut, 'action' | 'condition'>): string {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.shift) parts.push('Shift');
    parts.push(this.formatKey(shortcut.key));
    return parts.join('+');
  }

  private formatKey(key: string): string {
    const keyMap: Record<string, string> = {
      'Escape': 'Esc',
      'Delete': 'Del',
      ' ': 'Space',
    };
    return keyMap[key] ?? key.toUpperCase();
  }

  private groupShortcutsByCategory(): Map<string, Omit<KritzelShortcut, 'action' | 'condition'>[]> {
    const grouped = new Map<string, Omit<KritzelShortcut, 'action' | 'condition'>[]>();
    for (const shortcut of this.shortcuts) {
      const existing = grouped.get(shortcut.category) || [];
      existing.push(shortcut);
      grouped.set(shortcut.category, existing);
    }
    return grouped;
  }

  private renderCategoryContent() {
    switch (this.selectedCategoryId) {
      case 'general':
        return (
          <div class="settings-content">
            <h3>General Settings</h3>
            <div class="settings-group">
              <div class="settings-item">
                <label class="settings-label">Theme</label>
                <p class="settings-description">
                  Select a registered color theme for the editor interface.
                </p>
                <kritzel-dropdown
                  options={KritzelThemeManager.getAllThemes().map(t => ({ value: t.name, label: t.name }))}
                  value={this.theme}
                  onValueChanged={this.handleThemeChange}
                ></kritzel-dropdown>
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
      case 'viewport':
        return (
          <div class="settings-content">
            <h3>Viewport Settings</h3>
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
                <label class="settings-label">Viewport Boundary Left</label>
                <p class="settings-description">
                  Left boundary in world coordinates. Set to limit how far left the viewport can pan.
                </p>
                <kritzel-numeric-input
                  value={this.viewportBoundaryLeft}
                  step={100}
                  placeholder="Infinite"
                  onValueChange={this.handleViewportBoundaryLeftChange}
                />
              </div>
              <div class="settings-item">
                <label class="settings-label">Viewport Boundary Right</label>
                <p class="settings-description">
                  Right boundary in world coordinates. Set to limit how far right the viewport can pan.
                </p>
                <kritzel-numeric-input
                  value={this.viewportBoundaryRight}
                  step={100}
                  placeholder="Infinite"
                  onValueChange={this.handleViewportBoundaryRightChange}
                />
              </div>
              <div class="settings-item">
                <label class="settings-label">Viewport Boundary Top</label>
                <p class="settings-description">
                  Top boundary in world coordinates. Set to limit how far up the viewport can pan.
                </p>
                <kritzel-numeric-input
                  value={this.viewportBoundaryTop}
                  step={100}
                  placeholder="Infinite"
                  onValueChange={this.handleViewportBoundaryTopChange}
                />
              </div>
              <div class="settings-item">
                <label class="settings-label">Viewport Boundary Bottom</label>
                <p class="settings-description">
                  Bottom boundary in world coordinates. Set to limit how far down the viewport can pan.
                </p>
                <kritzel-numeric-input
                  value={this.viewportBoundaryBottom}
                  step={100}
                  placeholder="Infinite"
                  onValueChange={this.handleViewportBoundaryBottomChange}
                />
              </div>
            </div>
          </div>
        );
      case 'shortcuts':
        return (
          <div class="settings-content">
            <h3>Keyboard Shortcuts</h3>
            <div class="shortcuts-list">
              {Array.from(this.groupShortcutsByCategory()).map(([category, shortcuts]) => (
                <div class="shortcuts-category" key={category}>
                  <h4 class="shortcuts-category-title">{category}</h4>
                  <div class="shortcuts-group">
                    {shortcuts.map(shortcut => (
                      <div class="shortcut-item" key={shortcut.key + shortcut.label}>
                        <span class="shortcut-label">{shortcut.label}</span>
                        <kbd class="shortcut-key">{this.formatKeyCombo(shortcut)}</kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'developer':
        return (
          <div class="settings-content">
            <h3>Developer Options</h3>
            <div class="settings-group">
              <div class="settings-item">
                <label class="settings-label">Show Viewport Info</label>
                <p class="settings-description">
                  Display viewport debug information such as position, zoom level, and boundaries.
                </p>
                <kritzel-slide-toggle
                  checked={this.debugInfo.showViewportInfo}
                  label="Show Viewport Info"
                  onCheckedChange={this.handleDebugInfoChange('showViewportInfo')}
                />
              </div>
              <div class="settings-item">
                <label class="settings-label">Show Object Info</label>
                <p class="settings-description">
                  Display debug information about objects on the canvas.
                </p>
                <kritzel-slide-toggle
                  checked={this.debugInfo.showObjectInfo}
                  label="Show Object Info"
                  onCheckedChange={this.handleDebugInfoChange('showObjectInfo')}
                />
              </div>
              <div class="settings-item">
                <label class="settings-label">Show Sync Provider Info</label>
                <p class="settings-description">
                  Display debug information about the sync provider connection status.
                </p>
                <kritzel-slide-toggle
                  checked={this.debugInfo.showSyncProviderInfo}
                  label="Show Sync Provider Info"
                  onCheckedChange={this.handleDebugInfoChange('showSyncProviderInfo')}
                />
              </div>
              <div class="settings-item">
                <label class="settings-label">Show Migration Info</label>
                <p class="settings-description">
                  Display debug information about data migrations.
                </p>
                <kritzel-slide-toggle
                  checked={this.debugInfo.showMigrationInfo}
                  label="Show Migration Info"
                  onCheckedChange={this.handleDebugInfoChange('showMigrationInfo')}
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
            <p class="version-info">Version {KRITZEL_VERSION}</p>
            <p class="version-info">App-State Schema v{CURRENT_APP_STATE_SCHEMA_VERSION}</p>
            <p class="version-info">Workspace Schema v{CURRENT_WORKSPACE_SCHEMA_VERSION}</p>
          </div>
        );
      default:
        return null;
    }
  }

  render() {
    return (
      <Host>
        <kritzel-dialog
          isOpen={this.isDialogOpen}
          dialogTitle="Settings"
          size="large"
          contained={true}
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
