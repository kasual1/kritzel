# upmade-color-palette



<!-- Auto Generated Below -->


## Properties

| Property        | Attribute     | Description | Type                               | Default     |
| --------------- | ------------- | ----------- | ---------------------------------- | ----------- |
| `colors`        | --            |             | `ThemeAwareColor[]`                | `[]`        |
| `isExpanded`    | `is-expanded` |             | `boolean`                          | `false`     |
| `isOpaque`      | `is-opaque`   |             | `boolean`                          | `false`     |
| `opacity`       | `opacity`     |             | `number`                           | `1`         |
| `selectedColor` | --            |             | `ThemeAwareColor`                  | `null`      |
| `theme`         | `theme`       |             | `"dark" \| "light" \| string & {}` | `undefined` |


## Events

| Event         | Description | Type                           |
| ------------- | ----------- | ------------------------------ |
| `colorChange` |             | `CustomEvent<ThemeAwareColor>` |


## Dependencies

### Used by

 - [upmade-tool-config](../upmade-tool-config)

### Depends on

- [upmade-color](../upmade-color)

### Graph
```mermaid
graph TD;
  upmade-color-palette --> upmade-color
  upmade-tool-config --> upmade-color-palette
  style upmade-color-palette fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
