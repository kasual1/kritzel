# updraw-brush-style



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

- [updraw-dropdown](../updraw-dropdown)
- updraw-icon

### Graph
```mermaid
graph TD;
  updraw-brush-style --> updraw-dropdown
  updraw-brush-style --> updraw-icon
  style updraw-brush-style fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
