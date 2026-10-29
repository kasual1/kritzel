/**
 * @fileoverview entry point for your component library
 *
 * This is the entry point for your component library. Use this file to export utilities,
 * constants or data structure that accompany your components.
 *
 * DO NOT use this file to export your components. Instead, use the recommended approaches
 * to consume components of this package as outlined in the `README.md`.
 */

export type * from './components';

export type HTMLKritzelEngineElement = HTMLElementTagNameMap['kritzel-engine'];

// The engine's classes, helpers and types live in @kritzel/core. Re-exporting them keeps
// existing `@kritzel/engine` imports working and shares one copy of every class.
export * from '@kritzel/core';
