---
sidebar_label: Agile Retro & Kanban
displayed_sidebar: tutorialSidebar
title: "Agile Project Retrospectives & Kan-Ban Planning | Kritzel for Angular"
description: "Model agile sprint retrospectives and Kanban planning boards using custom whiteboard shapes, vector task connectors, and tailored context menus."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Agile Project Retrospectives & Kan-Ban Planning

This page shows how to design collaborative Kanban whiteboards and sprint retrospectives using Kritzel. You will learn how to draft static scenery columns, spawn text-overlaid sticky cards, establish spatial task correlations with connector lines, and deploy highly customizable context menus to mutate shape properties dynamically.

## Prerequisites

Complete the [Quick Start](./quick-start.md) guide to integrate the `<kritzel-editor>` component into your Angular project.

---

## How Agile Planning Boards Work

Building a highly response agile board requires coordinating several spatial and structural APIs:

1. **Unselectable Column Tracks:** Columns such as "What Went Well" or "Done" are drawn as static `KritzelShape` background panels with their `isEditable` property set to `false`, preventing users from grabbing or moving board swimlanes.
2. **Text-Overlaid Sticky Cards:** Cards are modeled using a block `KritzelShape` representing the post-it paper, and a multi-line `KritzelText` overlaying the copy. Programmatic grouping via `group()` ensures that both elements stay conjoined as a single entity when dragged or repositioned.
3. **Task Connector Lines:** Relationships or dependencies between retro notes are plotted with `KritzelLine`, utilizing the `arrows` property to draw directed dependency pointers.
4. **Conditional WHITEBOARD Context Menus:** Whiteboard actions are injected into `objectContextMenuItems` and `globalContextMenuItems` and filtered at runtime using `visible()` predicates, ensuring color customization or alignment controls are only displayed when appropriate shapes are highlighted.

---

## Collaborative Board Seeding

Before retrospective facilitators or developers start placing visual sticky notes, an automated initialization process renders the column layouts, column label text elements, and initial test sticky nodes. 

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/agile-retro"
  repoFiles={['src/app/examples/agile-retro/agile-retro.component.ts']}
/>

Static background lanes and column titles are created first by initializing them with `isEditable = false`. By restricting editability, they become unselectable scenery elements, allowing team members to highlight or sketch on cards nested on top of the boundaries. Next, we seed default sticky cards by creating card bodies with a solid fill color and placing `KritzelText` labels centrally on top of them.

---

## Dynamic Shape Alignment and Grouping

Distributed teams often need to tidy up cluttered boards by stacking card piles, aligning swimlane elements horizontally, or binding shapes into cohesive visual groups. This panel leverages the grouping and custom canvas alignment APIs.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/agile-retro"
  repoFiles={['src/app/examples/agile-retro/agile-retro.component.ts']}
/>

To programmatically fuse a paper card body with its text caption, we select both elements using `this.editor.selectObjects([shape, text])` and execute `this.editor.group()`. The editor combines these instances into a unified `KritzelGroup`. When users need to align scattered items, calling `this.editor.alignObjects(KritzelAlignment.CenterHorizontal)` evaluates selected object bounds and neatly positions them programmatically.

---

## Custom Context-Sensitive Menus

Custom interaction menus offer highly tailored whiteboard options (e.g. changing sticky colors to match columns, or grouping items on right-click) while gracefully suppressing unrelated engine options.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/agile-retro"
  repoFiles={['src/app/examples/agile-retro/agile-retro.component.ts']}
/>

The `objectContextMenuItems` property overrides the global default right-click menu with tailored, nested menus like "Change Sticky Color" or "Align Selected Cards". Submenus are defined seamlessly using the `children` array property on menu models. We use the custom `visible` and `disabled` predicates on these structures to ensure options such as color modification are hidden when lines or non-sticky files are selected.

---
