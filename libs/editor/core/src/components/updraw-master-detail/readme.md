# updraw-master-detail



<!-- Auto Generated Below -->


## Properties

| Property         | Attribute          | Description                                               | Type                         | Default     |
| ---------------- | ------------------ | --------------------------------------------------------- | ---------------------------- | ----------- |
| `items`          | --                 | Array of menu items to display in the master (left) panel | `IUpdrawMasterDetailItem[]` | `[]`        |
| `selectedItemId` | `selected-item-id` | ID of the currently selected item                         | `string`                     | `undefined` |


## Events

| Event        | Description                      | Type                                           |
| ------------ | -------------------------------- | ---------------------------------------------- |
| `itemSelect` | Emitted when an item is selected | `CustomEvent<IUpdrawMasterDetailSelectEvent>` |


## Slots

| Slot | Description      |
| ---- | ---------------- |
|      | The default slot |


## Dependencies

### Used by

 - [updraw-settings](../updraw-settings)

### Depends on

- updraw-icon

### Graph
```mermaid
graph TD;
  updraw-master-detail --> updraw-icon
  updraw-settings --> updraw-master-detail
  style updraw-master-detail fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
