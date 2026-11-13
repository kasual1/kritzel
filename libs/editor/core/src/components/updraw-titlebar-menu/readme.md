# kritzel-titlebar-menu



<!-- Auto Generated Below -->


## Overview

The menu opened from a titlebar `menu` element: a compact `kritzel-menu` styled like the
context menu through the `--kritzel-titlebar-menu-*` theme variables.

## Properties

| Property | Attribute | Description                                                      | Type                        | Default |
| -------- | --------- | ---------------------------------------------------------------- | --------------------------- | ------- |
| `items`  | --        | Menu items of the open titlebar menu, as resolved by the engine. | `KritzelTitlebarMenuItem[]` | `[]`    |


## Events

| Event            | Description                                    | Type                  |
| ---------------- | ---------------------------------------------- | --------------------- |
| `menuItemSelect` | Emitted with the id of the selected menu item. | `CustomEvent<string>` |


## Dependencies

### Used by

 - [kritzel-editor](../kritzel-editor)

### Depends on

- [kritzel-menu](../kritzel-menu)

### Graph
```mermaid
graph TD;
  kritzel-titlebar-menu --> kritzel-menu
  kritzel-menu --> kritzel-menu-item
  kritzel-menu-item --> kritzel-icon
  kritzel-menu-item --> kritzel-portal
  kritzel-editor --> kritzel-titlebar-menu
  style kritzel-titlebar-menu fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
