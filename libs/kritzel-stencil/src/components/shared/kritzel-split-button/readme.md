# kritzel-split-button



<!-- Auto Generated Below -->


## Properties

| Property          | Attribute           | Description | Type                     | Default          |
| ----------------- | ------------------- | ----------- | ------------------------ | ---------------- |
| `activeItemIndex` | `active-item-index` |             | `number`                 | `null`           |
| `buttonIcon`      | `button-icon`       |             | `string`                 | `undefined`      |
| `buttonText`      | `button-text`       |             | `string`                 | `undefined`      |
| `disabled`        | `disabled`          |             | `boolean`                | `false`          |
| `dropdownIcon`    | `dropdown-icon`     |             | `string`                 | `'chevron-down'` |
| `editingIndex`    | `editing-index`     |             | `number`                 | `null`           |
| `options`         | `options`           |             | `KritzelMenuItem<any>[]` | `[]`             |


## Events

| Event          | Description | Type                                |
| -------------- | ----------- | ----------------------------------- |
| `buttonClick`  |             | `CustomEvent<void>`                 |
| `menuClosed`   |             | `CustomEvent<void>`                 |
| `menuOpened`   |             | `CustomEvent<void>`                 |
| `optionSelect` |             | `CustomEvent<KritzelMenuItem<any>>` |


## Methods

### `closeMenu() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `openMenu() => Promise<void>`



#### Returns

Type: `Promise<void>`




## Dependencies

### Used by

 - [kritzel-workspace-manager](../../ui/kritzel-workspace-manager)

### Depends on

- [kritzel-icon](../kritzel-icon)
- [kritzel-portal](../kritzel-portal)
- [kritzel-menu](../kritzel-menu)

### Graph
```mermaid
graph TD;
  kritzel-split-button --> kritzel-icon
  kritzel-split-button --> kritzel-portal
  kritzel-split-button --> kritzel-menu
  kritzel-menu --> kritzel-icon
  kritzel-menu --> kritzel-portal
  kritzel-menu --> kritzel-menu
  kritzel-workspace-manager --> kritzel-split-button
  style kritzel-split-button fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
