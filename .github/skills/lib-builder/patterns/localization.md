# Localization Pattern

## Location

`libs/core/src/interfaces/localization.interface.ts`
`libs/core/src/classes/managers/localization.manager.ts`
`libs/core/src/locales/`
`libs/engine/core/src/components/core/kritzel-engine/`
`libs/engine/core/src/components/core/kritzel-editor/`
`libs/engine/core/src/components/ui/`

## Purpose

Kritzel localization is built around named term keys and a per-editor localization manager. Built-in locales define the default English, German, and French strings; consumers can register custom locales or override subsets of terms.

## Core Model

| Piece | Responsibility |
|------|-----------------|
| `KritzelTerms` | Compile-time contract for all known term keys |
| `KritzelLocale` | One locale definition with `code`, optional `label`, and partial `terms` |
| `KritzelLocalizationManager` | Locale registration, fallback resolution, interpolation, persistence |
| `kritzel-engine` | Exposes localization APIs to the editor and wrapper consumers |
| `kritzel-editor` | Resolves terms once and passes strings into UI components as props |

## Resolution Rules

The manager resolves terms in this order:

1. active locale's custom terms
2. active locale's built-in terms
3. fallback locale's custom terms
4. fallback locale's built-in terms
5. the key itself

After resolution, `{placeholder}` tokens are interpolated with the provided values.

## Public API Expectations

- `kritzel-engine` exposes `t(key, vars?)` for resolving a single term
- `kritzel-engine` may also expose a bulk helper such as `getResolvedTerms()` when a UI layer needs many strings at once
- UI components should receive resolved strings via `@Prop()` instead of reaching into `KritzelCore`
- Core and editor components may use the localization manager directly when they own the orchestration

## Adding New UI Terms

1. Add the key to `KritzelTerms` in `interfaces/localization.interface.ts`
2. Add the English fallback value in `locales/en-locale.ts`
3. Add matching translations to `locales/de-locale.ts` and `locales/fr-locale.ts`
4. Resolve the new key in `kritzel-editor` so UI components receive the translated string through props
5. Prefer namespaced, dotted keys such as `settings.general.theme.label`

## Component Wiring Rules

- Reusable UI components should be dumb: `@Prop() terms: Partial<Record<KritzelTermKey, string>> = {}` is the preferred shape for translated labels
- Keep the English default inline at the usage site so the UI still renders if a term is missing
- If a component is actually core-orchestration code, it may call `this.core.localizationManager.translate(...)` directly
- Do not store translated labels only in module-level constants if they need to react to locale changes

## Tests

- Add or update localization manager tests when changing fallback logic, persistence, or locale registration
- Add component tests when a translated prop changes behavior or accessibility labels
- Include at least one late-prop update test when localization is bridged through long-lived collaborators