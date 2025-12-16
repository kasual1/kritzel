# kritzel-engine



<!-- Auto Generated Below -->


## Properties

| Property                 | Attribute   | Description | Type                | Default              |
| ------------------------ | ----------- | ----------- | ------------------- | -------------------- |
| `activeTool`             | --          |             | `KritzelTool`       | `undefined`          |
| `cursorTarget`           | --          |             | `HTMLElement`       | `undefined`          |
| `globalContextMenuItems` | --          |             | `ContextMenuItem[]` | `undefined`          |
| `objectContextMenuItems` | --          |             | `ContextMenuItem[]` | `undefined`          |
| `scaleMax`               | `scale-max` |             | `number`            | `ABSOLUTE_SCALE_MAX` |
| `scaleMin`               | `scale-min` |             | `number`            | `ABSOLUTE_SCALE_MIN` |
| `syncConfig`             | --          |             | `KritzelSyncConfig` | `undefined`          |
| `workspace`              | --          |             | `KritzelWorkspace`  | `undefined`          |


## Events

| Event              | Description | Type                                                          |
| ------------------ | ----------- | ------------------------------------------------------------- |
| `activeToolChange` |             | `CustomEvent<KritzelBaseTool>`                                |
| `isEngineReady`    |             | `CustomEvent<KritzelEngineState>`                             |
| `longpress`        |             | `CustomEvent<PointerEvent>`                                   |
| `objectsChange`    |             | `CustomEvent<KritzelBaseObject<HTMLElement \| SVGElement>[]>` |
| `undoStateChange`  |             | `CustomEvent<KritzelUndoState>`                               |
| `workspacesChange` |             | `CustomEvent<KritzelWorkspace[]>`                             |


## Methods

### `addObject<T extends KritzelBaseObject>(object: T) => Promise<T | null>`



#### Parameters

| Name     | Type | Description |
| -------- | ---- | ----------- |
| `object` | `T`  |             |

#### Returns

Type: `Promise<T>`



### `bringForward(object?: KritzelBaseObject<any>) => Promise<void>`



#### Parameters

| Name     | Type                     | Description |
| -------- | ------------------------ | ----------- |
| `object` | `KritzelBaseObject<any>` |             |

#### Returns

Type: `Promise<void>`



### `bringToFront(object?: KritzelBaseObject<any>) => Promise<void>`



#### Parameters

| Name     | Type                     | Description |
| -------- | ------------------------ | ----------- |
| `object` | `KritzelBaseObject<any>` |             |

#### Returns

Type: `Promise<void>`



### `centerObjectInViewport(object: KritzelBaseObject) => Promise<KritzelBaseObject<HTMLElement | SVGElement>>`



#### Parameters

| Name     | Type                                           | Description |
| -------- | ---------------------------------------------- | ----------- |
| `object` | `KritzelBaseObject<HTMLElement \| SVGElement>` |             |

#### Returns

Type: `Promise<KritzelBaseObject<HTMLElement | SVGElement>>`



### `changeActiveTool(tool: KritzelBaseTool) => Promise<void>`



#### Parameters

| Name   | Type              | Description |
| ------ | ----------------- | ----------- |
| `tool` | `KritzelBaseTool` |             |

#### Returns

Type: `Promise<void>`



### `clearSelection() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `copy() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `createWorkspace(workspace: KritzelWorkspace) => Promise<KritzelWorkspace | null>`



#### Parameters

| Name        | Type               | Description |
| ----------- | ------------------ | ----------- |
| `workspace` | `KritzelWorkspace` |             |

#### Returns

Type: `Promise<KritzelWorkspace>`



### `delete() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `deleteWorkspace(workspace: KritzelWorkspace) => Promise<void>`



#### Parameters

| Name        | Type               | Description |
| ----------- | ------------------ | ----------- |
| `workspace` | `KritzelWorkspace` |             |

#### Returns

Type: `Promise<void>`



### `disable() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `enable() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `getActiveWorkspace() => Promise<KritzelWorkspace>`



#### Returns

