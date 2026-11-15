# upmade-stroke-size



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

 - [upmade-tool-config](../upmade-tool-config)

### Depends on

- [upmade-color](../upmade-color)

### Graph
```mermaid
graph TD;
  upmade-stroke-size --> upmade-color
  upmade-tool-config --> upmade-stroke-size
  style upmade-stroke-size fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
