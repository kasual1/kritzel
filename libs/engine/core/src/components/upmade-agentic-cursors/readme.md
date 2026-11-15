# updraw-agentic-cursors



<!-- Auto Generated Below -->


## Overview

Renders the cursors of the local agents (`UpdrawAgenticCursorManager`) and of collaborators' agents
(`UpdrawRemoteAgentManager`), the outlines of the objects each agent has selected and, like a person's
selection of one object, its rotation handle. Everything is keyed by the cursor key, so the same agent ID
in two tabs never collides.

Structural changes (added/removed cursors, name, color, status, selections) re-render through
Stencil. Per-frame movement of on-screen cursors, outlines and handles is written directly to the
elements, in Stencil's write phase: the engine renders objects there too, so an outline is drawn in
the same frame as the object state it follows and never runs ahead of the object.

## Properties

| Property               | Attribute                | Description | Type         | Default     |
| ---------------------- | ------------------------ | ----------- | ------------ | ----------- |
| `core` _(required)_    | --                       |             | `UpdrawCore` | `undefined` |
| `edgeIndicatorPadding` | `edge-indicator-padding` |             | `number`     | `8`         |
| `showEdgeIndicators`   | `show-edge-indicators`   |             | `boolean`    | `true`      |


## Dependencies

### Used by

 - [updraw-engine](../updraw-engine)

### Graph
```mermaid
graph TD;
  updraw-engine --> updraw-agentic-cursors
  style updraw-agentic-cursors fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
