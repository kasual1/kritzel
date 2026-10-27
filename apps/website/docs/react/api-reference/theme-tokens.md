---
sidebar_label: Theming
title: "Theming | Kritzel for React"
description: "Customize the look and feel of the Kritzel editor with CSS variables and theme tokens."
---
# Theming

Kritzel includes built-in light and dark themes. Themes are applied via CSS variables, making every visual aspect customizable.

## Setting the Theme

### On `<KritzelEngine>`

```tsx
import { KritzelEngine } from '@kritzel/react-editor';

export function DarkCanvas() {
  return <KritzelEngine theme="dark" />;
}
```

### On `<KritzelEditor>`

The editor manages the theme internally and emits a `themeChange` event when it changes. The user can toggle the theme through the settings panel.

```tsx
<KritzelEditor
  onThemeChange={(event) => {
    console.log('Theme changed to:', event.detail);
  }}
/>
```

## Built-in Themes

### Light Theme (default)

| Token | Value |
|-------|-------|
| Engine background | `#ffffff` |
| toolbar background | `#ffffff` |
| Selected control | `#007AFF` |
| Primary text | `#000000` |
| Border | `#ebebeb` |
| Selection border | `#007AFF` |
| Selection handles | `#ffffff` |

### Dark Theme

| Token | Value |
|-------|-------|
| Engine background | `#1a1a1a` |
| toolbar background | `#2a2a2a` |
| Selected control | `#0A84FF` |
| Primary text | `#ffffff` |
| Border | `#3a3a3a` |
| Selection border | `#0A84FF` |
| Selection handles | `#1a1a1a` |

## Theme-Aware Colors

Tool palettes and object colors use `ThemeAwareColor` to adapt to the active theme:

```ts
interface ThemeAwareColor {
  light: string;  // Color value for light theme
  dark: string;   // Color value for dark theme
  label?: string; // Optional semantic label (e.g. 'Primary')
}
```

Example:

```ts
const color: ThemeAwareColor = {
  light: '#000000',
  dark: '#ffffff',
  label: 'Primary',
};
```

When the theme switches, all objects and tools automatically resolve to the appropriate color value.

## KritzelTheme Interface

The `KritzelTheme` interface defines CSS variables for every component section. You can import and customize the built-in themes:

```ts
import { lightTheme, darkTheme } from '@kritzel/engine';
```

Theme sections include: `global`, `engine`, `toolbar`, `selection`, `dialog`, `contextMenu`, `utilityPanel`, `tooltip`, `menu`, `dropdown`, `portal`, `settings`, `splitButton`, `moreMenu`, `titlebar`, and more.

The `titlebar` section styles [object titlebars](../fundamentals/controls.md#object-titlebar). See [Theming](./theming.md#titlebar) for its properties and default values.

Each section contains granular color tokens (background, text, border, hover states, etc.) that map to CSS custom properties on the component host elements.
