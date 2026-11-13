# updraw-menu-item



<!-- Auto Generated Below -->


## Properties

| Property | Attribute | Description | Type                    | Default     |
| -------- | --------- | ----------- | ----------------------- | ----------- |
| `item`   | --        |             | `IUpdrawMenuItem<any>` | `undefined` |
| `parent` | --        |             | `IUpdrawMenuItem<any>` | `null`      |


## Events

| Event                 | Description | Type                                                |
| --------------------- | ----------- | --------------------------------------------------- |
| `itemCancel`          |             | `CustomEvent<IUpdrawMenuItem<any>>`                |
| `itemCloseChildMenu`  |             | `CustomEvent<IUpdrawMenuItem<any>>`                |
| `itemSave`            |             | `CustomEvent<IUpdrawMenuItem<any>>`                |
| `itemSelect`          |             | `CustomEvent<IUpdrawMenuItemSelectEvent>`          |
| `itemToggleChildMenu` |             | `CustomEvent<IUpdrawMenuItemToggleChildMenuEvent>` |


## Dependencies

### Used by

 - [updraw-menu](../updraw-menu)

### Depends on

- updraw-icon
- [updraw-portal](../updraw-portal)

### Graph
```mermaid
graph TD;
  updraw-menu-item --> updraw-icon
  updraw-menu-item --> updraw-portal
  updraw-menu --> updraw-menu-item
  style updraw-menu-item fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
