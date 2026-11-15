# upmade-dropdown



<!-- Auto Generated Below -->


## Properties

| Property             | Attribute              | Description                                                                  | Type               | Default     |
| -------------------- | ---------------------- | ---------------------------------------------------------------------------- | ------------------ | ----------- |
| `forceOpenDirection` | `force-open-direction` | Force the dropdown to open in a specific direction instead of auto-detecting | `"down" \| "up"`   | `undefined` |
| `options`            | --                     |                                                                              | `DropdownOption[]` | `[]`        |
| `selectStyles`       | --                     |                                                                              | `string`           | `{}`        |
| `value`              | `value`                |                                                                              | `string`           | `undefined` |
| `width`              | `width`                |                                                                              | `string`           | `undefined` |


## Events

| Event          | Description | Type                  |
| -------------- | ----------- | --------------------- |
| `valueChanged` |             | `CustomEvent<string>` |


## Slots

| Slot       | Description |
| ---------- | ----------- |
| `"prefix"` |             |
| `"suffix"` |             |


## Dependencies

### Used by

 - [upmade-brush-style](../upmade-brush-style)
 - [upmade-export](../upmade-export)
 - [upmade-font-family](../upmade-font-family)
 - [upmade-settings](../upmade-settings)

### Graph
```mermaid
graph TD;
  upmade-brush-style --> upmade-dropdown
  upmade-export --> upmade-dropdown
  upmade-font-family --> upmade-dropdown
  upmade-settings --> upmade-dropdown
  style upmade-dropdown fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
