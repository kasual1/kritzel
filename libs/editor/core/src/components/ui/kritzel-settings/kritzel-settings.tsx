import { Component, Host, h, State, Event, EventEmitter, Method, Element, Prop, Watch } from '@stencil/core';
import { IKritzelMasterDetailItem, IKritzelMasterDetailSelectEvent } from '@kritzel/engine';
import { KritzelSettingsConfig } from '@kritzel/engine';
import { KritzelDebugInfo } from '@kritzel/engine';
import { KRITZEL_VERSION } from '@kritzel/engine';
import { CURRENT_APP_STATE_SCHEMA_VERSION, CURRENT_WORKSPACE_SCHEMA_VERSION } from '@kritzel/engine';
import { ThemeName } from '@kritzel/engine';
import { KritzelShortcut } from '@kritzel/engine';
import { LocaleCode, KritzelTermKey } from '@kritzel/engine';
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
  showAssetResolverInfo: false,
};

const SETTINGS_CATEGORY_IDS = ['general', 'viewport', 'shortcuts', 'developer', 'about'] as const;

@Component({
  tag: 'kritzel-settings',
  styleUrl: 'kritzel-settings.css',
  shadow: true,
})
export class KritzelSettings {
  @Element() host!: HTMLElement;

  /** Keyboard shortcuts to display in the settings dialog */
  @Prop() availableThemes: string[] = ['light', 'dark'];
  /** Available locales as `{ code, label }` options for the language selector. */
  @Prop() availableLocales: { code: LocaleCode; label: string }[] = [];
  @Prop() shortcuts: Omit<KritzelShortcut, 'action' | 'condition'>[] = [];
  /** Resolved localized strings keyed by term key, supplied by the editor. */
  @Prop() terms: Partial<Record<KritzelTermKey, string>> = {};

  /** Current settings values. Used to initialize and sync the component's internal state. */
  @Prop() settings?: Partial<KritzelSettingsConfig>;
  @Watch('settings')
  onSettingsPropChange(newSettings?: Partial<KritzelSettingsConfig>) {
    if (newSettings) {
      this.applySettings(newSettings);
    }
  }

