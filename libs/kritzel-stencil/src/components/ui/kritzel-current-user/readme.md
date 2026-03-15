# kritzel-current-user



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute     | Description                         | Type           | Default     |
| ------------ | ------------- | ----------------------------------- | -------------- | ----------- |
| `avatarSize` | `avatar-size` | Avatar size in pixels               | `number`       | `40`        |
| `offsetY`    | `offset-y`    | Offset Y for the portal positioning | `number`       | `4`         |
| `user`       | --            | The current user to display         | `IKritzelUser` | `undefined` |


## Events

| Event        | Description                          | Type                                                                           |
| ------------ | ------------------------------------ | ------------------------------------------------------------------------------ |
| `itemSelect` | Emitted when a menu item is selected | `CustomEvent<{ item: IKritzelMenuItem<any>; parent: IKritzelMenuItem<any>; }>` |


## Dependencies

### Used by

 - [kritzel-editor](../../core/kritzel-editor)

### Depends on

- [kritzel-avatar](../../shared/kritzel-avatar)
- [kritzel-portal](../../shared/kritzel-portal)
- [kritzel-menu](../../shared/kritzel-menu)

### Graph
```mermaid
graph TD;
  kritzel-current-user --> kritzel-avatar
  kritzel-current-user --> kritzel-portal
  kritzel-current-user --> kritzel-menu
  kritzel-menu --> kritzel-menu-item
  kritzel-menu-item --> kritzel-icon
  kritzel-menu-item --> kritzel-portal
  kritzel-menu-item --> kritzel-menu
  kritzel-editor --> kritzel-current-user
  style kritzel-current-user fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
