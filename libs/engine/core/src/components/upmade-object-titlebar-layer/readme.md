# upmade-object-titlebar-layer



<!-- Auto Generated Below -->


## Overview

Renders object titlebars inside the engine's world-space origin. Each anchor is placed on
its owner's top edge and counter-scaled, so titlebar content keeps a constant screen size.

Rendered without a shadow root on purpose: the bars must stay in the engine's shadow tree so
`upmade-engine::part(...)` styling and the engine's `elementsFromPoint` hit-testing reach them.
Must never use the `object` class: pointer handling treats `.object` elements as objects.

## Properties

| Property               | Attribute                | Description                                                                                                           | Type                                                                                                                   | Default     |
| ---------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------- |
| `appearingOwners`      | --                       | The objects playing their appear animation, with their stagger index, by object ID. Their titlebars appear with them. | `Map<string, number>`                                                                                                  | `undefined` |
| `elementClick`         | --                       | Called when a titlebar button or menu button is clicked.                                                              | `(ownerId: string, section: UpmadeTitlebarSection, elementId: string, event: MouseEvent, anchor: HTMLElement) => void` | `undefined` |
| `surfacePointerEvents` | `surface-pointer-events` | Pointer events of the drag surfaces. Controls always receive pointer input.                                           | `"auto" \| "none"`                                                                                                     | `'none'`    |
| `titleEdit`            | --                       | Called while a title is edited to rename its object.                                                                  | `UpmadeTitlebarTitleEditHandlers`                                                                                      | `undefined` |
| `titlebars`            | --                       | The titlebars to render, resolved by the engine for the current frame.                                                | `UpmadeResolvedTitlebar[]`                                                                                             | `[]`        |


## Dependencies

### Used by

 - [upmade-engine](../upmade-engine)

### Depends on

- [upmade-icon](../upmade-icon)

### Graph
```mermaid
graph TD;
  upmade-object-titlebar-layer --> upmade-icon
  upmade-engine --> upmade-object-titlebar-layer
  style upmade-object-titlebar-layer fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