  @State() isDialogOpen: boolean = false;
  @State() selectedCategoryId: string = SETTINGS_CATEGORY_IDS[0];
  @State() scaleMin: number = DEFAULT_SCALE_MIN;
  @State() scaleMax: number = DEFAULT_SCALE_MAX;
  @State() lockDrawingScale: boolean = DEFAULT_LOCK_DRAWING_SCALE;
  @State() theme: ThemeName = 'light';
  @State() locale: LocaleCode = 'en';
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
    if (typeof settings.locale === 'string') {
      this.locale = settings.locale;
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
      locale: this.locale,
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

  private handleLocaleChange = (event: CustomEvent<string>): void => {
    this.locale = event.detail;
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

  @Method()
  async close(): Promise<void> {
    this.closeDialog();
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

  /**
   * Resolves a localized string from the supplied {@link terms} map, falling
   * back to the provided English default when the key is missing.
   */
  private t(key: KritzelTermKey, fallback: string): string {
    return this.terms[key] ?? fallback;
  }

  private get categories(): IKritzelMasterDetailItem[] {
    const icons: Record<(typeof SETTINGS_CATEGORY_IDS)[number], string> = {
      general: 'settings',
      viewport: 'viewport',
      shortcuts: 'command',
      developer: 'braces',
      about: 'info',
    };
    const labels: Record<(typeof SETTINGS_CATEGORY_IDS)[number], { key: KritzelTermKey; fallback: string }> = {
      general: { key: 'settings.categories.general', fallback: 'General' },
      viewport: { key: 'settings.categories.viewport', fallback: 'Viewport' },
      shortcuts: { key: 'settings.categories.shortcuts', fallback: 'Keyboard Shortcuts' },
      developer: { key: 'settings.categories.developer', fallback: 'Developer Options' },
      about: { key: 'settings.categories.about', fallback: 'About' },
    };
    return SETTINGS_CATEGORY_IDS.map(id => ({
      id,
      label: this.t(labels[id].key, labels[id].fallback),
      icon: icons[id],
    }));
  }

  private renderCategoryContent() {
    return (
      <div class="settings-categories-wrapper">
        <div class={{ 'settings-tab-panel': true, 'is-active': this.selectedCategoryId === 'general' }}>
          <div class="settings-content">
            <h3>{this.t('settings.general.title', 'General Settings')}</h3>
            <div class="settings-group">
              <div class="settings-item">
                <label class="settings-label">{this.t('settings.general.theme.label', 'Theme')}</label>
                <p class="settings-description">
                  {this.t('settings.general.theme.description', 'Select a registered color theme for the editor interface.')}
                </p>
                <kritzel-dropdown
                  options={this.availableThemes.map(t => ({ value: t, label: t }))}
                  value={this.theme}
                  onValueChanged={this.handleThemeChange}
                ></kritzel-dropdown>
              </div>
              {this.availableLocales.length > 0 && (
                <div class="settings-item">
                  <label class="settings-label">{this.t('settings.general.language.label', 'Language')}</label>
                  <p class="settings-description">
                    {this.t('settings.general.language.description', 'Select the display language for the editor interface.')}
                  </p>
                  <kritzel-dropdown
                    options={this.availableLocales.map(l => ({ value: l.code, label: l.label }))}
                    value={this.locale}
                    onValueChanged={this.handleLocaleChange}
                  ></kritzel-dropdown>
                </div>
              )}
              <div class="settings-item">
                <label class="settings-label">{this.t('settings.general.lockDrawingScale.label', 'Lock Drawing Scale')}</label>
                <p class="settings-description">
                  {this.t('settings.general.lockDrawingScale.description', 'When enabled, drawn objects maintain a fixed visual size regardless of the current zoom level.')}
                </p>
                <kritzel-slide-toggle
                  checked={this.lockDrawingScale}
                  label={this.t('settings.general.lockDrawingScale.label', 'Lock Drawing Scale')}
                  onCheckedChange={this.handleLockDrawingScaleChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div class={{ 'settings-tab-panel': true, 'is-active': this.selectedCategoryId === 'viewport' }}>
          <div class="settings-content">
            <h3>{this.t('settings.viewport.title', 'Viewport Settings')}</h3>
            <div class="settings-group">
              <div class="settings-item">
                <label class="settings-label">{this.t('settings.viewport.minZoom.label', 'Minimum Zoom Level')}</label>
                <p class="settings-description">
                  {this.t('settings.viewport.minZoom.description', 'Sets the minimum zoom level. Lower values allow zooming out further to see more of the canvas.')}
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
                <label class="settings-label">{this.t('settings.viewport.maxZoom.label', 'Maximum Zoom Level')}</label>
                <p class="settings-description">
                  {this.t('settings.viewport.maxZoom.description', 'Sets the maximum zoom level. Higher values allow zooming in closer for detailed work.')}
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
                <label class="settings-label">{this.t('settings.viewport.boundaryLeft.label', 'Viewport Boundary Left')}</label>
                <p class="settings-description">
                  {this.t('settings.viewport.boundaryLeft.description', 'Left boundary in world coordinates. Set to limit how far left the viewport can pan.')}
                </p>
                <kritzel-numeric-input
                  value={this.viewportBoundaryLeft}
                  step={100}
                  placeholder={this.t('settings.viewport.boundaryPlaceholder', 'Infinite')}
                  onValueChange={this.handleViewportBoundaryLeftChange}
                />
              </div>
              <div class="settings-item">
                <label class="settings-label">{this.t('settings.viewport.boundaryRight.label', 'Viewport Boundary Right')}</label>
                <p class="settings-description">
                  {this.t('settings.viewport.boundaryRight.description', 'Right boundary in world coordinates. Set to limit how far right the viewport can pan.')}
                </p>
                <kritzel-numeric-input
                  value={this.viewportBoundaryRight}
                  step={100}
                  placeholder={this.t('settings.viewport.boundaryPlaceholder', 'Infinite')}
                  onValueChange={this.handleViewportBoundaryRightChange}
                />
              </div>
              <div class="settings-item">
                <label class="settings-label">{this.t('settings.viewport.boundaryTop.label', 'Viewport Boundary Top')}</label>
                <p class="settings-description">
                  {this.t('settings.viewport.boundaryTop.description', 'Top boundary in world coordinates. Set to limit how far up the viewport can pan.')}
                </p>
                <kritzel-numeric-input
                  value={this.viewportBoundaryTop}
                  step={100}
                  placeholder={this.t('settings.viewport.boundaryPlaceholder', 'Infinite')}
                  onValueChange={this.handleViewportBoundaryTopChange}
                />
              </div>
              <div class="settings-item">
                <label class="settings-label">{this.t('settings.viewport.boundaryBottom.label', 'Viewport Boundary Bottom')}</label>
                <p class="settings-description">
                  {this.t('settings.viewport.boundaryBottom.description', 'Bottom boundary in world coordinates. Set to limit how far down the viewport can pan.')}
                </p>
                <kritzel-numeric-input
                  value={this.viewportBoundaryBottom}
                  step={100}
                  placeholder={this.t('settings.viewport.boundaryPlaceholder', 'Infinite')}
                  onValueChange={this.handleViewportBoundaryBottomChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div class={{ 'settings-tab-panel': true, 'is-active': this.selectedCategoryId === 'shortcuts' }}>
          <div class="settings-content">
            <h3>{this.t('settings.shortcuts.title', 'Keyboard Shortcuts')}</h3>
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
        </div>

        <div class={{ 'settings-tab-panel': true, 'is-active': this.selectedCategoryId === 'developer' }}>
          <div class="settings-content">
            <h3>{this.t('settings.developer.title', 'Developer Options')}</h3>
            <div class="settings-group">
              <div class="settings-item">
                <label class="settings-label">{this.t('settings.developer.showViewportInfo.label', 'Show Viewport Info')}</label>
                <p class="settings-description">
                  {this.t('settings.developer.showViewportInfo.description', 'Display viewport debug information such as position, zoom level, and boundaries.')}
                </p>
                <kritzel-slide-toggle
                  checked={this.debugInfo.showViewportInfo}
                  label={this.t('settings.developer.showViewportInfo.label', 'Show Viewport Info')}
                  onCheckedChange={this.handleDebugInfoChange('showViewportInfo')}
                />
              </div>
              <div class="settings-item">
                <label class="settings-label">{this.t('settings.developer.showObjectInfo.label', 'Show Object Info')}</label>
                <p class="settings-description">
                  {this.t('settings.developer.showObjectInfo.description', 'Display debug information about objects on the canvas.')}
                </p>
                <kritzel-slide-toggle
                  checked={this.debugInfo.showObjectInfo}
                  label={this.t('settings.developer.showObjectInfo.label', 'Show Object Info')}
                  onCheckedChange={this.handleDebugInfoChange('showObjectInfo')}
                />
              </div>
              <div class="settings-item">
                <label class="settings-label">{this.t('settings.developer.showSyncProviderInfo.label', 'Show Sync Provider Info')}</label>
                <p class="settings-description">
                  {this.t('settings.developer.showSyncProviderInfo.description', 'Display debug information about the sync provider connection status.')}
                </p>
                <kritzel-slide-toggle
                  checked={this.debugInfo.showSyncProviderInfo}
                  label={this.t('settings.developer.showSyncProviderInfo.label', 'Show Sync Provider Info')}
                  onCheckedChange={this.handleDebugInfoChange('showSyncProviderInfo')}
                />
              </div>
              <div class="settings-item">
                <label class="settings-label">{this.t('settings.developer.showMigrationInfo.label', 'Show Migration Info')}</label>
                <p class="settings-description">
                  {this.t('settings.developer.showMigrationInfo.description', 'Display debug information about data migrations.')}
                </p>
                <kritzel-slide-toggle
                  checked={this.debugInfo.showMigrationInfo}
                  label={this.t('settings.developer.showMigrationInfo.label', 'Show Migration Info')}
                  onCheckedChange={this.handleDebugInfoChange('showMigrationInfo')}
                />
              </div>
            </div>
          </div>
        </div>

        <div class={{ 'settings-tab-panel': true, 'is-active': this.selectedCategoryId === 'about' }}>
          <div class="settings-content">
            <h3>{this.t('settings.about.title', 'About')}</h3>
            <p>{this.t('settings.about.description', 'Kritzel - A drawing application')}</p>
            <p class="version-info">Version {KRITZEL_VERSION}</p>
            <p class="version-info">App-State Schema v{CURRENT_APP_STATE_SCHEMA_VERSION}</p>
            <p class="version-info">Workspace Schema v{CURRENT_WORKSPACE_SCHEMA_VERSION}</p>
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <Host>
        <kritzel-dialog
          isOpen={this.isDialogOpen}
          dialogTitle={this.t('settings.dialogTitle', 'Settings')}
          size="large"
          contained={true}
          onDialogClose={this.closeDialog}
        >
          <kritzel-master-detail
            items={this.categories}
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
