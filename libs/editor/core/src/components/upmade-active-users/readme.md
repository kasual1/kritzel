# upmade-active-users



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute     | Description                                                                                                                                                  | Type                                                   | Default |
| ------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ | ------- |
| `agents`     | --            | Agents to display after the users: local agents and agents of collaborators. Shown with a bot badge, a ring while they work and their status in the tooltip. | `(UpmadeAgentPresence \| UpmadeRemoteAgentPresence)[]` | `[]`    |
| `avatarSize` | `avatar-size` | Avatar size in pixels                                                                                                                                        | `number`                                               | `40`    |
| `maxVisible` | `max-visible` | Maximum number of avatars to show before overflow text                                                                                                       | `number`                                               | `3`     |
| `overlap`    | `overlap`     | Overlap offset in pixels (negative margin between avatars)                                                                                                   | `number`                                               | `20`    |
| `users`      | --            | Array of active users to display                                                                                                                             | `IUpmadeUser[]`                                        | `[]`    |


## Dependencies

### Used by

 - [upmade-editor](../upmade-editor)

### Depends on

- [upmade-avatar](../upmade-avatar)

### Graph
```mermaid
graph TD;
  upmade-active-users --> upmade-avatar
  upmade-editor --> upmade-active-users
  style upmade-active-users fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
