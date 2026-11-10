---
sidebar_label: Dynamic Objects
displayed_sidebar: tutorialSidebar
title: "Dynamic Objects Concept | Kritzel for React"
description: "Understand how to embed native HTML or registered framework components as canvas objects in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Dynamic Objects

## Overview

Kritzel supports the integration of dynamic components in two different ways. You can choose how to embed the content based on what you are building:

- **Dynamic objects** can contain HTML or React components while remaining part of the canvas. They can be selected, moved, resized, and saved like other objects.
- **The iframe approach** hosts HTML, CSS, and JavaScript inside a scoped sandbox environment, keeping generated or user-authored content separate from the main application.

## Rendering HTML

The simplest way to use a dynamic object is to build a plain DOM subtree and pass it as `element`. Kritzel mounts it as-is; there is no renderer to register or unregister, and no lifecycle hooks to implement. This is a good fit for static content.

If the native HTML owns runtime behavior, such as event listeners or calculator state, use a registered renderer even when the content is plain DOM rather than a React component. Clipboard copy serializes the object while it is still mounted, so a renderer can return the latest serializable state from `onSerialize` and recreate fresh DOM listeners from `rendererData` after paste.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/advanced/dynamic-objects/html"
  repoFiles={[
    'src/pages/advanced/dynamic-objects/DynamicObjectsHtmlPage.tsx',
    'src/pages/advanced/dynamic-objects/html-calculator.tsx',
  ]}
/>

## Rendering Components

For richer content, register a renderer on `KritzelDynamicObjectRendererRegistry` with a stable `rendererKey`. When an object using that key mounts, the registry's `onMount` hook receives the object, its container, and any previously persisted `rendererData`, so you can create a React root with `createRoot` from `react-dom/client` and render a live component into the container instead of static markup.

State flows through `rendererData`:

- On mount, initialize your component from `data` (falling back to a default state on first mount).
- On serialize, `onSerialize` should return the component's latest state so copy/paste captures the live value.
- On unmount, `onUnmount` should return the component's latest state; Kritzel persists it back onto the object so the next mount (including after a reload) picks up where it left off.

Always unregister the renderer, and unmount any mounted React roots, when the hosting page unmounts.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/advanced/dynamic-objects/component"
  repoFiles={[
    'src/pages/advanced/dynamic-objects/DynamicObjectsComponentPage.tsx',
    'src/pages/advanced/dynamic-objects/CalculatorWidget.tsx',
    'src/pages/advanced/dynamic-objects/html-calculator.tsx',
  ]}
/>

## Rendering iFrames

For user-authored or LLM-authored content, `KritzelIframeObject` provides a sandboxed space for HTML, CSS, and JavaScript. The iframe keeps its own content and interaction state while Kritzel manages it as a canvas object.

