# updraw-slide-toggle

A slide toggle (switch) component for toggling between on/off states.

## Usage

```html
<updraw-slide-toggle></updraw-slide-toggle>

<!-- With initial checked state -->
<updraw-slide-toggle checked></updraw-slide-toggle>

<!-- Disabled state -->
<updraw-slide-toggle disabled></updraw-slide-toggle>

<!-- With accessibility label -->
<updraw-slide-toggle label="Enable notifications"></updraw-slide-toggle>
```

## CSS Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `--updraw-slide-toggle-width` | Width of the toggle track | `40px` |
| `--updraw-slide-toggle-height` | Height of the toggle track | `22px` |
| `--updraw-slide-toggle-track-color` | Background color of the track (off state) | `#ccc` |
| `--updraw-slide-toggle-track-checked-color` | Background color of the track (on state) | `#4caf50` |
| `--updraw-slide-toggle-thumb-color` | Color of the thumb | `#fff` |
| `--updraw-slide-toggle-thumb-size` | Size of the thumb | `18px` |
| `--updraw-slide-toggle-border-radius` | Border radius of the track | `11px` |
| `--updraw-slide-toggle-transition-duration` | Duration of the toggle animation | `0.2s` |

<!-- Auto Generated Below -->


## Properties

| Property   | Attribute  | Description                                   | Type      | Default     |
| ---------- | ---------- | --------------------------------------------- | --------- | ----------- |
| `checked`  | `checked`  | Whether the toggle is checked/on              | `boolean` | `false`     |
| `disabled` | `disabled` | Whether the toggle is disabled                | `boolean` | `false`     |
| `label`    | `label`    | Label text for accessibility (screen readers) | `string`  | `undefined` |


## Events

| Event           | Description                           | Type                   |
| --------------- | ------------------------------------- | ---------------------- |
| `checkedChange` | Emitted when the toggle state changes | `CustomEvent<boolean>` |


## Dependencies

### Used by

 - [updraw-settings](../updraw-settings)
 - [updraw-share-dialog](../updraw-share-dialog)

### Graph
```mermaid
graph TD;
  updraw-settings --> updraw-slide-toggle
  updraw-share-dialog --> updraw-slide-toggle
  style updraw-slide-toggle fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
