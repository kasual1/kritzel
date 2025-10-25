# kritzel-workspace-manager



<!-- Auto Generated Below -->


## Properties

| Property          | Attribute | Description | Type                 | Default     |
| ----------------- | --------- | ----------- | -------------------- | ----------- |
| `activeWorkspace` | --        |             | `KritzelWorkspace`   | `undefined` |
| `workspaces`      | --        |             | `KritzelWorkspace[]` | `[]`        |


## Events

| Event                     | Description | Type                            |
| ------------------------- | ----------- | ------------------------------- |
| `isWorkspaceManagerReady` |             | `CustomEvent<void>`             |
| `workspaceChange`         |             | `CustomEvent<KritzelWorkspace>` |


## Dependencies

### Used by

 - [kritzel-editor](../../core/kritzel-editor)

### Depends on

- [kritzel-split-button](../../shared/kritzel-split-button)

### Graph
```mermaid
graph TD;
  kritzel-workspace-manager --> kritzel-split-button
  kritzel-split-button --> kritzel-icon
  kritzel-split-button --> kritzel-portal
  kritzel-split-button --> kritzel-menu
  kritzel-menu --> kritzel-menu-item
  kritzel-menu-item --> kritzel-icon
  kritzel-menu-item --> kritzel-portal
  kritzel-menu-item --> kritzel-menu
  kritzel-editor --> kritzel-workspace-manager
  style kritzel-workspace-manager fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
