---
sidebar_label: Viewport
displayed_sidebar: tutorialSidebar
title: "Viewport Concept | Kritzel for React"
description: "Understand the core concept of Viewport in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Viewport

## Overview

In Kritzel, the viewport defines the portion of the canvas world currently displayed to the user. It tracks the current pan offset, zoom scale, and visible dimensions, while objects retain their own world coordinates.

The Viewport API lets you programmatically navigate the canvas, fit content into view, inspect and react to viewport changes, and constrain navigation.

## Panning

Use `panTo` to move the viewport to a world coordinate while preserving the current zoom. Use `setViewport` when you need to center the viewport on a world coordinate and explicitly retain or set the scale.

The demo moves the viewport between a few world positions while preserving the current scale.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/react"
  demoPath="/fundamentals/viewport/pan"
  repoFiles={['src/pages/fundamentals/viewport/ViewportPanPage.tsx']}
/>

## Zooming

Use `zoomTo` to set an exact zoom scale, optionally anchoring the zoom around a world coordinate. For custom zoom controls, `zoomIn` and `zoomOut` apply a multiplicative zoom step around the current viewport center and support an animation duration.

The demo includes step controls, an exact zoom level, and a zoom that stays anchored to a selected world position.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/react"
  demoPath="/fundamentals/viewport/zoom"
  repoFiles={['src/pages/fundamentals/viewport/ViewportZoomPage.tsx']}
/>

## Centering Content

Kritzel provides several ways to bring content into view. Use `panToObject` to move the viewport to an object without changing the current zoom. Use `centerObjects` to fit a specific set of objects, or `centerAllObjects` to fit all non-selection objects on the canvas.

The `backToContent` method is optimized for recovery when the user has panned away from the drawing. It fits the nearest content objects, not necessarily every object in the workspace. If you specifically need an overview of everything, use `centerAllObjects`.

`centerObjectInViewport` has a different purpose: it centers the object itself in the current viewport by updating the object, instead of panning the viewport. For navigation UI, prefer `panToObject` or `centerObjects`.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/react"
  demoPath="/fundamentals/viewport/center"
  repoFiles={['src/pages/fundamentals/viewport/ViewportCenterPage.tsx']}
/>

## Zoom Limits

Use `scaleMin` and `scaleMax` to keep the viewport's zoom within a supported range. Kritzel applies these limits to both user input and programmatic zoom operations.

The demo provides 10% zoom-in and zoom-out steps. Continue selecting one direction to reach the configured limit; further selections keep the viewport at the clamped scale.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/react"
  demoPath="/fundamentals/viewport/limits"
  repoFiles={['src/pages/fundamentals/viewport/ViewportLimitsPage.tsx']}
/>

## Boundaries

Set `viewportBoundaryLeft`, `viewportBoundaryRight`, `viewportBoundaryTop`, and `viewportBoundaryBottom` to keep panning inside a bounded world area. When finite boundaries are configured, Kritzel may raise the effective minimum scale so the viewport cannot zoom out far enough to reveal space beyond those boundaries.

The demo provides four controls that move the viewport 100 world units up, down, left, or right. Continue selecting one direction to reach that boundary; further selections keep the viewport at the constrained position.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/react"
  demoPath="/fundamentals/viewport/boundaries"
  repoFiles={['src/pages/fundamentals/viewport/ViewportBoundariesPage.tsx']}
/>

## Events

Kritzel emits `onViewportChange` with the latest position, scale, and dimensions whenever the view changes. The demo uses pan and zoom controls and displays the resulting viewport state in its toolbar.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/react"
  demoPath="/fundamentals/viewport/events"
  repoFiles={['src/pages/fundamentals/viewport/ViewportEventsPage.tsx']}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [Viewport & Navigation](../api-reference/editor.md#viewport--navigation)