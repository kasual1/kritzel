# upmade-notification-card

A lightweight card component for rendering an `UpmadeNotification` object.

## Usage

```html
<upmade-notification-card
  notification={notification}
  showTimestamp={true}
  locale="en"
></upmade-notification-card>
```

```ts
const notification = {
  id: 'n-1',
  type: 'warning',
  message: 'Connection is unstable. Changes may sync with delay.',
  timestamp: new Date(),
};
```

## CSS Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `--upmade-notification-card-max-width` | `360px` | Maximum card width |
| `--upmade-notification-card-padding` | `12px 14px` | Card padding |
| `--upmade-notification-card-border` | `1px solid #e5e7eb` | Card border |
| `--upmade-notification-card-border-left-width` | `4px` | Accent border width |
| `--upmade-notification-card-border-radius` | `12px` | Card border radius |
| `--upmade-notification-card-background-color` | `#ffffff` | Card background color |
| `--upmade-notification-card-color` | `#111827` | Card text color |
| `--upmade-notification-card-box-shadow` | `0 8px 20px rgba(15, 23, 42, 0.08)` | Card shadow |
| `--upmade-notification-card-info-accent-color` | `#1d4ed8` | Accent color for info notifications |
| `--upmade-notification-card-warning-accent-color` | `#b45309` | Accent color for warning notifications |
| `--upmade-notification-card-error-accent-color` | `#b91c1c` | Accent color for error notifications |
| `--upmade-notification-card-header-gap` | `8px` | Gap between badge and timestamp |
| `--upmade-notification-card-header-margin-bottom` | `8px` | Header spacing below |
| `--upmade-notification-card-pill-height` | `22px` | Badge height |
| `--upmade-notification-card-pill-padding` | `0 8px` | Badge horizontal padding |
| `--upmade-notification-card-pill-border-radius` | `999px` | Badge border radius |
| `--upmade-notification-card-pill-background-color` | `#f3f4f6` | Badge background |
| `--upmade-notification-card-pill-color` | `#111827` | Badge text color |
| `--upmade-notification-card-pill-font-size` | `12px` | Badge font size |
| `--upmade-notification-card-pill-font-weight` | `600` | Badge font weight |
| `--upmade-notification-card-timestamp-color` | `#6b7280` | Timestamp color |
| `--upmade-notification-card-timestamp-font-size` | `12px` | Timestamp font size |
| `--upmade-notification-card-message-color` | `inherit` | Message text color |
| `--upmade-notification-card-message-font-size` | `14px` | Message font size |
| `--upmade-notification-card-message-line-height` | `1.45` | Message line height |

<!-- Auto Generated Below -->


## Properties

| Property        | Attribute        | Description                                                       | Type                 | Default     |
| --------------- | ---------------- | ----------------------------------------------------------------- | -------------------- | ----------- |
| `locale`        | `locale`         | Locale used for formatting the timestamp.                         | `string`             | `undefined` |
| `notification`  | --               | Notification data rendered by this card.                          | `UpmadeNotification` | `undefined` |
| `showTimestamp` | `show-timestamp` | Whether a formatted timestamp should be displayed when available. | `boolean`            | `true`      |


## Events

| Event         | Description                                                 | Type                   |
| ------------- | ----------------------------------------------------------- | ---------------------- |
| `dismiss`     | Emitted when the notification should be dismissed manually. | `CustomEvent<void>`    |
| `hoverChange` | Emitted when pointer hover state changes.                   | `CustomEvent<boolean>` |


## Dependencies

### Used by

 - [upmade-editor](../upmade-editor)

### Depends on

- upmade-icon

### Graph
```mermaid
graph TD;
  upmade-notification-card --> upmade-icon
  upmade-editor --> upmade-notification-card
  style upmade-notification-card fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
