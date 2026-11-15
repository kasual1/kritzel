# upmade-brush-style



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

- [upmade-dropdown](../upmade-dropdown)
- upmade-icon

### Graph
```mermaid
graph TD;
  upmade-brush-style --> upmade-dropdown
  upmade-brush-style --> upmade-icon
  style upmade-brush-style fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
