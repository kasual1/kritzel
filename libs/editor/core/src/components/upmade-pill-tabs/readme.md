# upmade-pill-tabs



<!-- Auto Generated Below -->


## Properties

| Property | Attribute | Description                        | Type              | Default     |
| -------- | --------- | ---------------------------------- | ----------------- | ----------- |
| `tabs`   | --        | Array of tab definitions to render | `UpmadePillTab[]` | `[]`        |
| `value`  | `value`   | Currently selected tab ID          | `string`          | `undefined` |


## Events

| Event         | Description                           | Type                  |
| ------------- | ------------------------------------- | --------------------- |
| `valueChange` | Emitted when the selected tab changes | `CustomEvent<string>` |


## Dependencies

### Used by

 - [upmade-export](../upmade-export)

### Depends on

- upmade-icon

### Graph
```mermaid
graph TD;
  upmade-pill-tabs --> upmade-icon
  upmade-export --> upmade-pill-tabs
  style upmade-pill-tabs fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
