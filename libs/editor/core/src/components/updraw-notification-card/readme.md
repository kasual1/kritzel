# updraw-notification-card

A lightweight card component for rendering an `UpdrawNotification` object.

## Usage

```html
<updraw-notification-card
  notification={notification}
  showTimestamp={true}
  locale="en"
></updraw-notification-card>
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
| `--updraw-notification-card-max-width` | `360px` | Maximum card width |
| `--updraw-notification-card-padding` | `12px 14px` | Card padding |
| `--updraw-notification-card-border` | `1px solid #e5e7eb` | Card border |
| `--updraw-notification-card-border-left-width` | `4px` | Accent border width |
| `--updraw-notification-card-border-radius` | `12px` | Card border radius |
| `--updraw-notification-card-background-color` | `#ffffff` | Card background color |
| `--updraw-notification-card-color` | `#111827` | Card text color |
| `--updraw-notification-card-box-shadow` | `0 8px 20px rgba(15, 23, 42, 0.08)` | Card shadow |
| `--updraw-notification-card-info-accent-color` | `#1d4ed8` | Accent color for info notifications |
| `--updraw-notification-card-warning-accent-color` | `#b45309` | Accent color for warning notifications |
| `--updraw-notification-card-error-accent-color` | `#b91c1c` | Accent color for error notifications |
| `--updraw-notification-card-header-gap` | `8px` | Gap between badge and timestamp |
| `--updraw-notification-card-header-margin-bottom` | `8px` | Header spacing below |
| `--updraw-notification-card-pill-height` | `22px` | Badge height |
| `--updraw-notification-card-pill-padding` | `0 8px` | Badge horizontal padding |
| `--updraw-notification-card-pill-border-radius` | `999px` | Badge border radius |
| `--updraw-notification-card-pill-background-color` | `#f3f4f6` | Badge background |
| `--updraw-notification-card-pill-color` | `#111827` | Badge text color |
| `--updraw-notification-card-pill-font-size` | `12px` | Badge font size |
| `--updraw-notification-card-pill-font-weight` | `600` | Badge font weight |
| `--updraw-notification-card-timestamp-color` | `#6b7280` | Timestamp color |
| `--updraw-notification-card-timestamp-font-size` | `12px` | Timestamp font size |
| `--updraw-notification-card-message-color` | `inherit` | Message text color |
| `--updraw-notification-card-message-font-size` | `14px` | Message font size |
| `--updraw-notification-card-message-line-height` | `1.45` | Message line height |

<!-- Auto Generated Below -->


## Properties

| Property        | Attribute        | Description                                                       | Type                  | Default     |
| --------------- | ---------------- | ----------------------------------------------------------------- | --------------------- | ----------- |
| `locale`        | `locale`         | Locale used for formatting the timestamp.                         | `string`              | `undefined` |
| `notification`  | --               | Notification data rendered by this card.                          | `UpdrawNotification` | `undefined` |
| `showTimestamp` | `show-timestamp` | Whether a formatted timestamp should be displayed when available. | `boolean`             | `true`      |


## Events

| Event         | Description                                                 | Type                   |
| ------------- | ----------------------------------------------------------- | ---------------------- |
| `dismiss`     | Emitted when the notification should be dismissed manually. | `CustomEvent<void>`    |
| `hoverChange` | Emitted when pointer hover state changes.                   | `CustomEvent<boolean>` |


## Dependencies

### Used by

 - [updraw-editor](../updraw-editor)

### Depends on

- updraw-icon

### Graph
```mermaid
graph TD;
  updraw-notification-card --> updraw-icon
  updraw-editor --> updraw-notification-card
  style updraw-notification-card fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
