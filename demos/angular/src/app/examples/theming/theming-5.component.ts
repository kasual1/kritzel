import { Component, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import {
  KritzelTheme, KritzelThemeManager, lightTheme, darkTheme, ThemeName,
  KritzelBrushTool, KritzelSelectionTool, KritzelTextTool,
  ThemeAwareColor, KritzelToolbarControl,
  DEFAULT_BRUSH_CONFIG, DEFAULT_TEXT_CONFIG
} from 'kritzel-stencil';

const brandedLightTheme: KritzelTheme = {
  ...lightTheme,
  name: 'branded-light',
  global: { ...lightTheme.global, textPrimary: '#1a0050', textSecondary: '#3d1e78' },
  engine: { ...lightTheme.engine, backgroundColor: '#faf7ff' },
  controls: {
    ...lightTheme.controls,
    backgroundColor: '#ffffff',
    controlSelectedBackgroundColor: '#6200EE',
    controlSelectedColor: '#ffffff',
    controlHoverBackgroundColor: 'rgba(98, 0, 238, 0.08)',
  },
  selection: { ...lightTheme.selection, borderColor: '#6200EE', handleColor: '#ffffff' },
};

const brandedDarkTheme: KritzelTheme = {
  ...darkTheme,
  name: 'branded-dark',
  global: { ...darkTheme.global, textPrimary: '#EDE7F6', textSecondary: '#D1C4E9' },
  engine: { ...darkTheme.engine, backgroundColor: '#12005e' },
  controls: {
    ...darkTheme.controls,
    backgroundColor: '#1a0080',
    controlSelectedBackgroundColor: '#BB86FC',
    controlSelectedColor: '#000000',
    controlHoverBackgroundColor: 'rgba(187, 134, 252, 0.12)',
  },
  selection: { ...darkTheme.selection, borderColor: '#BB86FC', handleColor: '#12005e' },
};

const BRAND_PALETTE: ThemeAwareColor[] = [
  { light: '#6200EE', dark: '#BB86FC', label: 'Brand' },
  { light: '#03DAC6', dark: '#03DAC6', label: 'Accent' },
  { light: '#000000', dark: '#ffffff', label: 'Foreground' },
  { light: '#ffffff', dark: '#12005e', label: 'Background' },
];

const brandControls: KritzelToolbarControl[] = [
  { name: 'selection', type: 'tool', isDefault: true, tool: KritzelSelectionTool, icon: 'cursor' },
  {
    name: 'brush',
    type: 'tool',
    tool: KritzelBrushTool,
    icon: 'pen',
    config: {
      ...DEFAULT_BRUSH_CONFIG,
      color: { light: '#6200EE', dark: '#BB86FC', label: 'Brand' },
      palettes: { pen: BRAND_PALETTE },
    },
  },
  {
    name: 'text',
    type: 'tool',
    tool: KritzelTextTool,
    icon: 'type',
    config: {
      ...DEFAULT_TEXT_CONFIG,
      color: { light: '#1a0050', dark: '#EDE7F6', label: 'Text' },
      palette: BRAND_PALETTE,
    },
  },
  { name: 'config', type: 'config' },
];

@Component({
  selector: 'app-theming-5',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [attr.data-theme]="activeTheme()">
      Current theme: {{ activeTheme() }}
    </div>
    <kritzel-editor
      [controls]="brandControls"
      [theme]="activeTheme()"
      (themeChange)="onThemeChange($event)"
    ></kritzel-editor>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    div {
      padding: 8px;
    }
    kritzel-editor {
      flex: 1;
    }
  `],
})
export class Theming5Component implements OnInit {
  readonly brandControls = brandControls;

  activeTheme = signal<ThemeName>('branded-light');

  ngOnInit(): void {
    KritzelThemeManager.initializeThemes([brandedLightTheme, brandedDarkTheme]);

    const stored = KritzelThemeManager.getStoredTheme();
    // Default to our branded-light if neither of our branded themes are selected
    if (stored === 'branded-light' || stored === 'branded-dark') {
      this.activeTheme.set(stored);
      document.documentElement.setAttribute('data-theme', stored);
    } else {
      this.activeTheme.set('branded-light');
      document.documentElement.setAttribute('data-theme', 'branded-light');
    }
  }

  onThemeChange(event: CustomEvent<ThemeName>): void {
    this.activeTheme.set(event.detail);
    document.documentElement.setAttribute('data-theme', event.detail);
  }
}

