---
sidebar_label: Overview
title: "Overview | Kritzel for React"
description: Build infinite canvas and collaborative whiteboard experiences in React with Kritzel's native wrapper and TypeScript-first API.
keywords:
  - react whiteboard
  - react infinite canvas
  - kritzel
  - collaborative canvas
  - drawing tools
---

# Overview

Kritzel is a framework-agnostic infinite canvas and collaborative whiteboard engine. It provides web components that work natively in any framework, with a first-class React wrapper for idiomatic JSX integration.

Kritzel handles the hard parts of canvas-based applications, including infinite pan and zoom, hit-testing, CRDT-based collaboration, undo and redo, and cross-browser rendering, so you can focus on your product's domain logic.

If you are just getting started, jump to the [Quick Start](quick-start.md) guide to get a simple editor up and running. Otherwise, explore the building blocks below to learn how Kritzel is structured.

## Building Blocks

The library is composed of a small set of core concepts that work together to power your canvas experience:

<div className="doc-cards">

<a className="doc-card" href="concept-components">
  <div className="doc-card__icon">
    <img src="/img/code.svg" alt="Components" />
  </div>
  <div className="doc-card__body">
    <p className="doc-card__title">Components</p>
    <p className="doc-card__category">Core Concept</p>
    <p className="doc-card__description">Two entry points, a batteries-included editor and a headless engine, to match any integration style.</p>
  </div>
</a>

<a className="doc-card" href="concept-tools">
  <div className="doc-card__icon">
    <img src="/img/palette.svg" alt="Tools" />
  </div>
  <div className="doc-card__body">
    <p className="doc-card__title">Tools</p>
    <p className="doc-card__category">Core Concept</p>
    <p className="doc-card__description">State-machine interaction handlers that define how users draw, select, and manipulate the canvas.</p>
  </div>
</a>

<a className="doc-card" href="concept-objects">
  <div className="doc-card__icon">
    <img src="/img/infinite.svg" alt="Objects" />
  </div>
  <div className="doc-card__body">
    <p className="doc-card__title">Objects</p>
    <p className="doc-card__category">Core Concept</p>
    <p className="doc-card__description">The visual building blocks on the canvas, such as paths, shapes, text, and images with shared spatial properties.</p>
  </div>
</a>

<a className="doc-card" href="concept-workspaces">
  <div className="doc-card__icon">
    <img src="/img/cable.svg" alt="Workspaces" />
  </div>
  <div className="doc-card__body">
    <p className="doc-card__title">Workspaces</p>
    <p className="doc-card__category">Core Concept</p>
    <p className="doc-card__description">Containers that manage an entire canvas collection, view state, and editor configuration.</p>
  </div>
</a>

<a className="doc-card" href="theming">
  <div className="doc-card__icon">
    <img src="/img/sun.svg" alt="Theming" />
  </div>
  <div className="doc-card__body">
    <p className="doc-card__title">Theming</p>
    <p className="doc-card__category">Customization</p>
    <p className="doc-card__description">Built-in light and dark themes with full CSS variable customization to match your brand.</p>
  </div>
</a>

<a className="doc-card" href="concept-collaboration">
  <div className="doc-card__icon">
    <img src="/img/lock.svg" alt="Collaboration" />
  </div>
  <div className="doc-card__body">
    <p className="doc-card__title">Collaboration</p>
    <p className="doc-card__category">Customization</p>
    <p className="doc-card__description">Real-time multi-user sync powered by Yjs CRDTs with pluggable transport providers.</p>
  </div>
</a>

</div>