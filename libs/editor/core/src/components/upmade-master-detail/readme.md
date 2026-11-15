# upmade-master-detail



<!-- Auto Generated Below -->


## Properties

| Property         | Attribute          | Description                                               | Type                        | Default     |
| ---------------- | ------------------ | --------------------------------------------------------- | --------------------------- | ----------- |
| `items`          | --                 | Array of menu items to display in the master (left) panel | `IUpmadeMasterDetailItem[]` | `[]`        |
| `selectedItemId` | `selected-item-id` | ID of the currently selected item                         | `string`                    | `undefined` |


## Events

| Event        | Description                      | Type                                          |
| ------------ | -------------------------------- | --------------------------------------------- |
| `itemSelect` | Emitted when an item is selected | `CustomEvent<IUpmadeMasterDetailSelectEvent>` |


## Slots

| Slot | Description      |
| ---- | ---------------- |
|      | The default slot |


## Dependencies

### Used by

 - [upmade-settings](../upmade-settings)

### Depends on

- upmade-icon

### Graph
```mermaid
graph TD;
  upmade-master-detail --> upmade-icon
  upmade-settings --> upmade-master-detail
  style upmade-master-detail fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
