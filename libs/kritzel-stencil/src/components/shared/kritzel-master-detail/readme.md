# kritzel-master-detail



<!-- Auto Generated Below -->


## Properties

| Property         | Attribute          | Description                                               | Type                         | Default     |
| ---------------- | ------------------ | --------------------------------------------------------- | ---------------------------- | ----------- |
| `items`          | --                 | Array of menu items to display in the master (left) panel | `IKritzelMasterDetailItem[]` | `[]`        |
| `selectedItemId` | `selected-item-id` | ID of the currently selected item                         | `string`                     | `undefined` |


## Events

| Event        | Description                      | Type                                           |
| ------------ | -------------------------------- | ---------------------------------------------- |
| `itemSelect` | Emitted when an item is selected | `CustomEvent<IKritzelMasterDetailSelectEvent>` |


## Dependencies

### Used by

 - [kritzel-settings](../../ui/kritzel-settings)

### Depends on

- [kritzel-icon](../kritzel-icon)

### Graph
```mermaid
graph TD;
  kritzel-master-detail --> kritzel-icon
  kritzel-settings --> kritzel-master-detail
  style kritzel-master-detail fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
