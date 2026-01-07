# kritzel-control-shape-config

Configuration panel for the shape tool. Allows users to adjust stroke color, stroke size, and fill style.

<!-- Auto Generated Below -->

## Properties

| Property     | Attribute     | Description                            | Type               | Default     |
| ------------ | ------------- | -------------------------------------- | ------------------ | ----------- |
| `isExpanded` | `is-expanded` | Whether the color palette is expanded  | `boolean`          | `false`     |
| `tool`       | --            | The shape tool instance to configure   | `KritzelShapeTool` | `undefined` |

## Events

| Event        | Description                                   | Type                           |
| ------------ | --------------------------------------------- | ------------------------------ |
| `toolChange` | Emitted when any tool property is changed     | `CustomEvent<KritzelShapeTool>` |

## Dependencies

### Depends on

- [kritzel-color-palette](../../shared/kritzel-color-palette)
- [kritzel-icon](../../shared/kritzel-icon)
- [kritzel-stroke-size](../../shared/kritzel-stroke-size)
- [kritzel-shape-fill](../../shared/kritzel-shape-fill)

### Graph
```mermaid
graph TD;
  kritzel-control-shape-config --> kritzel-color-palette
  kritzel-control-shape-config --> kritzel-icon
  kritzel-control-shape-config --> kritzel-stroke-size
  kritzel-control-shape-config --> kritzel-shape-fill
  kritzel-color-palette --> kritzel-color
  kritzel-stroke-size --> kritzel-color
  style kritzel-control-shape-config fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
