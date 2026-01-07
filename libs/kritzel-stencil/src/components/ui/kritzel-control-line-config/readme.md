# kritzel-control-line-config

Configuration panel for the line tool. Allows users to adjust stroke color, stroke size, and line endings (arrows).

<!-- Auto Generated Below -->

## Properties

| Property     | Attribute     | Description                          | Type              | Default     |
| ------------ | ------------- | ------------------------------------ | ----------------- | ----------- |
| `isExpanded` | `is-expanded` | Whether the color palette is expanded | `boolean`         | `false`     |
| `tool`       | --            | The line tool instance to configure  | `KritzelLineTool` | `undefined` |

## Events

| Event        | Description                                   | Type                          |
| ------------ | --------------------------------------------- | ----------------------------- |
| `toolChange` | Emitted when any tool property is changed     | `CustomEvent<KritzelLineTool>` |

## Dependencies

### Depends on

- [kritzel-color-palette](../../shared/kritzel-color-palette)
- [kritzel-icon](../../shared/kritzel-icon)
- [kritzel-stroke-size](../../shared/kritzel-stroke-size)
- [kritzel-line-endings](../../shared/kritzel-line-endings)

### Graph
```mermaid
graph TD;
  kritzel-control-line-config --> kritzel-color-palette
  kritzel-control-line-config --> kritzel-icon
  kritzel-control-line-config --> kritzel-stroke-size
  kritzel-control-line-config --> kritzel-line-endings
  kritzel-color-palette --> kritzel-color
  kritzel-stroke-size --> kritzel-color
  style kritzel-control-line-config fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
