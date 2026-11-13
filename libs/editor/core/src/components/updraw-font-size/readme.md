# updraw-font-size



<!-- Auto Generated Below -->


## Properties

| Property       | Attribute       | Description | Type       | Default                   |
| -------------- | --------------- | ----------- | ---------- | ------------------------- |
| `fontFamily`   | `font-family`   |             | `string`   | `'Arial'`                 |
| `selectedSize` | `selected-size` |             | `number`   | `null`                    |
| `sizes`        | --              |             | `number[]` | `[8, 10, 12, 16, 20, 24]` |


## Events

| Event        | Description | Type                  |
| ------------ | ----------- | --------------------- |
| `sizeChange` |             | `CustomEvent<number>` |


## Dependencies

### Used by

 - [updraw-tool-config](../updraw-tool-config)

### Depends on

- [updraw-font](../updraw-font)

### Graph
```mermaid
graph TD;
  updraw-font-size --> updraw-font
  updraw-tool-config --> updraw-font-size
  style updraw-font-size fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
