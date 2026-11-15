# updraw-avatar



<!-- Auto Generated Below -->


## Properties

| Property | Attribute | Description                                                   | Type          | Default     |
| -------- | --------- | ------------------------------------------------------------- | ------------- | ----------- |
| `color`  | `color`   | Background color for initials fallback                        | `string`      | `undefined` |
| `name`   | `name`    | Direct prop: user's display name (used for initials fallback) | `string`      | `undefined` |
| `size`   | `size`    | Avatar diameter in pixels                                     | `number`      | `32`        |
| `user`   | --        | Full user object. If provided, individual props are ignored.  | `IUpdrawUser` | `undefined` |


## Dependencies

### Used by

 - [updraw-active-users](../updraw-active-users)
 - [updraw-current-user](../updraw-current-user)
 - [updraw-current-user-dialog](../updraw-current-user-dialog)

### Graph
```mermaid
graph TD;
  updraw-active-users --> updraw-avatar
  updraw-current-user --> updraw-avatar
  updraw-current-user-dialog --> updraw-avatar
  style updraw-avatar fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
