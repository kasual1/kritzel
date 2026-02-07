# kritzel-tool-config



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute     | Description | Type                                                                                                 | Default     |
| ------------ | ------------- | ----------- | ---------------------------------------------------------------------------------------------------- | ----------- |
| `isExpanded` | `is-expanded` |             | `boolean`                                                                                            | `false`     |
| `theme`      | `theme`       |             | `"dark" \| "light"`                                                                                  | `undefined` |
| `tool`       | --            |             | `KritzelBrushTool \| KritzelLineTool \| KritzelSelectionTool \| KritzelShapeTool \| KritzelTextTool` | `undefined` |


## Events

| Event                 | Description | Type                                                                                                              |
| --------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------- |
| `displayValuesChange` |             | `CustomEvent<ToolDisplayValues>`                                                                                  |
| `toolChange`          |             | `CustomEvent<KritzelBrushTool \| KritzelLineTool \| KritzelSelectionTool \| KritzelShapeTool \| KritzelTextTool>` |


## Dependencies

### Used by

 - [kritzel-controls](../kritzel-controls)

### Depends on

- [kritzel-stroke-size](../../shared/kritzel-stroke-size)
- [kritzel-font-size](../../shared/kritzel-font-size)
- [kritzel-line-endings](../../shared/kritzel-line-endings)
- [kritzel-shape-fill](../../shared/kritzel-shape-fill)
- [kritzel-font-family](../../shared/kritzel-font-family)
- [kritzel-color-palette](../../shared/kritzel-color-palette)
- [kritzel-opacity-slider](../../shared/kritzel-opacity-slider)
- [kritzel-icon](../../shared/kritzel-icon)

### Graph
```mermaid
graph TD;
  kritzel-tool-config --> kritzel-stroke-size
  kritzel-tool-config --> kritzel-font-size
  kritzel-tool-config --> kritzel-line-endings
  kritzel-tool-config --> kritzel-shape-fill
  kritzel-tool-config --> kritzel-font-family
  kritzel-tool-config --> kritzel-color-palette
  kritzel-tool-config --> kritzel-opacity-slider
  kritzel-tool-config --> kritzel-icon
  kritzel-stroke-size --> kritzel-color
  kritzel-font-size --> kritzel-font
  kritzel-font-family --> kritzel-dropdown
  kritzel-color-palette --> kritzel-color
  kritzel-controls --> kritzel-tool-config
  style kritzel-tool-config fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
