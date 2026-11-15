# upmade-split-button



<!-- Auto Generated Below -->


## Properties

| Property             | Attribute              | Description | Type                     | Default         |
| -------------------- | ---------------------- | ----------- | ------------------------ | --------------- |
| `buttonIcon`         | `button-icon`          |             | `string`                 | `'plus'`        |
| `dropdownIcon`       | `dropdown-icon`        |             | `string`                 | `'chevronDown'` |
| `items`              | --                     |             | `IUpmadeMenuItem<any>[]` | `[]`            |
| `mainButtonDisabled` | `main-button-disabled` |             | `boolean`                | `false`         |
| `menuButtonDisabled` | `menu-button-disabled` |             | `boolean`                | `false`         |


## Events

| Event                 | Description | Type                                               |
| --------------------- | ----------- | -------------------------------------------------- |
| `itemCancel`          |             | `CustomEvent<IUpmadeMenuItem<any>>`                |
| `itemCloseChildMenu`  |             | `CustomEvent<IUpmadeMenuItem<any>>`                |
| `itemSave`            |             | `CustomEvent<IUpmadeMenuItem<any>>`                |
| `itemSelect`          |             | `CustomEvent<IUpmadeMenuItemSelectEvent>`          |
| `itemToggleChildMenu` |             | `CustomEvent<IUpmadeMenuItemToggleChildMenuEvent>` |
| `mainButtonClick`     |             | `CustomEvent<void>`                                |
| `menuClose`           |             | `CustomEvent<void>`                                |
| `menuOpen`            |             | `CustomEvent<void>`                                |


## Methods

### `close() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `focusMenu() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `open() => Promise<void>`



#### Returns

Type: `Promise<void>`




## Dependencies

### Used by

 - [upmade-workspace-manager](../upmade-workspace-manager)

### Depends on

- upmade-icon
- [upmade-portal](../upmade-portal)
- [upmade-menu](../upmade-menu)

### Graph
```mermaid
graph TD;
  upmade-split-button --> upmade-icon
  upmade-split-button --> upmade-portal
  upmade-split-button --> upmade-menu
  upmade-menu --> upmade-menu-item
  upmade-menu-item --> upmade-icon
  upmade-menu-item --> upmade-portal
  upmade-workspace-manager --> upmade-split-button
  style upmade-split-button fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
