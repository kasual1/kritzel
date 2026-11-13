# updraw-button



<!-- Auto Generated Below -->


## Properties

| Property   | Attribute  | Description                                      | Type                                 | Default     |
| ---------- | ---------- | ------------------------------------------------ | ------------------------------------ | ----------- |
| `disabled` | `disabled` | Whether the button is disabled                   | `boolean`                            | `false`     |
| `type`     | `type`     | The type attribute for the native button element | `"button" \| "reset" \| "submit"`    | `'button'`  |
| `variant`  | `variant`  | The visual variant of the button                 | `"primary" \| "secondary" \| "text"` | `'primary'` |


## Events

| Event         | Description                        | Type                |
| ------------- | ---------------------------------- | ------------------- |
| `buttonClick` | Emitted when the button is clicked | `CustomEvent<void>` |


## Slots

| Slot | Description      |
| ---- | ---------------- |
|      | The default slot |


## Dependencies

### Used by

 - [updraw-current-user-dialog](../updraw-current-user-dialog)
 - [updraw-editor](../updraw-editor)

### Graph
```mermaid
graph TD;
  updraw-current-user-dialog --> updraw-button
  updraw-editor --> updraw-button
  style updraw-button fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
