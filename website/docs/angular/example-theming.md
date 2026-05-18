---
sidebar_label: Theming & Custom Branding
displayed_sidebar: tutorialSidebar
title: "Theming & Custom Branding Example | Kritzel for Angular"
description: "Build a coherent custom theme step by step, from overriding accent colors through a full branded light/dark pair to syncing the active theme with the host application."
---

# Theming & Custom Branding

This guide builds up a custom Kritzel theme step by step, starting from a bare minimum and progressively adding configuration until reaching a fully controlled setup.

## Prerequisites

Install the Angular wrapper package:

```bash
npm install kritzel-angular
```

Register Kritzel in your application config:

```ts title="app.config.ts"
import { ApplicationConfig } from '@angular/core';
import { provideKritzel } from 'kritzel-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideKritzel(),
    // ... other providers
  ],
};
```

Then import `KritzelEditor` into your standalone component:

```ts title="editor.component.ts"
import { Component } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<kritzel-editor></kritzel-editor>`,
})
export class EditorComponent {}
```

Add the following to your global styles (for example `src/styles.scss`):

```scss title="styles.scss"
html,
body {
  width: 100dvw;
  height: 100dvh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  overscroll-behavior-x: none;
}
```

This renders the editor with the default theme tokens, ready for progressive branding overrides in the steps below.

---

## How Theming Works

Kritzel renders without a Shadow DOM, so every visual token is reachable from the host page via CSS custom properties. All variables follow the naming convention `--kritzel-{section}-{property}`, where keys are derived from the `KritzelTheme` interface by converting camelCase to kebab-case:

| `KritzelTheme` key path | CSS custom property |
|---|---|
| `global.textPrimary` | `--kritzel-global-text-primary` |
| `engine.backgroundColor` | `--kritzel-engine-background-color` |
| `controls.backgroundColor` | `--kritzel-controls-background-color` |
| `controls.controlSelectedBackgroundColor` | `--kritzel-controls-control-selected-background-color` |
| `selection.borderColor` | `--kritzel-selection-border-color` |

Two preset objects — `lightTheme` and `darkTheme` — are exported from `kritzel-stencil` and can be spread into a custom `KritzelTheme` object to override individual tokens while inheriting the rest. The `themeChange` event fires whenever the user toggles the theme through the editor's settings panel, carrying the new `ThemeName` (`'light'` or `'dark'`).

---

## Step 1: Overriding Accent Colors

Add CSS custom properties to the component's stylesheet to replace the default blue accent with a brand color:

```ts title="editor.component.ts"
import { Component } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<kritzel-editor></kritzel-editor>`,
  // highlight-start
  styles: [`
    kritzel-editor { display: block; width: 100%; height: 100vh; }
    kritzel-editor {
      --kritzel-controls-control-selected-background-color: #6200EE;
      --kritzel-controls-control-selected-color: #ffffff;
      --kritzel-selection-border-color: #6200EE;
      --kritzel-selection-handle-color: #ffffff;
    }
  `],
  // highlight-end
})
export class EditorComponent {}
```

The four variables change the toolbar's active-tool indicator (background and icon color) and the selection rectangle (border and resize handle fill). CSS custom properties cascade through Kritzel's light-DOM structure, so a single rule on the host element is sufficient.

---

## Step 2: Building a Full Branded Light Theme

The CSS approach covers individual tokens but requires knowing exact variable names. Building a typed `KritzelTheme` object provides autocomplete on every section and keeps the full theme in one place. Apply it once after the editor is ready:

