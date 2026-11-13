# updraw-font-family



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

 - [updraw-tool-config](../updraw-tool-config)

### Depends on

- [updraw-dropdown](../updraw-dropdown)

### Graph
```mermaid
graph TD;
  updraw-font-family --> updraw-dropdown
  updraw-tool-config --> updraw-font-family
  style updraw-font-family fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
