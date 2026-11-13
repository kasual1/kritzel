# kritzel-split-button



<!-- Auto Generated Below -->


## Properties

| Property             | Attribute              | Description | Type                      | Default         |
| -------------------- | ---------------------- | ----------- | ------------------------- | --------------- |
| `buttonIcon`         | `button-icon`          |             | `string`                  | `'plus'`        |
| `dropdownIcon`       | `dropdown-icon`        |             | `string`                  | `'chevronDown'` |
| `items`              | --                     |             | `IKritzelMenuItem<any>[]` | `[]`            |
| `mainButtonDisabled` | `main-button-disabled` |             | `boolean`                 | `false`         |
| `menuButtonDisabled` | `menu-button-disabled` |             | `boolean`                 | `false`         |


## Events

| Event                 | Description | Type                                                |
| --------------------- | ----------- | --------------------------------------------------- |
| `itemCancel`          |             | `CustomEvent<IKritzelMenuItem<any>>`                |
| `itemCloseChildMenu`  |             | `CustomEvent<IKritzelMenuItem<any>>`                |
| `itemSave`            |             | `CustomEvent<IKritzelMenuItem<any>>`                |
| `itemSelect`          |             | `CustomEvent<IKritzelMenuItemSelectEvent>`          |
| `itemToggleChildMenu` |             | `CustomEvent<IKritzelMenuItemToggleChildMenuEvent>` |
| `mainButtonClick`     |             | `CustomEvent<void>`                                 |
| `menuClose`           |             | `CustomEvent<void>`                                 |
| `menuOpen`            |             | `CustomEvent<void>`                                 |


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

 - [kritzel-workspace-manager](../kritzel-workspace-manager)

### Depends on

- kritzel-icon
- [kritzel-portal](../kritzel-portal)
- [kritzel-menu](../kritzel-menu)

### Graph
```mermaid
graph TD;
  kritzel-split-button --> kritzel-icon
  kritzel-split-button --> kritzel-portal
  kritzel-split-button --> kritzel-menu
  kritzel-menu --> kritzel-menu-item
  kritzel-menu-item --> kritzel-icon
  kritzel-menu-item --> kritzel-portal
  kritzel-workspace-manager --> kritzel-split-button
  style kritzel-split-button fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
