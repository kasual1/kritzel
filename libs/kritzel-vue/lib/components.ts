/* eslint-disable */
/* tslint:disable */
/* auto-generated vue proxies */
import { defineContainer, type StencilVueComponent } from '@stencil/vue-output-target/runtime';

import type { JSX } from '../../kritzel-stencil/dist/components';

import { defineCustomElement as defineKritzelControlLineConfig } from '../../kritzel-stencil/dist/components/kritzel-control-line-config.js';
import { defineCustomElement as defineKritzelControlShapeConfig } from '../../kritzel-stencil/dist/components/kritzel-control-shape-config.js';
import { defineCustomElement as defineKritzelEditor } from '../../kritzel-stencil/dist/components/kritzel-editor.js';
import { defineCustomElement as defineKritzelLineEndings } from '../../kritzel-stencil/dist/components/kritzel-line-endings.js';
import { defineCustomElement as defineKritzelOpacitySlider } from '../../kritzel-stencil/dist/components/kritzel-opacity-slider.js';
import { defineCustomElement as defineKritzelShapeFill } from '../../kritzel-stencil/dist/components/kritzel-shape-fill.js';


export const KritzelControlLineConfig: StencilVueComponent<JSX.KritzelControlLineConfig> = /*@__PURE__*/ defineContainer<JSX.KritzelControlLineConfig>('kritzel-control-line-config', defineKritzelControlLineConfig, [
  'tool',
  'isExpanded',
  'toolChange'
], [
  'toolChange'
]);


export const KritzelControlShapeConfig: StencilVueComponent<JSX.KritzelControlShapeConfig> = /*@__PURE__*/ defineContainer<JSX.KritzelControlShapeConfig>('kritzel-control-shape-config', defineKritzelControlShapeConfig, [
  'tool',
  'isExpanded',
  'toolChange'
], [
  'toolChange'
]);


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


export const KritzelLineEndings: StencilVueComponent<JSX.KritzelLineEndings> = /*@__PURE__*/ defineContainer<JSX.KritzelLineEndings>('kritzel-line-endings', defineKritzelLineEndings, [
  'styles',
  'value',
  'strokeColor',
  'valueChange'
], [
  'valueChange'
]);


export const KritzelOpacitySlider: StencilVueComponent<JSX.KritzelOpacitySlider> = /*@__PURE__*/ defineContainer<JSX.KritzelOpacitySlider>('kritzel-opacity-slider', defineKritzelOpacitySlider, [
  'value',
  'min',
  'max',
  'step',
  'previewColor',
  'valueChange'
], [
  'valueChange'
]);


export const KritzelShapeFill: StencilVueComponent<JSX.KritzelShapeFill> = /*@__PURE__*/ defineContainer<JSX.KritzelShapeFill>('kritzel-shape-fill', defineKritzelShapeFill, [
  'value',
  'valueChange'
], [
  'valueChange'
]);

