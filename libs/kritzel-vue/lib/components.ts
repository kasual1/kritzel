/* eslint-disable */
/* tslint:disable */
/* auto-generated vue proxies */
import { defineContainer, type StencilVueComponent } from '@stencil/vue-output-target/runtime';

import type { JSX } from '../../kritzel-stencil/dist/components';

import { defineCustomElement as defineKritzelBackToContent } from '../../kritzel-stencil/dist/components/kritzel-back-to-content.js';
import { defineCustomElement as defineKritzelDialog } from '../../kritzel-stencil/dist/components/kritzel-dialog.js';
import { defineCustomElement as defineKritzelEditor } from '../../kritzel-stencil/dist/components/kritzel-editor.js';
import { defineCustomElement as defineKritzelExport } from '../../kritzel-stencil/dist/components/kritzel-export.js';
import { defineCustomElement as defineKritzelLineEndings } from '../../kritzel-stencil/dist/components/kritzel-line-endings.js';
import { defineCustomElement as defineKritzelMasterDetail } from '../../kritzel-stencil/dist/components/kritzel-master-detail.js';
import { defineCustomElement as defineKritzelMoreMenu } from '../../kritzel-stencil/dist/components/kritzel-more-menu.js';
import { defineCustomElement as defineKritzelNumericInput } from '../../kritzel-stencil/dist/components/kritzel-numeric-input.js';
import { defineCustomElement as defineKritzelOpacitySlider } from '../../kritzel-stencil/dist/components/kritzel-opacity-slider.js';
import { defineCustomElement as defineKritzelSettings } from '../../kritzel-stencil/dist/components/kritzel-settings.js';
import { defineCustomElement as defineKritzelShapeFill } from '../../kritzel-stencil/dist/components/kritzel-shape-fill.js';
import { defineCustomElement as defineKritzelSlideToggle } from '../../kritzel-stencil/dist/components/kritzel-slide-toggle.js';


export const KritzelBackToContent: StencilVueComponent<JSX.KritzelBackToContent> = /*@__PURE__*/ defineContainer<JSX.KritzelBackToContent>('kritzel-back-to-content', defineKritzelBackToContent, [
  'visible',
  'text',
  'backToContent'
], [
  'backToContent'
]);


export const KritzelDialog: StencilVueComponent<JSX.KritzelDialog> = /*@__PURE__*/ defineContainer<JSX.KritzelDialog>('kritzel-dialog', defineKritzelDialog, [
  'isOpen',
  'dialogTitle',
  'closable',
  'closeOnBackdrop',
  'closeOnEscape',
  'autoFocus',
  'trapFocus',
  'size',
  'fullscreenOnMobile',
  'dialogOpen',
  'dialogClose'
], [
  'dialogOpen',
  'dialogClose'
]);


export const KritzelEditor: StencilVueComponent<JSX.KritzelEditor> = /*@__PURE__*/ defineContainer<JSX.KritzelEditor>('kritzel-editor', defineKritzelEditor, [
  'scaleMax',
  'scaleMin',
  'lockDrawingScale',
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


export const KritzelExport: StencilVueComponent<JSX.KritzelExport> = /*@__PURE__*/ defineContainer<JSX.KritzelExport>('kritzel-export', defineKritzelExport, [
  'exportPng',
  'exportSvg'
], [
  'exportPng',
  'exportSvg'
]);


export const KritzelLineEndings: StencilVueComponent<JSX.KritzelLineEndings> = /*@__PURE__*/ defineContainer<JSX.KritzelLineEndings>('kritzel-line-endings', defineKritzelLineEndings, [
  'styles',
  'value',
  'strokeColor',
  'valueChange'
], [
  'valueChange'
]);


export const KritzelMasterDetail: StencilVueComponent<JSX.KritzelMasterDetail> = /*@__PURE__*/ defineContainer<JSX.KritzelMasterDetail>('kritzel-master-detail', defineKritzelMasterDetail, [
  'items',
  'selectedItemId',
  'itemSelect'
], [
  'itemSelect'
]);


export const KritzelMoreMenu: StencilVueComponent<JSX.KritzelMoreMenu> = /*@__PURE__*/ defineContainer<JSX.KritzelMoreMenu>('kritzel-more-menu', defineKritzelMoreMenu, [
  'items',
  'icon',
  'iconSize',
  'offsetY',
  'itemSelect'
], [
  'itemSelect'
]);


export const KritzelNumericInput: StencilVueComponent<JSX.KritzelNumericInput> = /*@__PURE__*/ defineContainer<JSX.KritzelNumericInput>('kritzel-numeric-input', defineKritzelNumericInput, [
  'value',
  'min',
  'max',
  'step',
  'label',
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


export const KritzelSettings: StencilVueComponent<JSX.KritzelSettings> = /*@__PURE__*/ defineContainer<JSX.KritzelSettings>('kritzel-settings', defineKritzelSettings, [
  'settingsChange'
], [
  'settingsChange'
]);


export const KritzelShapeFill: StencilVueComponent<JSX.KritzelShapeFill> = /*@__PURE__*/ defineContainer<JSX.KritzelShapeFill>('kritzel-shape-fill', defineKritzelShapeFill, [
  'value',
  'valueChange'
], [
  'valueChange'
]);


export const KritzelSlideToggle: StencilVueComponent<JSX.KritzelSlideToggle> = /*@__PURE__*/ defineContainer<JSX.KritzelSlideToggle>('kritzel-slide-toggle', defineKritzelSlideToggle, [
  'checked',
  'disabled',
  'label',
  'checkedChange'
], [
  'checkedChange'
]);

