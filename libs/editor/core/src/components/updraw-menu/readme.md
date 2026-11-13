# updraw-menu



<!-- Auto Generated Below -->


## Properties

| Property | Attribute | Description | Type                      | Default     |
| -------- | --------- | ----------- | ------------------------- | ----------- |
| `items`  | --        |             | `IUpdrawMenuItem<any>[]` | `undefined` |
| `parent` | --        |             | `IUpdrawMenuItem<any>`   | `null`      |


## Events

| Event                 | Description | Type                                                |
| --------------------- | ----------- | --------------------------------------------------- |
| `close`               |             | `CustomEvent<void>`                                 |
| `itemCancel`          |             | `CustomEvent<IUpdrawMenuItem<any>>`                |
| `itemCloseChildMenu`  |             | `CustomEvent<IUpdrawMenuItem<any>>`                |
| `itemSave`            |             | `CustomEvent<IUpdrawMenuItem<any>>`                |
| `itemSelect`          |             | `CustomEvent<IUpdrawMenuItemSelectEvent>`          |
| `itemToggleChildMenu` |             | `CustomEvent<IUpdrawMenuItemToggleChildMenuEvent>` |


## Methods

### `setFocus() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `setScrollTop(scrollTop: number) => Promise<void>`



#### Parameters

| Name        | Type     | Description |
| ----------- | -------- | ----------- |
| `scrollTop` | `number` |             |

#### Returns

Type: `Promise<void>`




## Dependencies

### Used by

 - [updraw-more-menu](../updraw-more-menu)
 - [updraw-split-button](../updraw-split-button)
 - [updraw-titlebar-menu](../updraw-titlebar-menu)

### Depends on

- [updraw-menu-item](../updraw-menu-item)

### Graph
```mermaid
graph TD;
  updraw-menu --> updraw-menu-item
  updraw-menu-item --> updraw-icon
  updraw-menu-item --> updraw-portal
  updraw-more-menu --> updraw-menu
  updraw-split-button --> updraw-menu
  updraw-titlebar-menu --> updraw-menu
  style updraw-menu fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
