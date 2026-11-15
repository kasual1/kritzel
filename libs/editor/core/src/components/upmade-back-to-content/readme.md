# updraw-back-to-content

A button component that appears when the user has panned away from all visible content on the canvas. Clicking it navigates the viewport back to the nearest content.

## Usage

```html
<updraw-back-to-content
  visible={true}
  text="Back to content"
  onBackToContent={() => handleBackToContent()}
></updraw-back-to-content>
```

## CSS Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `--updraw-back-to-content-top` | `16px` | Distance from top of container |
| `--updraw-back-to-content-z-index` | `1000` | Z-index of the button |
| `--updraw-back-to-content-gap` | `6px` | Gap between icon and text |
| `--updraw-back-to-content-padding` | `10px 16px` | Button padding |
| `--updraw-back-to-content-border` | `1px solid #ebebeb` | Button border |
| `--updraw-back-to-content-border-radius` | `12px` | Button border radius |
| `--updraw-back-to-content-background-color` | `#ffffff` | Button background color |
| `--updraw-back-to-content-color` | `#000000` | Button text color |
| `--updraw-back-to-content-font-size` | `14px` | Button font size |
| `--updraw-back-to-content-font-weight` | `500` | Button font weight |
| `--updraw-back-to-content-box-shadow` | `0 0 3px rgba(0, 0, 0, 0.08)` | Button box shadow |
| `--updraw-back-to-content-hover-background-color` | `hsl(0, 0%, 0%, 4.3%)` | Hover background color |
| `--updraw-back-to-content-active-background-color` | `hsl(0, 0%, 0%, 8.6%)` | Active/pressed background color |
| `--updraw-pointer-cursor` | `pointer` | Cursor style |

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

 - [updraw-editor](../updraw-editor)

### Depends on

- updraw-icon

### Graph
```mermaid
graph TD;
  updraw-back-to-content --> updraw-icon
  updraw-editor --> updraw-back-to-content
  style updraw-back-to-content fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
