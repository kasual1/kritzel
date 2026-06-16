# kritzel-zoom-panel

A dumb zoom control component with dedicated zoom-in and zoom-out buttons. It only emits events and does not contain viewport logic.

## Usage

```html
<kritzel-zoom-panel
  visible={true}
  disabled={false}
  onZoomIn={() => handleZoomIn()}
  onZoomOut={() => handleZoomOut()}
></kritzel-zoom-panel>
```

## CSS Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `--kritzel-split-button-width` | `50px` | Width of each zoom button |
| `--kritzel-split-button-height` | `50px` | Height of each zoom button |
| `--kritzel-split-button-border` | `1px solid #ebebeb` | Border for zoom buttons |
| `--kritzel-split-button-border-radius` | `12px` | Border radius for zoom buttons |
| `--kritzel-split-button-background-color` | `#ffffff` | Background color for zoom buttons |
| `--kritzel-split-button-color` | `#000000` | Icon color |
| `--kritzel-split-button-box-shadow` | `0 0 3px rgba(0, 0, 0, 0.08)` | Box shadow for zoom buttons |
| `--kritzel-split-button-hover-background-color` | `hsl(0, 0%, 0%, 4.3%)` | Hover background color |
| `--kritzel-split-button-active-background-color` | `hsl(0, 0%, 0%, 8.6%)` | Active background color |
| `--kritzel-global-pointer-cursor` | `pointer` | Cursor style |
