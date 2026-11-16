# upmade-back-to-content

A button component that appears when the user has panned away from all visible content on the canvas. Clicking it navigates the viewport back to the nearest content.

## Usage

```html
<upmade-back-to-content
  visible={true}
  text="Back to content"
  onBackToContent={() => handleBackToContent()}
></upmade-back-to-content>
```

## CSS Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `--upmade-back-to-content-top` | `16px` | Distance from top of container |
| `--upmade-back-to-content-z-index` | `1000` | Z-index of the button |
| `--upmade-back-to-content-gap` | `6px` | Gap between icon and text |
| `--upmade-back-to-content-padding` | `10px 16px` | Button padding |
| `--upmade-back-to-content-border` | `1px solid #ebebeb` | Button border |
| `--upmade-back-to-content-border-radius` | `12px` | Button border radius |
| `--upmade-back-to-content-background-color` | `#ffffff` | Button background color |
| `--upmade-back-to-content-color` | `#000000` | Button text color |
| `--upmade-back-to-content-font-size` | `14px` | Button font size |
| `--upmade-back-to-content-font-weight` | `500` | Button font weight |
| `--upmade-back-to-content-box-shadow` | `0 0 3px rgba(0, 0, 0, 0.08)` | Button box shadow |
| `--upmade-back-to-content-hover-background-color` | `hsl(0, 0%, 0%, 4.3%)` | Hover background color |
| `--upmade-back-to-content-active-background-color` | `hsl(0, 0%, 0%, 8.6%)` | Active/pressed background color |
| `--upmade-pointer-cursor` | `pointer` | Cursor style |

<!-- Auto Generated Below -->


## Properties

| Property  | Attribute | Description                       | Type      | Default             |
| --------- | --------- | --------------------------------- | --------- | ------------------- |
| `text`    | `text`    | The text to display on the button | `string`  | `'Back to content'` |
| `visible` | `visible` | Whether the button is visible     | `boolean` | `false`             |


## Events

| Event           | Description                        | Type                |
| --------------- | ---------------------------------- | ------------------- |
| `backToContent` | Emitted when the button is clicked | `CustomEvent<void>` |


## Dependencies

### Used by

 - [upmade-editor](../upmade-editor)

### Depends on

- upmade-icon

### Graph
```mermaid
graph TD;
  upmade-back-to-content --> upmade-icon
  upmade-editor --> upmade-back-to-content
  style upmade-back-to-content fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
