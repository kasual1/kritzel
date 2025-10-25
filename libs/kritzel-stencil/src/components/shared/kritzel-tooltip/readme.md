# kritzel-tooltip



<!-- Auto Generated Below -->


## Properties

| Property        | Attribute    | Description | Type          | Default     |
| --------------- | ------------ | ----------- | ------------- | ----------- |
| `anchorElement` | --           |             | `HTMLElement` | `undefined` |
| `arrowSize`     | `arrow-size` |             | `number`      | `8`         |
| `isVisible`     | `is-visible` |             | `boolean`     | `false`     |
| `offsetY`       | `offset-y`   |             | `number`      | `24`        |


## Events

| Event           | Description | Type                |
| --------------- | ----------- | ------------------- |
| `tooltipClosed` |             | `CustomEvent<void>` |


## Methods

### `focusContent() => Promise<void>`



#### Returns

Type: `Promise<void>`




## Dependencies

### Used by

 - [kritzel-controls](../../ui/kritzel-controls)

### Graph
```mermaid
graph TD;
  kritzel-controls --> kritzel-tooltip
  style kritzel-tooltip fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
