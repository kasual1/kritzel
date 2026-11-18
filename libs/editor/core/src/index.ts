/**
 * Entry point for the Upmade editor component package.
 *
 * Components are consumed through the generated custom elements or framework
 * wrappers. Engine classes and types remain available from @upmade/engine, which
 * re-exports @upmade/core.
 */

export type * from './components';

export type HTMLUpmadeEditorElement = HTMLElementTagNameMap['upmade-editor'];
