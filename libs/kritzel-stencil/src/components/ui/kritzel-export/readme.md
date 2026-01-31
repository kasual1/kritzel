# kritzel-export

A dialog component for exporting the current viewport as PNG or SVG.

## Usage

```html
<kritzel-export></kritzel-export>
```

You can open the dialog programmatically by calling the `open()` method.

```javascript
const exportDialog = document.querySelector('kritzel-export');
await exportDialog.open();
```

## Events

| Event | Description |
| --- | --- |
| `exportPng` | Emitted when the user selects "Export as PNG". |
| `exportSvg` | Emitted when the user selects "Export as SVG". |
