---
sidebar_label: Tools
displayed_sidebar: tutorialSidebar
---

# Understanding Tools

In Kritzel, a Tool represents an active state that determines how user input (like mouse clicks, touches, and pen strokes) behaves on the canvas. 

Because Kritzel is a state machine, only one tool can be active at a time. The active tool intercepts all pointer events and executes its specific logic.

## Built-in Tools

Kritzel ships with a versatile set of default tools:
- **Selection Tool:** Allows moving, resizing, and rotating objects.
- **Brush Tool:** Captures freehand pointer movements to generate smooth, variable-width SVG paths.
- **Line Tool:** Creates connecting lines.
- **Shape Tool:** Creates geometric primitives.
- **Text Tool:** Handles rich text input.
- **Image Tool:** Handles external media insertion.
- **Eraser Tool:** Removes stroked paths upon intersection.

## How Tools Work

When a user interacts with the canvas, the `<kritzel-engine>` delegates the events to the currently active tool. For example, if the **Brush Tool** is active, moving the pointer will create coordinates for a `KritzelPath`. If the **Selection Tool** is active, the exact same pointer movement will box-select existing objects or translate them.

## Custom Tools

One of Kritzel's most powerful concepts is its extensibility. If the built-in tools don't meet your needs, you can extend the `KritzelBaseTool` class to create entirely new behaviors. 

By registering a custom tool and switching to it, your custom logic can seamlessly take over pointer tracking, object creation, and canvas interaction.
