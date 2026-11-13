/**
 * Entry point for the Updraw editor component package.
 *
 * Components are consumed through the generated custom elements or framework
 * wrappers. Engine classes and types remain available from @updraw/engine, which
 * re-exports @updraw/core.
 */

export type * from './components';

export type HTMLUpdrawEditorElement = HTMLElementTagNameMap['updraw-editor'];
