# kritzel-control-brush-config



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute     | Description | Type               | Default     |
| ------------ | ------------- | ----------- | ------------------ | ----------- |
| `isExpanded` | `is-expanded` |             | `boolean`          | `false`     |
| `tool`       | `tool`        |             | `KritzelBrushTool` | `undefined` |


## Events

| Event        | Description | Type                            |
| ------------ | ----------- | ------------------------------- |
| `toolChange` |             | `CustomEvent<KritzelBrushTool>` |


## Dependencies

### Used by

 - [kritzel-controls](../kritzel-controls)

### Depends on

- [kritzel-brush-style](../../shared/kritzel-brush-style)
- [kritzel-icon](../../shared/kritzel-icon)
- [kritzel-color-palette](../../shared/kritzel-color-palette)
- [kritzel-stroke-size](../../shared/kritzel-stroke-size)

### Graph
```mermaid
graph TD;
  kritzel-control-brush-config --> kritzel-brush-style
  kritzel-control-brush-config --> kritzel-icon
  kritzel-control-brush-config --> kritzel-color-palette
  kritzel-control-brush-config --> kritzel-stroke-size
  kritzel-brush-style --> kritzel-dropdown
  kritzel-brush-style --> kritzel-icon
  kritzel-color-palette --> kritzel-color
  kritzel-stroke-size --> kritzel-color
  kritzel-controls --> kritzel-control-brush-config
  style kritzel-control-brush-config fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
