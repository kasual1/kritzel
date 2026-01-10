# kritzel-controls



<!-- Auto Generated Below -->


## Properties

| Property                | Attribute                  | Description | Type                      | Default |
| ----------------------- | -------------------------- | ----------- | ------------------------- | ------- |
| `activeControl`         | --                         |             | `KritzelToolbarControl`   | `null`  |
| `controls`              | --                         |             | `KritzelToolbarControl[]` | `[]`    |
| `isUtilityPanelVisible` | `is-utility-panel-visible` |             | `boolean`                 | `true`  |
| `undoState`             | --                         |             | `KritzelUndoState`        | `null`  |


## Events

| Event             | Description | Type                |
| ----------------- | ----------- | ------------------- |
| `isControlsReady` |             | `CustomEvent<void>` |


## Methods

### `closeTooltip() => Promise<void>`



#### Returns

Type: `Promise<void>`




## Dependencies

### Used by

 - [kritzel-editor](../../core/kritzel-editor)

### Depends on

- [kritzel-utility-panel](../kritzel-utility-panel)
- [kritzel-icon](../../shared/kritzel-icon)
- [kritzel-tooltip](../../shared/kritzel-tooltip)
- [kritzel-tool-config](../kritzel-tool-config)
- [kritzel-font](../../shared/kritzel-font)
- [kritzel-color](../../shared/kritzel-color)

### Graph
```mermaid
graph TD;
  kritzel-controls --> kritzel-utility-panel
  kritzel-controls --> kritzel-icon
  kritzel-controls --> kritzel-tooltip
  kritzel-controls --> kritzel-tool-config
  kritzel-controls --> kritzel-font
  kritzel-controls --> kritzel-color
  kritzel-utility-panel --> kritzel-icon
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
  kritzel-editor --> kritzel-controls
  style kritzel-controls fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
