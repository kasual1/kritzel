# updraw-context-menu



<!-- Auto Generated Below -->


## Properties

| Property  | Attribute | Description | Type                                             | Default     |
| --------- | --------- | ----------- | ------------------------------------------------ | ----------- |
| `items`   | --        |             | `ContextMenuItem[]`                              | `undefined` |
| `objects` | --        |             | `UpdrawBaseObject<HTMLElement \| SVGElement>[]` | `undefined` |


## Events

| Event            | Description | Type                           |
| ---------------- | ----------- | ------------------------------ |
| `actionSelected` |             | `CustomEvent<ContextMenuItem>` |
| `close`          |             | `CustomEvent<void>`            |


## Dependencies

### Used by

 - [updraw-editor](../updraw-editor)

### Depends on

- updraw-icon

### Graph
```mermaid
graph TD;
  updraw-context-menu --> updraw-icon
  updraw-editor --> updraw-context-menu
  style updraw-context-menu fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
