# kritzel-controls



<!-- Auto Generated Below -->


## Properties

| Property        | Attribute        | Description | Type                      | Default |
| --------------- | ---------------- | ----------- | ------------------------- | ------- |
| `activeControl` | `active-control` |             | `KritzelToolbarControl`   | `null`  |
| `controls`      | `controls`       |             | `KritzelToolbarControl[]` | `[]`    |


## Events

| Event           | Description | Type                |
| --------------- | ----------- | ------------------- |
| `controlsReady` |             | `CustomEvent<void>` |


## Dependencies

### Depends on

- [kritzel-utility-panel](../kritzel-utility-panel)
- [kritzel-icon](../../shared/kritzel-icon)
- [kritzel-tooltip](../../shared/kritzel-tooltip)
- [kritzel-control-brush-config](../kritzel-control-brush-config)
- [kritzel-control-text-config](../kritzel-control-text-config)
- [kritzel-color](../../shared/kritzel-color)
- [kritzel-font](../../shared/kritzel-font)

### Graph
```mermaid
graph TD;
  kritzel-controls --> kritzel-utility-panel
  kritzel-controls --> kritzel-icon
  kritzel-controls --> kritzel-tooltip
  kritzel-controls --> kritzel-control-brush-config
  kritzel-controls --> kritzel-control-text-config
  kritzel-controls --> kritzel-color
  kritzel-controls --> kritzel-font
  kritzel-utility-panel --> kritzel-icon
  kritzel-control-brush-config --> kritzel-brush-style
  kritzel-control-brush-config --> kritzel-icon
  kritzel-control-brush-config --> kritzel-color-palette
  kritzel-control-brush-config --> kritzel-stroke-size
  kritzel-brush-style --> kritzel-dropdown
  kritzel-brush-style --> kritzel-icon
  kritzel-color-palette --> kritzel-color
  kritzel-stroke-size --> kritzel-color
  kritzel-control-text-config --> kritzel-font-family
  kritzel-control-text-config --> kritzel-icon
  kritzel-control-text-config --> kritzel-color-palette
  kritzel-control-text-config --> kritzel-font-size
  kritzel-font-family --> kritzel-dropdown
  kritzel-font-size --> kritzel-font
  style kritzel-controls fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
