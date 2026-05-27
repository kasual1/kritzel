# Component Pattern

## Location

`libs/kritzel-stencil/src/components/`

Organized into:
- `core/` — kritzel-editor, kritzel-engine, awareness
- `ui/` — reusable UI controls (context menu, dialogs, dropdowns)
- `shared/` — shared sub-components

## Stencil Component Structure

Each component lives in its own folder:

```
components/ui/kritzel-my-component/
├── kritzel-my-component.tsx    # Component logic
├── kritzel-my-component.css    # Styles (uses CSS variables)
└── kritzel-my-component.spec.ts  # Tests (optional)
```

## Component Skeleton

```tsx
import { Component, h, Prop, Event, EventEmitter, Method } from '@stencil/core';

@Component({
  tag: 'kritzel-my-component',
  styleUrl: 'kritzel-my-component.css',
  shadow: true,
})
export class KritzelMyComponent {
  /** Configuration prop */
  @Prop() label: string = '';

  /** Emits when user interacts */
  @Event() myEvent: EventEmitter<string>;

  /** Public API method */
  @Method()
  async doSomething(): Promise<void> {
    // ...
  }

  render() {
    return (
      <div class="my-component">
        <span>{this.label}</span>
      </div>
    );
  }
}
```

## Decorators

| Decorator | Purpose |
|-----------|---------|
| `@Prop()` | External configuration (reactive) |
| `@State()` | Internal reactive state |
| `@Event()` | Emitted events |
| `@Method()` | Public API methods |
| `@Watch('propName')` | React to prop changes |
| `@Element()` | Host element reference |
| `@Listen('event')` | Listen to DOM events |

## CSS Variables

All styling must use `--kritzel-*` CSS custom properties with fallback values:

```css
:host {
  --_bg: var(--kritzel-my-component-background-color, #ffffff);
  background-color: var(--_bg);
}
```

After adding new CSS variables:
1. Run `node scripts/generate-theme-interface.js`
2. Add values to `themes/light-theme.ts` and `themes/dark-theme.ts`

## Conventions

- Tag name: `kritzel-<name>` (kebab-case)
- Class name: `Kritzel<Name>` (PascalCase)
- Always use Shadow DOM (`shadow: true`)
- UI components must NOT import `KritzelCore` or engine internals
- UI components receive data via `@Prop()` and emit via `@Event()`
- Core components (editor, engine) may access `KritzelCore`
- Keep render methods small; extract complex JSX into private render helpers

## Core vs UI Components

| Aspect | Core Component | UI Component |
|--------|---------------|--------------|
| Accesses KritzelCore | Yes | No |
| Contains business logic | Yes | No |
| Reusable outside editor | No | Yes |
| Location | `components/core/` | `components/ui/` |