Type: `Promise<KritzelWorkspace>`



### `getCopiedObjects() => Promise<KritzelBaseObject[]>`



#### Returns

Type: `Promise<KritzelBaseObject<HTMLElement | SVGElement>[]>`



### `getObjectById<T extends KritzelBaseObject>(id: string) => Promise<T | null>`



#### Parameters

| Name | Type     | Description |
| ---- | -------- | ----------- |
| `id` | `string` |             |

#### Returns

Type: `Promise<T>`



### `getSelectedObjects() => Promise<KritzelBaseObject<any>[]>`



#### Returns

Type: `Promise<KritzelBaseObject<any>[]>`



### `getWorkspaces() => Promise<KritzelWorkspace[]>`



#### Returns

Type: `Promise<KritzelWorkspace[]>`



### `hideContextMenu() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `paste(x: number, y: number) => Promise<void>`



#### Parameters

| Name | Type     | Description |
| ---- | -------- | ----------- |
| `x`  | `number` |             |
| `y`  | `number` |             |

#### Returns

Type: `Promise<void>`



### `redo() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `registerTool(toolName: string, toolClass: any, toolConfig?: KritzelTextToolConfig | KritzelBrushToolConfig) => Promise<KritzelBaseTool>`



#### Parameters

| Name         | Type                                              | Description |
| ------------ | ------------------------------------------------- | ----------- |
| `toolName`   | `string`                                          |             |
| `toolClass`  | `any`                                             |             |
| `toolConfig` | `KritzelTextToolConfig \| KritzelBrushToolConfig` |             |

#### Returns

Type: `Promise<KritzelBaseTool>`



### `removeObject<T extends KritzelBaseObject>(object: T) => Promise<T | null>`



#### Parameters

| Name     | Type | Description |
| -------- | ---- | ----------- |
| `object` | `T`  |             |

#### Returns

Type: `Promise<T>`



### `selectAllObjectsInViewport() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `selectObjects(objects: KritzelBaseObject[]) => Promise<void>`



#### Parameters

| Name      | Type                                             | Description |
| --------- | ------------------------------------------------ | ----------- |
| `objects` | `KritzelBaseObject<HTMLElement \| SVGElement>[]` |             |

#### Returns

Type: `Promise<void>`



### `sendBackward(object?: KritzelBaseObject<any>) => Promise<void>`



#### Parameters

| Name     | Type                     | Description |
| -------- | ------------------------ | ----------- |
| `object` | `KritzelBaseObject<any>` |             |

#### Returns

Type: `Promise<void>`



### `sendToBack(object?: KritzelBaseObject<any>) => Promise<void>`



#### Parameters

| Name     | Type                     | Description |
| -------- | ------------------------ | ----------- |
| `object` | `KritzelBaseObject<any>` |             |

#### Returns

Type: `Promise<void>`



### `undo() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `updateObject<T extends KritzelBaseObject>(object: T, updatedProperties: Partial<T>) => Promise<T | null>`



#### Parameters

| Name                | Type                         | Description |
| ------------------- | ---------------------------- | ----------- |
| `object`            | `T`                          |             |
| `updatedProperties` | `{ [P in keyof T]?: T[P]; }` |             |

#### Returns

Type: `Promise<T>`



### `updateWorkspace(workspace: KritzelWorkspace) => Promise<void>`



#### Parameters

| Name        | Type               | Description |
| ----------- | ------------------ | ----------- |
| `workspace` | `KritzelWorkspace` |             |

#### Returns

Type: `Promise<void>`




## Dependencies

### Used by

 - [kritzel-editor](../kritzel-editor)

### Depends on

- [kritzel-context-menu](../../ui/kritzel-context-menu)
- [kritzel-cursor-trail](../kritzel-cursor-trail)

### Graph
```mermaid
graph TD;
  kritzel-engine --> kritzel-context-menu
  kritzel-engine --> kritzel-cursor-trail
  kritzel-context-menu --> kritzel-icon
  kritzel-editor --> kritzel-engine
  style kritzel-engine fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
