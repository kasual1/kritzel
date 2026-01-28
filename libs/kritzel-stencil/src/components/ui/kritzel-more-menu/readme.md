# kritzel-more-menu

A button component that displays a dropdown menu when clicked. Commonly used for "more options" or ellipsis menus.

## Usage

```html
<kritzel-more-menu items={menuItems}></kritzel-more-menu>
```

## Properties

| Property   | Type                 | Default              | Description                              |
| ---------- | -------------------- | -------------------- | ---------------------------------------- |
| `items`    | `IKritzelMenuItem[]` | `[]`                 | The menu items to display in the dropdown |
| `icon`     | `string`             | `'ellipsis-vertical'`| The icon to display on the button        |
| `iconSize` | `number`             | `24`                 | The size of the icon                     |
| `offsetY`  | `number`             | `4`                  | Offset Y for the portal positioning      |

## Events

| Event        | Detail                                            | Description                        |
| ------------ | ------------------------------------------------- | ---------------------------------- |
| `itemSelect` | `{ item: IKritzelMenuItem; parent: IKritzelMenuItem }` | Emitted when a menu item is selected |

## CSS Custom Properties

| Property                                        | Default                      | Description                            |
| ----------------------------------------------- | ---------------------------- | -------------------------------------- |
| `--kritzel-more-menu-button-width`              | `50px`                       | Button width                           |
| `--kritzel-more-menu-button-height`             | `50px`                       | Button height                          |
| `--kritzel-more-menu-button-border`             | `1px solid #ebebeb`          | Button border                          |
| `--kritzel-more-menu-button-border-radius`      | `12px`                       | Button border radius                   |
| `--kritzel-more-menu-button-background-color`   | `#ffffff`                    | Button background color                |
| `--kritzel-more-menu-button-box-shadow`         | `0 0 3px rgba(0, 0, 0, 0.08)`| Button box shadow                      |
| `--kritzel-more-menu-button-hover-background-color`  | `#f5f5f5`               | Button hover background color          |
| `--kritzel-more-menu-button-active-background-color` | `#ebebeb`               | Button active background color         |

<!-- Auto Generated Below -->
