# kritzel-avatar



<!-- Auto Generated Below -->


## Properties

| Property | Attribute | Description                                                   | Type           | Default     |
| -------- | --------- | ------------------------------------------------------------- | -------------- | ----------- |
| `color`  | `color`   | Background color for initials fallback                        | `string`       | `undefined` |
| `name`   | `name`    | Direct prop: user's display name (used for initials fallback) | `string`       | `undefined` |
| `size`   | `size`    | Avatar diameter in pixels                                     | `number`       | `32`        |
| `user`   | --        | Full user object. If provided, individual props are ignored.  | `IKritzelUser` | `undefined` |


## Dependencies

### Used by

 - [kritzel-active-users](../kritzel-active-users)
 - [kritzel-current-user](../kritzel-current-user)
 - [kritzel-current-user-dialog](../kritzel-current-user-dialog)

### Graph
```mermaid
graph TD;
  kritzel-active-users --> kritzel-avatar
  kritzel-current-user --> kritzel-avatar
  kritzel-current-user-dialog --> kritzel-avatar
  style kritzel-avatar fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
