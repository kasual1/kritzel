# kritzel-font-size



<!-- Auto Generated Below -->


## Properties

| Property       | Attribute       | Description | Type       | Default                   |
| -------------- | --------------- | ----------- | ---------- | ------------------------- |
| `fontFamily`   | `font-family`   |             | `string`   | `'Arial'`                 |
| `selectedSize` | `selected-size` |             | `number`   | `null`                    |
| `sizes`        | `sizes`         |             | `number[]` | `[8, 10, 12, 16, 20, 24]` |


## Events

| Event        | Description | Type                  |
| ------------ | ----------- | --------------------- |
| `sizeChange` |             | `CustomEvent<number>` |


## Dependencies

### Used by

 - [kritzel-control-text-config](../../ui/kritzel-control-text-config)

### Depends on

- [kritzel-font](../kritzel-font)

### Graph
```mermaid
graph TD;
  kritzel-font-size --> kritzel-font
  kritzel-control-text-config --> kritzel-font-size
  style kritzel-font-size fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
