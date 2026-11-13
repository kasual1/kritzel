# kritzel-brush-style



<!-- Auto Generated Below -->


## Properties

| Property       | Attribute | Description | Type                     | Default                                                                                         |
| -------------- | --------- | ----------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| `brushOptions` | --        |             | `BrushStyleOption[]`     | `[     { value: 'pen', label: 'Pen' },     { value: 'highlighter', label: 'Highlighter' },   ]` |
| `type`         | `type`    |             | `"highlighter" \| "pen"` | `'pen'`                                                                                         |


## Events

| Event        | Description | Type                                  |
| ------------ | ----------- | ------------------------------------- |
| `typeChange` |             | `CustomEvent<"highlighter" \| "pen">` |


## Dependencies

### Depends on

- [kritzel-dropdown](../kritzel-dropdown)
- kritzel-icon

### Graph
```mermaid
graph TD;
  kritzel-brush-style --> kritzel-dropdown
  kritzel-brush-style --> kritzel-icon
  style kritzel-brush-style fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
