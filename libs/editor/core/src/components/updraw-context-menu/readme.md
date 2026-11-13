# kritzel-context-menu



<!-- Auto Generated Below -->


## Properties

| Property  | Attribute | Description | Type                                             | Default     |
| --------- | --------- | ----------- | ------------------------------------------------ | ----------- |
| `items`   | --        |             | `ContextMenuItem[]`                              | `undefined` |
| `objects` | --        |             | `KritzelBaseObject<HTMLElement \| SVGElement>[]` | `undefined` |


## Events

| Event            | Description | Type                           |
| ---------------- | ----------- | ------------------------------ |
| `actionSelected` |             | `CustomEvent<ContextMenuItem>` |
| `close`          |             | `CustomEvent<void>`            |


## Dependencies

### Used by

 - [kritzel-editor](../kritzel-editor)

### Depends on

- kritzel-icon

### Graph
```mermaid
graph TD;
  kritzel-context-menu --> kritzel-icon
  kritzel-editor --> kritzel-context-menu
  style kritzel-context-menu fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
