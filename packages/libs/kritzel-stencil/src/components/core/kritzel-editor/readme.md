# kritzel-editor



<!-- Auto Generated Below -->


## Properties

| Property         | Attribute          | Description | Type                       | Default                    |
| ---------------- | ------------------ | ----------- | -------------------------- | -------------------------- |
| `controls`       | `controls`         |             | `KritzelToolbarControl[]`  | `DEFAULT_KRITZEL_CONTROLS` |
| `customSvgIcons` | `custom-svg-icons` |             | `{ [x: string]: string; }` | `{}`                       |
| `hideControls`   | `hide-controls`    |             | `boolean`                  | `false`                    |


## Dependencies

### Depends on

- [kritzel-controls](../../ui/kritzel-controls)
- [kritzel-engine](../kritzel-engine)
- [kritzel-dummy](../../ui/kritzel-dummy)

### Graph
```mermaid
graph TD;
  kritzel-editor --> kritzel-controls
  kritzel-editor --> kritzel-engine
  kritzel-editor --> kritzel-dummy
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
  kritzel-engine --> kritzel-context-menu
  kritzel-engine --> kritzel-cursor-trail
  kritzel-context-menu --> kritzel-icon
  style kritzel-editor fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
