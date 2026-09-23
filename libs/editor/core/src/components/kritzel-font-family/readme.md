# kritzel-font-family



<!-- Auto Generated Below -->


## Properties

| Property             | Attribute              | Description | Type           | Default     |
| -------------------- | ---------------------- | ----------- | -------------- | ----------- |
| `fontOptions`        | --                     |             | `FontOption[]` | `[]`        |
| `selectedFontFamily` | `selected-font-family` |             | `string`       | `undefined` |


## Events

| Event              | Description | Type                  |
| ------------------ | ----------- | --------------------- |
| `fontFamilyChange` |             | `CustomEvent<string>` |


## Dependencies

### Used by

 - [kritzel-tool-config](../kritzel-tool-config)

### Depends on

- [kritzel-dropdown](../kritzel-dropdown)

### Graph
```mermaid
graph TD;
  kritzel-font-family --> kritzel-dropdown
  kritzel-tool-config --> kritzel-font-family
  style kritzel-font-family fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
