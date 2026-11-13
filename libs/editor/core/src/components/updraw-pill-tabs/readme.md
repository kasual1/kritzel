# updraw-pill-tabs



<!-- Auto Generated Below -->


## Properties

| Property | Attribute | Description                        | Type               | Default     |
| -------- | --------- | ---------------------------------- | ------------------ | ----------- |
| `tabs`   | --        | Array of tab definitions to render | `UpdrawPillTab[]` | `[]`        |
| `value`  | `value`   | Currently selected tab ID          | `string`           | `undefined` |


## Events

| Event         | Description                           | Type                  |
| ------------- | ------------------------------------- | --------------------- |
| `valueChange` | Emitted when the selected tab changes | `CustomEvent<string>` |


## Dependencies

### Used by

 - [updraw-export](../updraw-export)

### Depends on

- updraw-icon

### Graph
```mermaid
graph TD;
  updraw-pill-tabs --> updraw-icon
  updraw-export --> updraw-pill-tabs
  style updraw-pill-tabs fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
