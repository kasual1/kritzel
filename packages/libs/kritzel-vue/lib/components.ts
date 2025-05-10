/* eslint-disable */
/* tslint:disable */
/* auto-generated vue proxies */
import { defineContainer, type StencilVueComponent } from '@stencil/vue-output-target/runtime';

import type { JSX } from '../../kritzel-stencil/dist/components';

import { defineCustomElement as defineKritzelColorPalette } from '../../kritzel-stencil/dist/components/kritzel-color-palette.js';
import { defineCustomElement as defineKritzelContextMenu } from '../../kritzel-stencil/dist/components/kritzel-context-menu.js';
import { defineCustomElement as defineKritzelControls } from '../../kritzel-stencil/dist/components/kritzel-controls.js';
import { defineCustomElement as defineKritzelCursorTrail } from '../../kritzel-stencil/dist/components/kritzel-cursor-trail.js';
import { defineCustomElement as defineKritzelEditor } from '../../kritzel-stencil/dist/components/kritzel-editor.js';
import { defineCustomElement as defineKritzelEngine } from '../../kritzel-stencil/dist/components/kritzel-engine.js';
import { defineCustomElement as defineKritzelFontFamily } from '../../kritzel-stencil/dist/components/kritzel-font-family.js';
import { defineCustomElement as defineKritzelFontSize } from '../../kritzel-stencil/dist/components/kritzel-font-size.js';
import { defineCustomElement as defineKritzelIcon } from '../../kritzel-stencil/dist/components/kritzel-icon.js';
import { defineCustomElement as defineKritzelStrokeSize } from '../../kritzel-stencil/dist/components/kritzel-stroke-size.js';


export const KritzelColorPalette: StencilVueComponent<JSX.KritzelColorPalette> = /*@__PURE__*/ defineContainer<JSX.KritzelColorPalette>('kritzel-color-palette', defineKritzelColorPalette, [
  'colors',
  'selectedColor',
  'colorChange'
], [
  'colorChange'
]);


export const KritzelContextMenu: StencilVueComponent<JSX.KritzelContextMenu> = /*@__PURE__*/ defineContainer<JSX.KritzelContextMenu>('kritzel-context-menu', defineKritzelContextMenu, [
  'items',
  'actionSelected'
], [
  'actionSelected'
]);


export const KritzelControls: StencilVueComponent<JSX.KritzelControls> = /*@__PURE__*/ defineContainer<JSX.KritzelControls>('kritzel-controls', defineKritzelControls, [
  'controls',
  'activeControl'
]);


export const KritzelCursorTrail: StencilVueComponent<JSX.KritzelCursorTrail> = /*@__PURE__*/ defineContainer<JSX.KritzelCursorTrail>('kritzel-cursor-trail', defineKritzelCursorTrail);


export const KritzelEditor: StencilVueComponent<JSX.KritzelEditor> = /*@__PURE__*/ defineContainer<JSX.KritzelEditor>('kritzel-editor', defineKritzelEditor, [
  'controls',
  'customSvgIcons'
]);


export const KritzelEngine: StencilVueComponent<JSX.KritzelEngine> = /*@__PURE__*/ defineContainer<JSX.KritzelEngine>('kritzel-engine', defineKritzelEngine, [
  'activeTool',
  'globalContextMenuItems',
  'objectContextMenuItems',
  'activeToolChange'
], [
  'activeToolChange'
]);


export const KritzelFontFamily: StencilVueComponent<JSX.KritzelFontFamily> = /*@__PURE__*/ defineContainer<JSX.KritzelFontFamily>('kritzel-font-family', defineKritzelFontFamily);


export const KritzelFontSize: StencilVueComponent<JSX.KritzelFontSize> = /*@__PURE__*/ defineContainer<JSX.KritzelFontSize>('kritzel-font-size', defineKritzelFontSize, [
  'sizes',
  'selectedSize',
  'sizeChange'
], [
  'sizeChange'
]);


export const KritzelIcon: StencilVueComponent<JSX.KritzelIcon> = /*@__PURE__*/ defineContainer<JSX.KritzelIcon>('kritzel-icon', defineKritzelIcon, [
  'name',
  'label',
  'size'
]);


export const KritzelStrokeSize: StencilVueComponent<JSX.KritzelStrokeSize> = /*@__PURE__*/ defineContainer<JSX.KritzelStrokeSize>('kritzel-stroke-size', defineKritzelStrokeSize, [
  'sizes',
  'selectedSize',
  'sizeChange'
], [
  'sizeChange'
]);

