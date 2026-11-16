# upmade-context-menu



<!-- Auto Generated Below -->


## Properties

| Property  | Attribute | Description | Type                                            | Default     |
| --------- | --------- | ----------- | ----------------------------------------------- | ----------- |
| `items`   | --        |             | `ContextMenuItem[]`                             | `undefined` |
| `objects` | --        |             | `UpmadeBaseObject<HTMLElement \| SVGElement>[]` | `undefined` |


## Events

| Event            | Description | Type                           |
| ---------------- | ----------- | ------------------------------ |
| `actionSelected` |             | `CustomEvent<ContextMenuItem>` |
| `close`          |             | `CustomEvent<void>`            |


## Dependencies

### Used by

 - [upmade-editor](../upmade-editor)

### Depends on

- upmade-icon

### Graph
```mermaid
graph TD;
  upmade-context-menu --> upmade-icon
  upmade-editor --> upmade-context-menu
  style upmade-context-menu fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
