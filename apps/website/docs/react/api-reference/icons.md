---
sidebar_label: Icons
title: "Icons | Kritzel for React"
description: "Reference for the default Kritzel icon names available to Kritzel React applications."
toc_max_heading_level: 2
---

# Icons

Kritzel registers the same default SVG icon names across all framework packages. The complete default icon map is maintained in the Angular API reference, which is framework-independent and applies to React as well:

- [Complete default icon reference](/docs/angular/api-reference/icons)

Use these names anywhere an API accepts a `KritzelIconName`, such as toolbar items, menu items, login providers, cursor configuration, or the `customSvgIcons` map.

```ts
import { KritzelDefaultIconName, KritzelIconName, KritzelSvgIconMap } from '@kritzel/react-editor';

const builtInIcon: KritzelDefaultIconName = 'shapeRectangle';
const customIcon: KritzelIconName = 'brandExport';

const customSvgIcons: KritzelSvgIconMap = {
  shapeRectangle: '<svg><!-- replacement SVG --></svg>',
  brandExport: '<svg><!-- custom SVG --></svg>',
};
```
