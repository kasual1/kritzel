# updraw-split-button



<!-- Auto Generated Below -->


## Properties

| Property             | Attribute              | Description | Type                     | Default         |
| -------------------- | ---------------------- | ----------- | ------------------------ | --------------- |
| `buttonIcon`         | `button-icon`          |             | `string`                 | `'plus'`        |
| `dropdownIcon`       | `dropdown-icon`        |             | `string`                 | `'chevronDown'` |
| `items`              | --                     |             | `IUpdrawMenuItem<any>[]` | `[]`            |
| `mainButtonDisabled` | `main-button-disabled` |             | `boolean`                | `false`         |
| `menuButtonDisabled` | `menu-button-disabled` |             | `boolean`                | `false`         |


## Events

| Event                 | Description | Type                                               |
| --------------------- | ----------- | -------------------------------------------------- |
| `itemCancel`          |             | `CustomEvent<IUpdrawMenuItem<any>>`                |
| `itemCloseChildMenu`  |             | `CustomEvent<IUpdrawMenuItem<any>>`                |
| `itemSave`            |             | `CustomEvent<IUpdrawMenuItem<any>>`                |
| `itemSelect`          |             | `CustomEvent<IUpdrawMenuItemSelectEvent>`          |
| `itemToggleChildMenu` |             | `CustomEvent<IUpdrawMenuItemToggleChildMenuEvent>` |
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

 - [updraw-workspace-manager](../updraw-workspace-manager)

### Depends on

- updraw-icon
- [updraw-portal](../updraw-portal)
- [updraw-menu](../updraw-menu)

### Graph
```mermaid
graph TD;
  updraw-split-button --> updraw-icon
  updraw-split-button --> updraw-portal
  updraw-split-button --> updraw-menu
  updraw-menu --> updraw-menu-item
  updraw-menu-item --> updraw-icon
  updraw-menu-item --> updraw-portal
  updraw-workspace-manager --> updraw-split-button
  style updraw-split-button fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
