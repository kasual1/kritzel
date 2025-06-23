# kritzel-control-text-config



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute     | Description | Type              | Default     |
| ------------ | ------------- | ----------- | ----------------- | ----------- |
| `isExpanded` | `is-expanded` |             | `boolean`         | `false`     |
| `tool`       | `tool`        |             | `KritzelTextTool` | `undefined` |


## Events

| Event        | Description | Type                           |
| ------------ | ----------- | ------------------------------ |
| `toolChange` |             | `CustomEvent<KritzelTextTool>` |


## Dependencies

### Used by

 - [kritzel-controls](../kritzel-controls)

### Depends on

- [kritzel-font-family](../../shared/kritzel-font-family)
- [kritzel-icon](../../shared/kritzel-icon)
- [kritzel-color-palette](../../shared/kritzel-color-palette)
- [kritzel-font-size](../../shared/kritzel-font-size)

### Graph
```mermaid
graph TD;
  kritzel-control-text-config --> kritzel-font-family
  kritzel-control-text-config --> kritzel-icon
  kritzel-control-text-config --> kritzel-color-palette
  kritzel-control-text-config --> kritzel-font-size
  kritzel-font-family --> kritzel-dropdown
  kritzel-color-palette --> kritzel-color
  kritzel-font-size --> kritzel-font
  kritzel-controls --> kritzel-control-text-config
  style kritzel-control-text-config fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
