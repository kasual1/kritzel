# upmade-menu



<!-- Auto Generated Below -->


## Properties

| Property | Attribute | Description | Type                     | Default     |
| -------- | --------- | ----------- | ------------------------ | ----------- |
| `items`  | --        |             | `IUpmadeMenuItem<any>[]` | `undefined` |
| `parent` | --        |             | `IUpmadeMenuItem<any>`   | `null`      |


## Events

| Event                 | Description | Type                                               |
| --------------------- | ----------- | -------------------------------------------------- |
| `close`               |             | `CustomEvent<void>`                                |
| `itemCancel`          |             | `CustomEvent<IUpmadeMenuItem<any>>`                |
| `itemCloseChildMenu`  |             | `CustomEvent<IUpmadeMenuItem<any>>`                |
| `itemSave`            |             | `CustomEvent<IUpmadeMenuItem<any>>`                |
| `itemSelect`          |             | `CustomEvent<IUpmadeMenuItemSelectEvent>`          |
| `itemToggleChildMenu` |             | `CustomEvent<IUpmadeMenuItemToggleChildMenuEvent>` |


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

 - [upmade-more-menu](../upmade-more-menu)
 - [upmade-split-button](../upmade-split-button)
 - [upmade-titlebar-menu](../upmade-titlebar-menu)

### Depends on

- [upmade-menu-item](../upmade-menu-item)

### Graph
```mermaid
graph TD;
  upmade-menu --> upmade-menu-item
  upmade-menu-item --> upmade-icon
  upmade-menu-item --> upmade-portal
  upmade-more-menu --> upmade-menu
  upmade-split-button --> upmade-menu
  upmade-titlebar-menu --> upmade-menu
  style upmade-menu fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