```ts title="editor.component.ts"
// highlight-start
import { Component, ElementRef, ViewChild } from '@angular/core';
// highlight-end
import { ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
// highlight-start
import { KritzelTheme, KritzelThemeManager, lightTheme } from 'kritzel-stencil';

const brandedLightTheme: KritzelTheme = {
  ...lightTheme,
  global: {
    ...lightTheme.global,
    textPrimary: '#1a0050',
    textSecondary: '#3d1e78',
  },
  engine: {
    ...lightTheme.engine,
    backgroundColor: '#faf7ff',
  },
  controls: {
    ...lightTheme.controls,
    backgroundColor: '#ffffff',
    controlSelectedBackgroundColor: '#6200EE',
    controlSelectedColor: '#ffffff',
    controlHoverBackgroundColor: 'rgba(98, 0, 238, 0.08)',
  },
  selection: {
    ...lightTheme.selection,
    borderColor: '#6200EE',
    handleColor: '#ffffff',
  },
};
// highlight-end

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // highlight-start
  template: `
    <kritzel-editor
      #editorEl
      (isReady)="onIsReady()"
    ></kritzel-editor>
  `,
  // highlight-end
  styles: [`kritzel-editor { display: block; width: 100%; height: 100vh; }`],
})
export class EditorComponent {
  // highlight-start
  @ViewChild('editorEl', { read: ElementRef }) editorEl!: ElementRef<HTMLElement>;

  onIsReady(): void {
    this.applyTheme(brandedLightTheme, this.editorEl.nativeElement);
  }

  private applyTheme(theme: KritzelTheme, element: HTMLElement): void {
    const toKebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    for (const [section, tokens] of Object.entries(theme)) {
      if (section === 'name' || typeof tokens !== 'object') continue;
      for (const [prop, value] of Object.entries(tokens as Record<string, string>)) {
        element.style.setProperty(`--kritzel-${toKebab(section)}-${toKebab(prop)}`, value);
      }
    }
  }
  // highlight-end
}
```

`applyTheme` iterates the `KritzelTheme` object, derives each CSS variable name from the section and property keys, and sets them as inline styles on the editor element. Inline styles override the component stylesheet, so this approach supersedes the manual overrides from Step 1.

---

## Step 3: Adding a Custom Dark Variant

Add a paired dark theme object and re-apply the correct theme whenever the user toggles via the settings panel:

```ts title="editor.component.ts"
import { Component, ElementRef, ViewChild } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
// highlight-start
import { KritzelTheme, KritzelThemeManager, lightTheme, darkTheme, ThemeName } from 'kritzel-stencil';
// highlight-end

const brandedLightTheme: KritzelTheme = {
  ...lightTheme,
  global: {
    ...lightTheme.global,
    textPrimary: '#1a0050',
    textSecondary: '#3d1e78',
  },
  engine: {
    ...lightTheme.engine,
    backgroundColor: '#faf7ff',
  },
  controls: {
    ...lightTheme.controls,
    backgroundColor: '#ffffff',
    controlSelectedBackgroundColor: '#6200EE',
    controlSelectedColor: '#ffffff',
    controlHoverBackgroundColor: 'rgba(98, 0, 238, 0.08)',
  },
  selection: {
    ...lightTheme.selection,
    borderColor: '#6200EE',
    handleColor: '#ffffff',
  },
};

// highlight-start
const brandedDarkTheme: KritzelTheme = {
  ...darkTheme,
  global: {
    ...darkTheme.global,
    textPrimary: '#EDE7F6',
    textSecondary: '#D1C4E9',
  },
  engine: {
    ...darkTheme.engine,
    backgroundColor: '#12005e',
  },
  controls: {
    ...darkTheme.controls,
    backgroundColor: '#1a0080',
    controlSelectedBackgroundColor: '#BB86FC',
    controlSelectedColor: '#000000',
    controlHoverBackgroundColor: 'rgba(187, 134, 252, 0.12)',
  },
  selection: {
    ...darkTheme.selection,
    borderColor: '#BB86FC',
    handleColor: '#12005e',
  },
};
// highlight-end

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      #editorEl
      (isReady)="onIsReady()"
      // highlight-start
      (themeChange)="onThemeChange($event)"
      // highlight-end
    ></kritzel-editor>
  `,
  styles: [`kritzel-editor { display: block; width: 100%; height: 100vh; }`],
})
export class EditorComponent {
  @ViewChild('editorEl', { read: ElementRef }) editorEl!: ElementRef<HTMLElement>;

