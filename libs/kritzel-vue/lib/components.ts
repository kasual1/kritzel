/* eslint-disable */
/* tslint:disable */
/* auto-generated vue proxies */
import { defineContainer, type StencilVueComponent } from '@stencil/vue-output-target/runtime';

import type { JSX } from '../../kritzel-stencil/dist/components';

import { defineCustomElement as defineKritzelEditor } from '../../kritzel-stencil/dist/components/kritzel-editor.js';
import { defineCustomElement as defineKritzelSplitButton } from '../../kritzel-stencil/dist/components/kritzel-split-button.js';
import { defineCustomElement as defineKritzelWorkspaceManager } from '../../kritzel-stencil/dist/components/kritzel-workspace-manager.js';


export const KritzelEditor: StencilVueComponent<JSX.KritzelEditor> = /*@__PURE__*/ defineContainer<JSX.KritzelEditor>('kritzel-editor', defineKritzelEditor, [
  'scaleMax',
  'scaleMin',
  'controls',
  'globalContextMenuItems',
  'objectContextMenuItems',
  'customSvgIcons',
  'isControlsVisible',
  'isUtilityPanelVisible',
  'isReady'
], [
  'isReady'
]);


export const KritzelSplitButton: StencilVueComponent<JSX.KritzelSplitButton> = /*@__PURE__*/ defineContainer<JSX.KritzelSplitButton>('kritzel-split-button', defineKritzelSplitButton, [
  'buttonText',
  'buttonIcon',
  'dropdownIcon',
  'options',
  'disabled',
  'buttonClick',
  'optionSelect'
], [
  'buttonClick',
  'optionSelect'
]);


export const KritzelWorkspaceManager: StencilVueComponent<JSX.KritzelWorkspaceManager> = /*@__PURE__*/ defineContainer<JSX.KritzelWorkspaceManager>('kritzel-workspace-manager', defineKritzelWorkspaceManager, [
  'create',
  'select'
], [
  'create',
  'select'
]);

