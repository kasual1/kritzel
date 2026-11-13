# updraw-stroke-size



<!-- Auto Generated Below -->


## Properties

| Property       | Attribute       | Description | Type       | Default                 |
| -------------- | --------------- | ----------- | ---------- | ----------------------- |
| `selectedSize` | `selected-size` |             | `number`   | `null`                  |
| `sizes`        | --              |             | `number[]` | `[4, 6, 8, 12, 16, 24]` |


## Events

| Event        | Description | Type                  |
| ------------ | ----------- | --------------------- |
| `sizeChange` |             | `CustomEvent<number>` |


## Dependencies

### Used by

 - [updraw-tool-config](../updraw-tool-config)

### Depends on

- [updraw-color](../updraw-color)

### Graph
```mermaid
graph TD;
  updraw-stroke-size --> updraw-color
  updraw-tool-config --> updraw-stroke-size
  style updraw-stroke-size fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
