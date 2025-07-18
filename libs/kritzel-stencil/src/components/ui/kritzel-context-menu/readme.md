# kritzel-context-menu



<!-- Auto Generated Below -->


## Properties

| Property  | Attribute | Description | Type                                             | Default     |
| --------- | --------- | ----------- | ------------------------------------------------ | ----------- |
| `items`   | `items`   |             | `ContextMenuItem[]`                              | `undefined` |
| `objects` | `objects` |             | `KritzelBaseObject<HTMLElement \| SVGElement>[]` | `undefined` |


## Events

| Event            | Description | Type                           |
| ---------------- | ----------- | ------------------------------ |
| `actionSelected` |             | `CustomEvent<ContextMenuItem>` |


## Dependencies

### Used by

 - [kritzel-engine](../../core/kritzel-engine)

### Depends on

- [kritzel-icon](../../shared/kritzel-icon)

### Graph
```mermaid
graph TD;
  kritzel-context-menu --> kritzel-icon
  kritzel-engine --> kritzel-context-menu
  style kritzel-context-menu fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
