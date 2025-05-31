# kritzel-font-family



<!-- Auto Generated Below -->


## Properties

| Property             | Attribute              | Description | Type           | Default                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------- | ---------------------- | ----------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fontOptions`        | `font-options`         |             | `FontOption[]` | `[     { value: 'arial', label: 'Arial' },     { value: 'verdana', label: 'Verdana' },     { value: 'helvetica', label: 'Helvetica' },     { value: 'tahoma', label: 'Tahoma' },     { value: 'trebuchet ms', label: 'Trebuchet MS' },     { value: 'times new roman', label: 'Times New Roman' },     { value: 'georgia', label: 'Georgia' },     { value: 'garamond', label: 'Garamond' },     { value: 'courier new', label: 'Courier New' },     { value: 'brush script mt', label: 'Brush Script MT' },   ]` |
| `selectedFontFamily` | `selected-font-family` |             | `string`       | `undefined`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |


## Events

| Event              | Description | Type                  |
| ------------------ | ----------- | --------------------- |
| `fontFamilyChange` |             | `CustomEvent<string>` |


## Dependencies

### Used by

 - [kritzel-control-text-config](../../ui/kritzel-control-text-config)

### Depends on

- [kritzel-dropdown](../kritzel-dropdown)

### Graph
```mermaid
graph TD;
  kritzel-font-family --> kritzel-dropdown
  kritzel-control-text-config --> kritzel-font-family
  style kritzel-font-family fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
