# kritzel-stroke-size



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

 - [kritzel-tool-config](../kritzel-tool-config)

### Depends on

- [kritzel-color](../kritzel-color)

### Graph
```mermaid
graph TD;
  kritzel-stroke-size --> kritzel-color
  kritzel-tool-config --> kritzel-stroke-size
  style kritzel-stroke-size fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
