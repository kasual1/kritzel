---
title: "Introducing Kritzel: The Infinite Canvas Library for React, Vue, and Angular"
description: "After 2.5 years of development, we are thrilled to announce Kritzel—a framework-agnostic infinite canvas library designed for spatial UI."
date: 2026-08-02
image: /img/blog/introducing-kritzel-flowers.png
thumbnail: /videos/2026_10_10_Kritzel_Welcome.mp4
---

import QuickStartLink from '@site/src/components/QuickStartLink';

After two and a half years of building, tweaking, and optimizing, I am incredibly excited to officially introduce **Kritzel** to the public. 

Kritzel is a high-performance, framework-agnostic infinite canvas library. Whether you are building with React, Vue, Angular, or vanilla Web Components, Kritzel provides the infrastructure you need to create spatial applications, whiteboards, and visual tools.

{/* truncate */}

## The Origin Story

The journey started in early 2024 as a digital art project. I was fascinated by the concept of infinite canvases and how deeply they draw users into a freeform creative flow. 

At the time, fantastic tools like `tldraw` and `excalidraw` existed, but they were predominantly tied to specific ecosystems. Coming from an Angular background, I realized there was a massive gap: developers outside the React ecosystem lacked a native, plug-and-play infinite canvas solution. 

My primary goal with Kritzel is to make infinite canvas technology accessible to a much broader audience. This means two things: first, breaking down framework silos by making the library truly framework-agnostic. Second, offering a more cost-effective and transparent pricing model compared to existing enterprise solutions, so independent developers and smaller teams can build spatial interfaces without prohibitive licensing fees.

## Core Features

Instead of forcing you to solve the same complex UI patterns from scratch, Kritzel gives you the reliable building blocks for your next spatial app:

- **Framework Agnosticism:** Built on top of Web Components, Kritzel ships with dedicated wrappers for React (`@kritzel/react-editor`), Vue (`@kritzel/vue-editor`), and Angular (`@kritzel/angular-editor`). You get an idiomatic experience regardless of your stack.
- **Spatial UI Support:** Instead of flattening everything into static pixels on a `<canvas>`, Kritzel treats the canvas as a spatial DOM. You can embed interactive elements—like text inputs or custom framework components—directly into the workspace.
- **Optimized Rendering:** To handle large numbers of objects, Kritzel uses spatial indexing (Quadtrees) to render only what is currently visible in the viewport, which helps maintain a steady frame rate during zooming and panning across devices.
- **Collaboration API:** If you are building a multiplayer whiteboard, Kritzel provides hooks to integrate with sync engines like Yjs or Hocuspocus to help manage distributed state.
- **Extensible:** The library exposes a plugin API, allowing you to register custom tools, add new object types, and adjust theming as needed.

## Early Access and Next Steps

Kritzel is officially available, but we are still in our early stages. We are actively figuring out the best paths forward, stabilizing APIs, and learning how developers want to use spatial interfaces in the wild. 

Because of this, we are looking for early adopters who want to build right alongside us.

[Let us know on GitHub](https://github.com/kritzeljs/kritzel) what you're building, so we can shape the future of this library together.

<QuickStartLink />

— *Lukas Mühlenbeck, Creator of kritzel.io*