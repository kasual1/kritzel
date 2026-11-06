# kritzel-agentic-cursors



<!-- Auto Generated Below -->


## Overview

Renders agentic cursors managed by `KritzelAgenticCursorManager`, and the outlines of
the objects each cursor has selected. Both are local only.

Structural changes (added/removed cursors, name, color, status, selections) re-render through
Stencil. Per-frame movement of on-screen cursors and outlines is written directly to
the elements, so animations and object tracking don't lag a frame behind.

## Properties

| Property               | Attribute                | Description | Type          | Default     |
| ---------------------- | ------------------------ | ----------- | ------------- | ----------- |
| `core` _(required)_    | --                       |             | `KritzelCore` | `undefined` |
| `edgeIndicatorPadding` | `edge-indicator-padding` |             | `number`      | `8`         |
| `showEdgeIndicators`   | `show-edge-indicators`   |             | `boolean`     | `true`      |


## Dependencies

### Used by

 - [kritzel-engine](../kritzel-engine)

### Graph
```mermaid
graph TD;
  kritzel-engine --> kritzel-agentic-cursors
  style kritzel-agentic-cursors fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