This example uses predefined prompts rather than a live LLM. Each prompt replaces the calculator shown in the iframe, with the [loading placeholder](../api-reference/theming.md#loading-placeholder) drawn over it during the change. Scripts run inside the iframe's sandbox rather than the main React application.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/advanced/dynamic-objects/iframe"
  repoFiles={[
    'src/pages/advanced/dynamic-objects/DynamicObjectsIframePage.tsx',
    'src/pages/advanced/dynamic-objects/iframe-calculator-definitions.tsx',
  ]}
/>

## Interacting with iFrame Content

Every `KritzelIframeObject` runs a small bridge inside its page. Through it, your application can see which element the user points at or clicks, let the user pick an element, highlight elements, and look elements up by CSS selector. DOM nodes cannot leave the sandboxed page, so elements are reported as plain [element descriptions](#element-descriptions) and addressed by CSS selectors.

In this example, the panel shows the element under the pointer and the last clicked and picked element of the card. **Pick element** turns on picking: the picked element is highlighted and the cursor of an [agent](./agents.md) moves to it. **Highlight buttons** outlines every button in the card.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/advanced/dynamic-objects/iframe-elements"
  repoFiles={[
    'src/pages/advanced/dynamic-objects/DynamicObjectsIframeElementsPage.tsx',
    'src/pages/advanced/dynamic-objects/iframe-elements-content.ts',
  ]}
/>

### Hover and Click Events

While an iframe object is selected, its page is interactive and the editor emits two events:

- `objectElementHover` whenever the element under a mouse or pen pointer changes. `element` is `null` when the pointer leaves the page or the object is deselected.
- `objectElementClick` when the user clicks an element. The click still reaches the page as usual. A press that moved more than a few pixels, for example to drag the object, is not a click, and clicking a label is reported once.

Handle them with the `onObjectElementHover` and `onObjectElementClick` props:

```tsx
<KritzelEditor
  ref={editorRef}
  onObjectElementHover={event => setHovered(event.detail.element?.text ?? null)}
  onObjectElementClick={event => {
    const { objectId, element, shiftKey } = event.detail;
    console.log(objectId, element.selector, shiftKey);
  }}
/>
```

Click events include the state of the modifier keys (`shiftKey`, `ctrlKey`, `altKey`, `metaKey`). Hover events include `isPicking`.

### Picking Elements

Picking lets the user choose an element instead of using it, for example to tell an agent which part of a page to change. Turn it on with `setObjectElementPicking()`. While picking, the element under the pointer is highlighted, a press or click no longer reaches the page, and the editor emits `objectElementPick` instead. Disabled buttons and keyboard activation can be picked as well. Pointing at a nested frame inside the page picks the element that contains it.

```tsx
async function startPicking() {
  const editor = editorRef.current;
  await editor?.selectObjects([iframeObject]);
  await editor?.setObjectElementPicking(iframeObject.id, true, { selector: '[data-kritzel-id]' });
}

async function onElementPick({ objectId, element }: KritzelObjectElementPickEvent) {
  await editorRef.current?.setObjectElementPicking(objectId, false);
  console.log('Picked', element.selector);
}

<KritzelEditor ref={editorRef} onObjectElementPick={event => void onElementPick(event.detail)} />
```

| Option | Type | Description |
|--------|------|-------------|
| selector | string | Limits picking to elements that match this CSS selector, for example `'[data-kritzel-id]'`. The closest matching ancestor of the element under the pointer is picked, and content outside any match can't be picked. |
| color | string | Any CSS color for the picking highlight. Defaults to the theme's `elementHighlight.color`. |

Picking only works while the object is selected, and turning it on does not select the object. It stays on until you turn it off. Pick events include the same modifier keys as click events.

### Highlighting Elements

`highlightObjectElements()` outlines elements inside the page, for example the elements an agent is about to change. Every element that matches a selector is highlighted, up to 100 per selector, and each highlight can have its own `color` and `label`. A call replaces the previous highlights of that object:

```ts
const editor = editorRef.current;

await editor?.highlightObjectElements(iframeObject.id, [
  { selector: 'button' },
  { selector: '[data-kritzel-id="checkout"]', color: '#16A34A', label: 'Next step' },
]);

// Remove the highlights of one object, or of all objects
await editor?.clearObjectElementHighlights(iframeObject.id);
await editor?.clearObjectElementHighlights();
```

Highlights are drawn inside the page, above its modal dialogs and popovers, and only cover the visible part of each element. They follow the elements when the layout changes or the page scrolls, and they are shown whether or not the object is selected. Without a `color`, they use the [`elementHighlight`](../api-reference/theming.md#element-highlight) colors of the theme.

### Querying Elements

`queryObjectElements()` describes the elements that match a CSS selector, in document order. Use it to find the element an agent should work on, or to give an LLM an overview of a page:

```ts
const editor = editorRef.current;

const buttons = await editor?.queryObjectElements(iframeObject.id, 'button');
const named = await editor?.queryObjectElements(iframeObject.id, '[data-kritzel-id]', 200);
```

`limit` defaults to 100 and can be at most 500. The object must be mounted, which it is while it is in or near the viewport. The promise rejects for an invalid selector, and when the page does not answer in time: within 3 seconds, or within 15 seconds while it is still loading.

To point the cursor of an agent at an element with `agent.moveTo({ objectId, selector })`, see [Agents: Pointing at Elements](./agents.md#pointing-at-elements).

### Element Descriptions

Events and queries describe elements as `KritzelObjectElementInfo`:

| Property | Type | Description |
|----------|------|-------------|
| selector | string | A CSS selector that matched exactly this element when it was reported. Built from `data-kritzel-id` or `id` when possible, otherwise from the element's position in the page. |
| kritzelId | string | The element's `data-kritzel-id` attribute. |
| tagName | string | Lowercase tag name, for example `'button'`. |
| id | string | The element's `id` attribute. |
| classList | string[] | The element's classes. |
| text | string | The element's text without script and style content, with collapsed whitespace, truncated to 200 characters. |
| attributes | `Record<string, string>` | Descriptive attributes: `role`, `aria-*`, `data-*`, `name`, `type`, `href`, `src`, `alt`, `title`, `placeholder`, and `for`. Form field values are never included. |
| rect | KritzelObjectElementRect | The element's bounding box in content coordinates: CSS pixels relative to the top-left corner of the iframe, before canvas zoom, object scale, and rotation. |
| visibleRect | KritzelObjectElementRect | The visible part of `rect`, clipped by scrolling containers and the iframe. Omitted when no part of the element can be seen. |

Pass `selector` back to highlight the element, query it again, or point an agent's cursor at it. A selector built from the element's position, such as `main > button:nth-of-type(2)`, may match another element once the page changes. Add a `data-kritzel-id` to meaningful elements, and ask an LLM that writes pages to do the same, so their selectors keep working when the content is regenerated:

```html
<button data-kritzel-id="checkout" type="button">Checkout</button>
```

### Local and Untrusted

Highlights, picking, and the tracking of the elements that agents' cursors stick to are local to the editor. They are not saved, not synchronized to collaborators, and not part of undo and redo. They are kept when the page reloads, for example after `setContent()`, and when a collaborator updates the object.

The page runs untrusted content, and element descriptions come from the page. Treat their text, attributes, and selectors like any other untrusted input, for example when you pass them to an LLM. The element methods reject invalid selectors, and objects that don't exist or have no content elements. The page also reports hovers, clicks, and picks itself, so untrusted content can report them without a real user action while the object is selected or picking. Don't treat a pick as the user's confirmation of something consequential.

The element features need the page to run scripts. With a `sandbox` that leaves out `allow-scripts`, nothing is reported or highlighted and queries reject.

## API Details

For the full list of related APIs, see the following reference sections.

- [Dynamic Object](../api-reference/objects.md#dynamic-object)
- [Iframe Object](../api-reference/objects.md#iframe-object)
- [Object](../api-reference/editor.md#object)
- [Object Elements](../api-reference/editor.md#object-elements)
- [Object Element Types](../api-reference/types.md#object-element-types)