  onIsReady(): void {
    // highlight-start
    const stored = KritzelThemeManager.getStoredTheme();
    const theme = stored === 'dark' ? brandedDarkTheme : brandedLightTheme;
    this.applyTheme(theme, this.editorEl.nativeElement);
    // highlight-end
  }

  // highlight-start
  onThemeChange(event: CustomEvent<ThemeName>): void {
    const theme = event.detail === 'dark' ? brandedDarkTheme : brandedLightTheme;
    this.applyTheme(theme, this.editorEl.nativeElement);
  }
  // highlight-end

  private applyTheme(theme: KritzelTheme, element: HTMLElement): void {
    const toKebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    for (const [section, tokens] of Object.entries(theme)) {
      if (section === 'name' || typeof tokens !== 'object') continue;
      for (const [prop, value] of Object.entries(tokens as Record<string, string>)) {
        element.style.setProperty(`--kritzel-${toKebab(section)}-${toKebab(prop)}`, value);
      }
    }
  }
}
```

`KritzelThemeManager.getStoredTheme()` reads the persisted theme preference from `localStorage` so the branded theme is applied correctly even when the user returns with dark mode already active. `onThemeChange` re-applies whichever custom theme matches the new name every time the user switches.

---

## Step 4: Using ThemeAwareColor in Tool Configs

Override the `controls` input to give each drawing tool a branded color palette. `ThemeAwareColor` objects hold a `light` and `dark` value, and Kritzel automatically resolves the correct one based on the active theme:

```ts title="editor.component.ts"
import { Component, ElementRef, ViewChild } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import {
  KritzelTheme, KritzelThemeManager, lightTheme, darkTheme, ThemeName,
  // highlight-start
  KritzelBrushTool, KritzelSelectionTool, KritzelTextTool,
  ThemeAwareColor, KritzelToolbarControl,
  DEFAULT_BRUSH_CONFIG, DEFAULT_TEXT_CONFIG,
  // highlight-end
} from 'kritzel-stencil';

