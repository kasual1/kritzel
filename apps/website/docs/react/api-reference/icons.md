---
sidebar_label: Icons
title: "Icons | Kritzel for React"
description: "Reference for the default Kritzel icon names available to Kritzel React applications."
toc_max_heading_level: 2
---

# Icons

Kritzel registers the following default SVG icons through `KritzelIconRegistry`. Use these names anywhere an API accepts a `KritzelIconName`, such as toolbar items, menu items, login providers, cursor configuration, or the `customSvgIcons` map.

Custom icon names are still supported. Register them through the `customSvgIcons` prop or `KritzelIconRegistry.register()` and then reference the same string where an icon name is accepted.

```ts
import { KritzelDefaultIconName, KritzelIconName, KritzelSvgIconMap } from '@kritzel/react-editor';

const builtInIcon: KritzelDefaultIconName = 'shapeRectangle';
const customIcon: KritzelIconName = 'brandExport';

const customSvgIcons: KritzelSvgIconMap = {
  shapeRectangle: '<svg><!-- replacement SVG --></svg>',
  brandExport: '<svg><!-- custom SVG --></svg>',
};
```

## Default Icon Map

| Icon name | Typical use |
|-----------|-------------|
| cursor | Selection tool |
| pen | Brush or drawing tool |
| arrow | Line or arrow tool |
| arrowUpFromDot | Move forward / bring forward |
| arrowDownFromDot | Move backward / send backward |
| highlighter | Highlighting tool |
| eraser | Eraser tool |
| type | Text tool |
| shapes | Shape tool group |
| shapeRectangle | Rectangle shape option |
| shapeEllipse | Ellipse shape option |
| shapeTriangle | Triangle shape option |
| image | Image tool or available image |
| imageOff | Missing or unavailable image |
| chevronDown | Expand menu or dropdown |
| chevronUp | Collapse menu or dropdown |
| chevronLeft | Back or previous action |
| chevronRight | Forward or nested menu action |
| chevronsLeft | Back to content |
| copy | Copy action |
| paste | Paste action |
| cut | Cut action |
| delete | Delete action |
| bringToFront | Bring selected object to front |
| sendToBack | Send selected object to back |
| selectAll | Select all action |
| download | Download or import action |
| upload | Upload or export action |
| undo | Undo action |
| redo | Redo action |
| plus | Add or increase action |
| play | Play or preview action |
| minus | Remove or decrease action |
| ellipsisVertical | More menu |
| x | Close or clear action |
| check | Confirm or selected state |
| group | Group objects |
| ungroup | Ungroup objects |
| moveVertical | Vertical move or resize cursor |
| hand | Pan cursor |
| handGrab | Active pan cursor |
| mousePointer | Default pointer cursor |
| pointer | Pointer cursor helper |
| settings | Settings action |
| share | Share action |
| palette | Color or palette control |
| command | Shortcut or command UI |
| info | Informational action |
| ordering | Object ordering submenu |
| layoutTemplate | Layout or template action |
| align | Alignment submenu |
| alignStartHorizontal | Align left |
| alignCenterHorizontal | Align horizontal center |
| alignEndHorizontal | Align right |
| alignStartVertical | Align top |
| alignCenterVertical | Align vertical center |
| alignEndVertical | Align bottom |
| viewport | Viewport or fit-to-view action |
| logOut | Log out action |
| usersRound | Users or collaborators |
| google | Google login provider |
| facebook | Facebook login provider |
| github | GitHub login provider |
| braces | Code or structured data action |
| heart | Favorite or support action |
