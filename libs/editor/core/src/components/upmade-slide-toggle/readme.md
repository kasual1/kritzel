# upmade-slide-toggle

A slide toggle (switch) component for toggling between on/off states.

## Usage

```html
<upmade-slide-toggle></upmade-slide-toggle>

<!-- With initial checked state -->
<upmade-slide-toggle checked></upmade-slide-toggle>

<!-- Disabled state -->
<upmade-slide-toggle disabled></upmade-slide-toggle>

<!-- With accessibility label -->
<upmade-slide-toggle label="Enable notifications"></upmade-slide-toggle>
```

## CSS Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `--upmade-slide-toggle-width` | Width of the toggle track | `40px` |
| `--upmade-slide-toggle-height` | Height of the toggle track | `22px` |
| `--upmade-slide-toggle-track-color` | Background color of the track (off state) | `#ccc` |
| `--upmade-slide-toggle-track-checked-color` | Background color of the track (on state) | `#4caf50` |
| `--upmade-slide-toggle-thumb-color` | Color of the thumb | `#fff` |
| `--upmade-slide-toggle-thumb-size` | Size of the thumb | `18px` |
| `--upmade-slide-toggle-border-radius` | Border radius of the track | `11px` |
| `--upmade-slide-toggle-transition-duration` | Duration of the toggle animation | `0.2s` |

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

 - [upmade-settings](../upmade-settings)
 - [upmade-share-dialog](../upmade-share-dialog)

### Graph
```mermaid
graph TD;
  upmade-settings --> upmade-slide-toggle
  upmade-share-dialog --> upmade-slide-toggle
  style upmade-slide-toggle fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
