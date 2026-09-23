# Component Pattern

## Location

`libs/engine/core/src/components/`

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
- For localization, prefer `@Prop() terms: Partial<Record<KritzelTermKey, string>> = {}` and keep English fallback text inline at the usage site
- If a UI component owns long-lived collaborators that render text, keep them synchronized with locale prop updates via `@Watch()`
- **JSX Keys on UI Controls (Crucial for VDOM Isolation):** Always assign unique, explicit `key` attributes to input controls (e.g. `<kritzel-slide-toggle>`, `<kritzel-dropdown>`, `<kritzel-numeric-input>`), especially when rendering conditional or tabbed views (`switch`/`case` or conditional tabs). Without explicit keys, Stencil's VDOM reconciler reuses DOM elements across view switches, retaining dirty internal state or triggering unwanted CSS transitions on reused controls.
- **Persistent DOM Containers for Complex UI Tab Panels / Hidden Views:** For complex UI views like settings dialogs or tabbed panels containing Web Components (which carry CSS transitions, internal shadow DOM state, or layout hydration overhead), prefer rendering all panels persistently into the DOM and toggling visibility via CSS (`display: none` / `display: block` or active classes) over conditional VDOM unmounting/remounting. This prevents unmount/remount cycles, eliminates hydration layout shifts, and avoids state reset jank during navigation.
  - **Scope Limit (UI vs Engine Canvas):** This persistent DOM pattern applies strictly to high-level UI container components (dialogs, tabs, sidebars). It must **NOT** be applied to canvas object rendering or core engine rendering pipelines, where dynamic unmounting, lifecycle management, virtualized viewports, and clean disposal of high-frequency objects are required for memory management and performance.

## Reactive Prop Bridging (Important)

When a component creates long-lived runtime instances (handlers/managers/viewports) that depend on `@Prop()` values, avoid constructor-time snapshots that can go stale.

Anti-pattern:

```tsx
this.handler = new MyHandler(this.somePropItems); // Captured once
```

Preferred pattern:

```tsx
@Prop() somePropItems: Item[] = [];

@Watch('somePropItems')
onSomePropItemsChange(newValue: Item[] | undefined) {
  if (this.handler) {
    this.handler.items = newValue ?? [];
  }
}

componentDidLoad() {
  this.handler = new MyHandler(this.somePropItems);
}
```

Why this matters:
- Framework wrappers can apply prop updates after `componentDidLoad`
- Without `@Watch()` bridging, runtime behavior can diverge from current prop values
- Defaults can unintentionally mask wrapper-provided values

Test expectation for this pattern:
- Add a unit test that changes the prop after handler creation and verifies the handler sees the updated value

## Core vs UI Components

| Aspect | Core Component | UI Component |
|--------|---------------|--------------|
| Accesses KritzelCore | Yes | No |
| Contains business logic | Yes | No |
| Reusable outside editor | No | Yes |
| Location | `components/core/` | `components/ui/` |
