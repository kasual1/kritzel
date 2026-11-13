# updraw-dropdown



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

 - [updraw-brush-style](../updraw-brush-style)
 - [updraw-export](../updraw-export)
 - [updraw-font-family](../updraw-font-family)
 - [updraw-settings](../updraw-settings)

### Graph
```mermaid
graph TD;
  updraw-brush-style --> updraw-dropdown
  updraw-export --> updraw-dropdown
  updraw-font-family --> updraw-dropdown
  updraw-settings --> updraw-dropdown
  style updraw-dropdown fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
