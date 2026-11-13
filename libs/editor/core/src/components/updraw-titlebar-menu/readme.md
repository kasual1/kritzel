# updraw-titlebar-menu



<!-- Auto Generated Below -->


## Overview

The menu opened from a titlebar `menu` element: a compact `updraw-menu` styled like the
context menu through the `--updraw-titlebar-menu-*` theme variables.

## Properties

| Property | Attribute | Description                                                      | Type                       | Default |
| -------- | --------- | ---------------------------------------------------------------- | -------------------------- | ------- |
| `items`  | --        | Menu items of the open titlebar menu, as resolved by the engine. | `UpdrawTitlebarMenuItem[]` | `[]`    |


## Events

| Event            | Description                                    | Type                  |
| ---------------- | ---------------------------------------------- | --------------------- |
| `menuItemSelect` | Emitted with the id of the selected menu item. | `CustomEvent<string>` |


## Dependencies

### Used by

 - [updraw-editor](../updraw-editor)

### Depends on

- [updraw-menu](../updraw-menu)

### Graph
```mermaid
graph TD;
  updraw-titlebar-menu --> updraw-menu
  updraw-menu --> updraw-menu-item
  updraw-menu-item --> updraw-icon
  updraw-menu-item --> updraw-portal
  updraw-editor --> updraw-titlebar-menu
  style updraw-titlebar-menu fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
