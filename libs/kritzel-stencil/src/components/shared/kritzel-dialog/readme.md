# kritzel-dialog

A generic, reusable dialog component for displaying modal content to the user.

## Features

- **Slots-based content**: Use `header`, default (body), and `footer` slots for flexible content
- **Focus management**: Auto-focus first element and trap focus within the dialog
- **Keyboard support**: Close with Escape key, navigate with Tab
- **Backdrop click**: Optionally close when clicking outside the dialog
- **Scroll lock**: Prevents body scroll when dialog is open
- **Animations**: Smooth fade-in and scale animations
- **Size variants**: Small, medium, and large sizes
- **Accessible**: Proper ARIA attributes for screen readers

## Usage

```html
<kritzel-dialog is-open="true" dialog-title="Confirm Action" size="medium">
  <p>Are you sure you want to proceed?</p>
  <div slot="footer">
    <button>Cancel</button>
    <button>Confirm</button>
  </div>
</kritzel-dialog>
```

### With custom header

```html
<kritzel-dialog is-open="true">
  <div slot="header">
    <h2>Custom Header</h2>
    <span>Subtitle text</span>
  </div>
  <p>Dialog content goes here.</p>
</kritzel-dialog>
```

<!-- Auto Generated Below -->
