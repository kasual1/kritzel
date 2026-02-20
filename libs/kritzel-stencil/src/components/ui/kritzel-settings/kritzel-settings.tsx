import { Component, Host, h, State, Event, EventEmitter, Method, Element, Prop } from '@stencil/core';
import { IKritzelMasterDetailItem, IKritzelMasterDetailSelectEvent } from '../../../interfaces/master-detail.interface';
import { KritzelSettingsConfig } from '../../../interfaces/settings.interface';
import { KRITZEL_VERSION } from '../../../constants/version';
import { ThemeName } from '../../../interfaces/theme.interface';
import { KritzelShortcut } from '../../../interfaces/shortcut.interface';

const SETTINGS_STORAGE_KEY = 'kritzel-settings';
const DEFAULT_SCALE_MIN = 0.0001;
const DEFAULT_SCALE_MAX = 1000;
const DEFAULT_LOCK_DRAWING_SCALE = true;
const DEFAULT_VIEWPORT_BOUNDARY_LEFT = -Infinity;
const DEFAULT_VIEWPORT_BOUNDARY_RIGHT = Infinity;
const DEFAULT_VIEWPORT_BOUNDARY_TOP = -Infinity;
const DEFAULT_VIEWPORT_BOUNDARY_BOTTOM = Infinity;

const SETTINGS_CATEGORIES: IKritzelMasterDetailItem[] = [
  { id: 'general', label: 'General', icon: 'settings' },
  { id: 'viewport', label: 'Viewport', icon: 'viewport' },
  { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: 'command' },
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

  @State() isDialogOpen: boolean = false;
  @State() selectedCategoryId: string = SETTINGS_CATEGORIES[0].id;
  @State() scaleMin: number = DEFAULT_SCALE_MIN;
  @State() scaleMax: number = DEFAULT_SCALE_MAX;
  @State() lockDrawingScale: boolean = DEFAULT_LOCK_DRAWING_SCALE;
  @State() currentTheme: ThemeName = 'light';
  @State() viewportBoundaryLeft: number = DEFAULT_VIEWPORT_BOUNDARY_LEFT;
  @State() viewportBoundaryRight: number = DEFAULT_VIEWPORT_BOUNDARY_RIGHT;
  @State() viewportBoundaryTop: number = DEFAULT_VIEWPORT_BOUNDARY_TOP;
  @State() viewportBoundaryBottom: number = DEFAULT_VIEWPORT_BOUNDARY_BOTTOM;

  /** Emitted when settings change */
  @Event() settingsChange: EventEmitter<KritzelSettingsConfig>;

  componentWillLoad(): void {
    this.loadSettings();
  }

  private loadSettings(): void {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<KritzelSettingsConfig>;
        if (typeof parsed.scaleMin === 'number') {
          this.scaleMin = parsed.scaleMin;
        }
        if (typeof parsed.scaleMax === 'number') {
          this.scaleMax = parsed.scaleMax;
        }
        if (typeof parsed.lockDrawingScale === 'boolean') {
          this.lockDrawingScale = parsed.lockDrawingScale;
        }
        if (parsed.theme === 'light' || parsed.theme === 'dark') {
          this.currentTheme = parsed.theme;
        }
        if (typeof parsed.viewportBoundaryLeft === 'number') {
          this.viewportBoundaryLeft = parsed.viewportBoundaryLeft;
        }
        if (typeof parsed.viewportBoundaryRight === 'number') {
          this.viewportBoundaryRight = parsed.viewportBoundaryRight;
        }
        if (typeof parsed.viewportBoundaryTop === 'number') {
          this.viewportBoundaryTop = parsed.viewportBoundaryTop;
        }
        if (typeof parsed.viewportBoundaryBottom === 'number') {
          this.viewportBoundaryBottom = parsed.viewportBoundaryBottom;
        }
      } catch {
        // Invalid JSON, use defaults
      }
    }
  }

  private saveSettings(): void {
    const settings: KritzelSettingsConfig = {
      scaleMin: this.scaleMin,
      scaleMax: this.scaleMax,
      lockDrawingScale: this.lockDrawingScale,
      theme: this.currentTheme,
      viewportBoundaryLeft: this.viewportBoundaryLeft,
      viewportBoundaryRight: this.viewportBoundaryRight,
      viewportBoundaryTop: this.viewportBoundaryTop,
      viewportBoundaryBottom: this.viewportBoundaryBottom,
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

  private handleThemeChange = (event: CustomEvent<boolean>): void => {
    this.currentTheme = event.detail ? 'dark' : 'light';
    this.saveSettings();
  };

  private handleViewportBoundaryLeftChange = (event: CustomEvent<number>): void => {
    this.viewportBoundaryLeft = event.detail;
    this.saveSettings();
  };

  private handleViewportBoundaryRightChange = (event: CustomEvent<number>): void => {
    this.viewportBoundaryRight = event.detail;
    this.saveSettings();
  };

  private handleViewportBoundaryTopChange = (event: CustomEvent<number>): void => {
    this.viewportBoundaryTop = event.detail;
    this.saveSettings();
  };

  private handleViewportBoundaryBottomChange = (event: CustomEvent<number>): void => {
    this.viewportBoundaryBottom = event.detail;
    this.saveSettings();
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
                <label class="settings-label">Dark Mode</label>
                <p class="settings-description">
                  Toggle between light and dark color themes for the editor interface.
                </p>
                <kritzel-slide-toggle
                  checked={this.currentTheme === 'dark'}
                  label="Dark Mode"
                  onCheckedChange={this.handleThemeChange}
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
      case 'about':
        return (
          <div class="settings-content">
            <h3>About</h3>
            <p>Kritzel - A drawing application</p>
            <p class="version-info">Version {KRITZEL_VERSION}</p>
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