const brandedLightTheme: KritzelTheme = {
  ...lightTheme,
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

// highlight-start
const BRAND_PALETTE: ThemeAwareColor[] = [
  { light: '#6200EE', dark: '#BB86FC', label: 'Brand' },
  { light: '#03DAC6', dark: '#03DAC6', label: 'Accent' },
  { light: '#000000', dark: '#ffffff', label: 'Foreground' },
  { light: '#ffffff', dark: '#12005e', label: 'Background' },
];

const brandControls: KritzelToolbarControl[] = [
  {
    name: 'selection',
    type: 'tool',
    isDefault: true,
    tool: KritzelSelectionTool,
    icon: 'cursor',
  },
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
// highlight-end

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      #editorEl
      // highlight-start
      [controls]="brandControls"
      // highlight-end
      (isReady)="onIsReady()"
      (themeChange)="onThemeChange($event)"
    ></kritzel-editor>
  `,
  styles: [`kritzel-editor { display: block; width: 100%; height: 100vh; }`],
})
export class EditorComponent {
  @ViewChild('editorEl', { read: ElementRef }) editorEl!: ElementRef<HTMLElement>;

  // highlight-start
  readonly brandControls = brandControls;
  // highlight-end

  onIsReady(): void {
    const stored = KritzelThemeManager.getStoredTheme();
    const theme = stored === 'dark' ? brandedDarkTheme : brandedLightTheme;
    this.applyTheme(theme, this.editorEl.nativeElement);
  }

  onThemeChange(event: CustomEvent<ThemeName>): void {
    const theme = event.detail === 'dark' ? brandedDarkTheme : brandedLightTheme;
    this.applyTheme(theme, this.editorEl.nativeElement);
  }

  private applyTheme(theme: KritzelTheme, element: HTMLElement): void {
    const toKebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    for (const [section, tokens] of Object.entries(theme)) {
      if (section === 'name' || typeof tokens !== 'object') continue;
      for (const [prop, value] of Object.entries(tokens as Record<string, string>)) {
        element.style.setProperty(`--kritzel-${toKebab(section)}-${toKebab(prop)}`, value);
      }
    }
  }
}
```

Each `ThemeAwareColor` in `BRAND_PALETTE` declares a `light` and `dark` value. When the active theme is `'dark'`, Kritzel resolves each color's `dark` field for both the rendered strokes and the color swatches shown in the tool config panel.

---

## Step 5: Syncing themeChange to the Host Application

Propagate the editor's active theme to the surrounding page by writing a `data-theme` attribute onto `document.documentElement`, giving the rest of the application a CSS hook to react:

```ts title="editor.component.ts"
import { Component, ElementRef, signal, ViewChild } from '@angular/core';
// highlight-start
import { ChangeDetectionStrategy } from '@angular/core';
// highlight-end
import { KritzelEditor } from 'kritzel-angular';
import {
  KritzelTheme, KritzelThemeManager, lightTheme, darkTheme, ThemeName,
  KritzelBrushTool, KritzelSelectionTool, KritzelTextTool,
  ThemeAwareColor, KritzelToolbarControl,
  DEFAULT_BRUSH_CONFIG, DEFAULT_TEXT_CONFIG,
} from 'kritzel-stencil';

const brandedLightTheme: KritzelTheme = {
  ...lightTheme,
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
  selector: 'app-editor',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      #editorEl
      [controls]="brandControls"
      (isReady)="onIsReady()"
      (themeChange)="onThemeChange($event)"
    ></kritzel-editor>
    // highlight-start
    <div [attr.data-theme]="activeTheme()">
      Current theme: {{ activeTheme() }}
    </div>
    // highlight-end
  `,
  styles: [`kritzel-editor { display: block; width: 100%; height: 100vh; }`],
})
export class EditorComponent {
  @ViewChild('editorEl', { read: ElementRef }) editorEl!: ElementRef<HTMLElement>;

  readonly brandControls = brandControls;

  // highlight-start
  activeTheme = signal<ThemeName>('light');
  // highlight-end

  onIsReady(): void {
    const stored = KritzelThemeManager.getStoredTheme();
    const theme = stored === 'dark' ? brandedDarkTheme : brandedLightTheme;
    this.applyTheme(theme, this.editorEl.nativeElement);
    // highlight-start
    this.activeTheme.set(stored);
    document.documentElement.setAttribute('data-theme', stored);
    // highlight-end
  }

  onThemeChange(event: CustomEvent<ThemeName>): void {
    const theme = event.detail === 'dark' ? brandedDarkTheme : brandedLightTheme;
    this.applyTheme(theme, this.editorEl.nativeElement);
    // highlight-start
    this.activeTheme.set(event.detail);
    document.documentElement.setAttribute('data-theme', event.detail);
    // highlight-end
  }

  private applyTheme(theme: KritzelTheme, element: HTMLElement): void {
    const toKebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    for (const [section, tokens] of Object.entries(theme)) {
      if (section === 'name' || typeof tokens !== 'object') continue;
      for (const [prop, value] of Object.entries(tokens as Record<string, string>)) {
        element.style.setProperty(`--kritzel-${toKebab(section)}-${toKebab(prop)}`, value);
      }
    }
  }
}
```

Setting `data-theme` on `document.documentElement` makes the active theme queryable from any stylesheet in the application:

```css title="styles.css"
[data-theme='dark'] .app-sidebar {
  background: #1a0080;
  color: #EDE7F6;
}

[data-theme='dark'] .app-toolbar {
  border-color: rgba(187, 134, 252, 0.2);
}
```

The `activeTheme` signal carries the same value for any Angular component that needs to adjust its template or styles reactively.
