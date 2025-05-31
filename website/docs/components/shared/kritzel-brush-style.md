# kritzel-brush-style



<!-- Auto Generated Below -->


## Properties

| Property       | Attribute       | Description | Type                     | Default                                                                                         |
| -------------- | --------------- | ----------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| `brushOptions` | `brush-options` |             | `BrushStyleOption[]`     | `[     { value: 'pen', label: 'Pen' },     { value: 'highlighter', label: 'Highlighter' },   ]` |
| `type`         | `type`          |             | `"highlighter" \| "pen"` | `'pen'`                                                                                         |


## Events

| Event        | Description | Type                                  |
| ------------ | ----------- | ------------------------------------- |
| `typeChange` |             | `CustomEvent<"highlighter" \| "pen">` |


## Dependencies

### Used by

 - [kritzel-control-brush-config](../../ui/kritzel-control-brush-config)

### Depends on

- [kritzel-dropdown](../kritzel-dropdown)
- [kritzel-icon](../kritzel-icon)

### Graph
```mermaid
graph TD;
  kritzel-brush-style --> kritzel-dropdown
  kritzel-brush-style --> kritzel-icon
  kritzel-control-brush-config --> kritzel-brush-style
  style kritzel-brush-style fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
