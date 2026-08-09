# Theme Pattern

## Location

- CSS variables declared in: `components/**/*.css` and `components/**/*.tsx`
- Theme interface: `interfaces/theme.interface.ts` (auto-generated)
- Theme presets: `themes/light-theme.ts`, `themes/dark-theme.ts`
- Theme helper: `helpers/theme.helper.ts`
- Theme manager: `classes/managers/theme.manager.ts`
- Generator script: `scripts/generate-theme-interface.js`

## Adding a New CSS Variable

### Step 1: Use the variable in CSS or TSX

In a `.css` file:
```css
.my-element {
  color: var(--kritzel-my-component-text-color, #333333);
}
```

Or in a `.tsx` file (inline style):
```tsx
style={{ color: 'var(--kritzel-my-component-text-color, #333333)' }}
```

### Step 2: Run the generator

```bash
node scripts/generate-theme-interface.js
```

This scans all `.css` and `.tsx` files for `--kritzel-*` patterns and regenerates `theme.interface.ts`.

### Step 3: Add values to theme presets

In `themes/light-theme.ts`:
```typescript
myComponent: {
  textColor: '#333333',
},
```

In `themes/dark-theme.ts`:
```typescript
myComponent: {
  textColor: '#e0e0e0',
},
```

### Step 4: Update related unit tests

If any tests assert generated theme metadata or flattened variable totals (for example in `helpers/theme.helper.spec.ts`), update those expectations to reflect the new CSS variables.

Then run repository tests from root:

```bash
npm run test
```

## Naming Convention

```
--kritzel-<category>-<property-name>
```

- Category = component or domain (e.g., `controls`, `menu`, `selection-box`)
- Property = camelCase when in TypeScript, kebab-case in CSS

Examples:
- `--kritzel-controls-background-color` → `controls.backgroundColor`
- `--kritzel-selection-box-border-color` → `selection.boxBorderColor`

## Category Detection

The generator groups variables by matching known category prefixes (longest match first). To add a new top-level category, add it to the `KNOWN_CATEGORIES` array in `scripts/generate-theme-interface.js`.

## How Themes Are Applied

1. `KritzelThemeManager` holds a registry of `KritzelTheme` objects
2. `ThemeHelper.flattenThemeToVariables(theme)` converts the nested theme object to a flat `Record<string, string>` of CSS variable names → values
3. `ThemeHelper.applyVariablesToElement(vars, element)` writes them as inline styles on the host element
4. Components read variables via `var(--kritzel-*, fallback)` in their CSS

## ThemeAwareColor

For object properties that change with theme (e.g., object fill/border):

```typescript
import { ThemeAwareColor } from '../../constants/color-palette.constants';

const color: ThemeAwareColor = {
  light: 'var(--kritzel-my-var)',
  dark: 'var(--kritzel-my-var)',
};
```

Resolved at render time via `KritzelColorHelper.resolveThemeColor(color, currentTheme)`.

## Rules

- Always provide a fallback in `var()` declarations
- Prefix ALL custom properties with `--kritzel-`
- Never hardcode colors in components — always use CSS variables
- Keep light and dark theme presets in sync (same keys)
- When switching themes, remove variables applied by the previous theme that are absent from the next theme; partial custom themes must not inherit stale values
- Run the generator after adding/removing variables
