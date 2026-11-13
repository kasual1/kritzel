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
  color: var(--updraw-my-component-text-color, #333333);
}
```

Or in a `.tsx` file (inline style):
```tsx
style={{ color: 'var(--updraw-my-component-text-color, #333333)' }}
```

### Step 2: Run the generator

```bash
node scripts/generate-theme-interface.js
```

This scans all `.css` and `.tsx` files for `--updraw-*` patterns and regenerates `theme.interface.ts`.

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
--updraw-<category>-<property-name>
```

- Category = component or domain (e.g., `toolbar`, `menu`, `selection-box`)
- Property = camelCase when in TypeScript, kebab-case in CSS

Examples:
- `--updraw-toolbar-background-color` â†’ `toolbar.backgroundColor`
- `--updraw-selection-box-border-color` â†’ `selection.boxBorderColor`

## Category Detection

The generator groups variables by matching known category prefixes (longest match first). To add a new top-level category, add it to the `KNOWN_CATEGORIES` array in `scripts/generate-theme-interface.js`.

## How Themes Are Applied

1. `UpdrawThemeManager` holds a registry of `UpdrawTheme` objects
2. `ThemeHelper.flattenThemeToVariables(theme)` converts the nested theme object to a flat `Record<string, string>` of CSS variable names â†’ values
3. `ThemeHelper.applyVariablesToElement(vars, element)` writes them as inline styles on the host element
4. Components read variables via `var(--updraw-*, fallback)` in their CSS

## ThemeAwareColor

For object properties that change with theme (e.g., object fill/border):

```typescript
import { ThemeAwareColor } from '../../constants/color-palette.constants';

const color: ThemeAwareColor = {
  light: 'var(--updraw-my-var)',
  dark: 'var(--updraw-my-var)',
};
```

Resolved at render time via `UpdrawColorHelper.resolveThemeColor(color, currentTheme)`.

## Rules

- Always provide a fallback in `var()` declarations
- Prefix ALL custom properties with `--updraw-`
- Never hardcode colors in components â€” always use CSS variables
- Keep light and dark theme presets in sync (same keys)
- When switching themes, remove variables applied by the previous theme that are absent from the next theme; partial custom themes must not inherit stale values
- Run the generator after adding/removing variables
