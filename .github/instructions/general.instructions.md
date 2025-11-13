### Project Overview
Kritzel is a component library for creating interactive sketches and drawings in web applications on an infinite canvas. It provides a simple API for handling user input, rendering graphics, and managing state.
It is built with Stencil and has wrappers for Angular, React, and Vue.

### General Folder Structure
Kritzel is a monorepo containing the core library and its framework-specific wrappers. The core functionality is built with Stencil, and wrappers are provided for Angular, React, and Vue.

- **`libs/kritzel-stencil`**: The core Stencil library where most of the business logic resides.
- **`libs/kritzel-angular`**, **`libs/kritzel-react`**, **`libs/kritzel-vue`**: Framework-specific wrapper libraries.
- **`demos/*`**: Demo applications for each framework, useful for testing and showcasing features.
- **`website`**: The Docusaurus-based documentation website.
- **`server/websocket-demo`**: A NestJS-based WebSocket server for demoing real-time collaboration features.

### Stencil Folder Structure
The core Stencil library follows a structured approach to organize its components, classes, and utilities.

- **`src/classes`**: Houses TypeScript classes that encapsulate core logic and functionality of the library.
    - **`src/classes/tools`**: Contains classes for different drawing tools (e.g., pencil, eraser, text, image).
    - **`src/classes/objects`**: Contains classes for different drawable objects (e.g., objects, images, text elements).
    - **`src/classes/handlers`**: Contains event handlers for user interactions.
    - **`src/classes/structures`**: Contains data structures for efficiently managing objects rendered on the canvas.
    - **`src/classes/registries`**: Contains registries allowing dynamic registration of tools, icons, fonts etc.
    - **`src/classes/core`**: Contains core classes and utilities that are used throughout the library.
        - **`src/classes/core/store`**: Contains classes and utilities for state management.
        - **`src/classes/core/viewport`**: Contains classes and utilities for managing the canvas viewport.
        - **`src/classes/core/workspace`**: Contains classes and utilities for managing the workspace.
        - **`src/classes/core/core`**: Encapsulates core functionalities like database, history, store, viewport.
        - **`src/classes/core/yjs-document`**: Contains classes and utilities for collaborative features and persisting data to indexeddb using Yjs.
- **`src/components`**: Contains all Stencil components, each in its own folder with related files (e.g., `.tsx`, `.css`, `.spec.ts`).
- **`src/configs`**: Contains default configuration files for tools, objects, and the core library.
- **`src/helpers`**: Contains utility functions and helpers used across the library.
- **`src/interfaces`**: Contains TypeScript interfaces and types for type safety and code clarity.

### Coding Conventions
- Follow consistent naming conventions for files, classes, methods, and variables.
- All classes inside `libs/kritzel-stencil` should be prefixed with `Kritzel` but their filenames should not have the prefix.

