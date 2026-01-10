/* eslint-disable */
/* tslint:disable */
/* auto-generated vue proxies */
import { defineContainer, type StencilVueComponent } from '@stencil/vue-output-target/runtime';

import type { JSX } from '../../kritzel-stencil/dist/components';

import { defineCustomElement as defineKritzelEditor } from '../../kritzel-stencil/dist/components/kritzel-editor.js';
import { defineCustomElement as defineKritzelShapeFill } from '../../kritzel-stencil/dist/components/kritzel-shape-fill.js';


export const KritzelEditor: StencilVueComponent<JSX.KritzelEditor> = /*@__PURE__*/ defineContainer<JSX.KritzelEditor>('kritzel-editor', defineKritzelEditor, [
  'scaleMax',
  'scaleMin',
  'controls',
  'globalContextMenuItems',
  'objectContextMenuItems',
  'customSvgIcons',
  'isControlsVisible',
  'isUtilityPanelVisible',
  'syncConfig',
  'isReady',
  'objectsChange',
  'undoStateChange'
], [
  'isReady',
  'objectsChange',
  'undoStateChange'
]);


export const KritzelShapeFill: StencilVueComponent<JSX.KritzelShapeFill> = /*@__PURE__*/ defineContainer<JSX.KritzelShapeFill>('kritzel-shape-fill', defineKritzelShapeFill, [
  'value',
  'valueChange'
], [
  'valueChange'
]);

