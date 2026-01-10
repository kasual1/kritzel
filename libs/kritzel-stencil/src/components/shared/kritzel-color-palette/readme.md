# kritzel-color-palette



<!-- Auto Generated Below -->


## Properties

| Property        | Attribute        | Description | Type       | Default |
| --------------- | ---------------- | ----------- | ---------- | ------- |
| `colors`        | --               |             | `string[]` | `[]`    |
| `isExpanded`    | `is-expanded`    |             | `boolean`  | `false` |
| `isOpaque`      | `is-opaque`      |             | `boolean`  | `false` |
| `opacity`       | `opacity`        |             | `number`   | `1`     |
| `selectedColor` | `selected-color` |             | `string`   | `null`  |


## Events

| Event         | Description | Type                  |
| ------------- | ----------- | --------------------- |
| `colorChange` |             | `CustomEvent<string>` |


## Dependencies

### Used by

 - [kritzel-tool-config](../../ui/kritzel-tool-config)

### Depends on

- [kritzel-color](../kritzel-color)

### Graph
```mermaid
graph TD;
  kritzel-color-palette --> kritzel-color
  kritzel-tool-config --> kritzel-color-palette
  style kritzel-color-palette fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
