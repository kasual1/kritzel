# upmade-avatar



<!-- Auto Generated Below -->


## Properties

| Property | Attribute | Description                                                   | Type          | Default     |
| -------- | --------- | ------------------------------------------------------------- | ------------- | ----------- |
| `color`  | `color`   | Background color for initials fallback                        | `string`      | `undefined` |
| `name`   | `name`    | Direct prop: user's display name (used for initials fallback) | `string`      | `undefined` |
| `size`   | `size`    | Avatar diameter in pixels                                     | `number`      | `32`        |
| `user`   | --        | Full user object. If provided, individual props are ignored.  | `IUpmadeUser` | `undefined` |


## Dependencies

### Used by

 - [upmade-active-users](../upmade-active-users)
 - [upmade-current-user](../upmade-current-user)
 - [upmade-current-user-dialog](../upmade-current-user-dialog)

### Graph
```mermaid
graph TD;
  upmade-active-users --> upmade-avatar
  upmade-current-user --> upmade-avatar
  upmade-current-user-dialog --> upmade-avatar
  style upmade-avatar fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
