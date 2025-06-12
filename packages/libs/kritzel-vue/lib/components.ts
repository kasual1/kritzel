/* eslint-disable */
/* tslint:disable */
/* auto-generated vue proxies */
import { defineContainer, type StencilVueComponent } from '@stencil/vue-output-target/runtime';

import type { JSX } from '../../kritzel-stencil/dist/components';

import { defineCustomElement as defineKritzelBrushStyle } from '../../kritzel-stencil/dist/components/kritzel-brush-style.js';
import { defineCustomElement as defineKritzelColor } from '../../kritzel-stencil/dist/components/kritzel-color.js';
import { defineCustomElement as defineKritzelColorPalette } from '../../kritzel-stencil/dist/components/kritzel-color-palette.js';
import { defineCustomElement as defineKritzelContextMenu } from '../../kritzel-stencil/dist/components/kritzel-context-menu.js';
import { defineCustomElement as defineKritzelControlBrushConfig } from '../../kritzel-stencil/dist/components/kritzel-control-brush-config.js';
import { defineCustomElement as defineKritzelControlTextConfig } from '../../kritzel-stencil/dist/components/kritzel-control-text-config.js';
import { defineCustomElement as defineKritzelControls } from '../../kritzel-stencil/dist/components/kritzel-controls.js';
import { defineCustomElement as defineKritzelCursorTrail } from '../../kritzel-stencil/dist/components/kritzel-cursor-trail.js';
import { defineCustomElement as defineKritzelDropdown } from '../../kritzel-stencil/dist/components/kritzel-dropdown.js';
import { defineCustomElement as defineKritzelEditor } from '../../kritzel-stencil/dist/components/kritzel-editor.js';
import { defineCustomElement as defineKritzelEngine } from '../../kritzel-stencil/dist/components/kritzel-engine.js';
import { defineCustomElement as defineKritzelFont } from '../../kritzel-stencil/dist/components/kritzel-font.js';
import { defineCustomElement as defineKritzelFontFamily } from '../../kritzel-stencil/dist/components/kritzel-font-family.js';
import { defineCustomElement as defineKritzelFontSize } from '../../kritzel-stencil/dist/components/kritzel-font-size.js';
import { defineCustomElement as defineKritzelIcon } from '../../kritzel-stencil/dist/components/kritzel-icon.js';
import { defineCustomElement as defineKritzelStrokeSize } from '../../kritzel-stencil/dist/components/kritzel-stroke-size.js';
import { defineCustomElement as defineKritzelTooltip } from '../../kritzel-stencil/dist/components/kritzel-tooltip.js';
import { defineCustomElement as defineKritzelUtilityPanel } from '../../kritzel-stencil/dist/components/kritzel-utility-panel.js';


export const KritzelBrushStyle: StencilVueComponent<JSX.KritzelBrushStyle> = /*@__PURE__*/ defineContainer<JSX.KritzelBrushStyle>('kritzel-brush-style', defineKritzelBrushStyle, [
  'type',
  'brushOptions',
  'typeChange'
], [
  'typeChange'
]);


export const KritzelColor: StencilVueComponent<JSX.KritzelColor> = /*@__PURE__*/ defineContainer<JSX.KritzelColor>('kritzel-color', defineKritzelColor, [
  'value',
  'size'
]);


export const KritzelColorPalette: StencilVueComponent<JSX.KritzelColorPalette> = /*@__PURE__*/ defineContainer<JSX.KritzelColorPalette>('kritzel-color-palette', defineKritzelColorPalette, [
  'colors',
  'selectedColor',
  'isExpanded',
  'isOpaque',
  'colorChange'
], [
  'colorChange'
]);


export const KritzelContextMenu: StencilVueComponent<JSX.KritzelContextMenu> = /*@__PURE__*/ defineContainer<JSX.KritzelContextMenu>('kritzel-context-menu', defineKritzelContextMenu, [
  'items',
  'actionSelected',
  'close'
], [
  'actionSelected',
  'close'
]);


export const KritzelControlBrushConfig: StencilVueComponent<JSX.KritzelControlBrushConfig> = /*@__PURE__*/ defineContainer<JSX.KritzelControlBrushConfig>('kritzel-control-brush-config', defineKritzelControlBrushConfig, [
  'tool',
  'isExpanded',
  'toolChange'
], [
  'toolChange'
]);


export const KritzelControlTextConfig: StencilVueComponent<JSX.KritzelControlTextConfig> = /*@__PURE__*/ defineContainer<JSX.KritzelControlTextConfig>('kritzel-control-text-config', defineKritzelControlTextConfig, [
  'tool',
  'isExpanded',
  'toolChange'
], [
  'toolChange'
]);


export const KritzelControls: StencilVueComponent<JSX.KritzelControls> = /*@__PURE__*/ defineContainer<JSX.KritzelControls>('kritzel-controls', defineKritzelControls, [
  'controls',
  'activeControl',
  'controlsReady'
], [
  'controlsReady'
]);


export const KritzelCursorTrail: StencilVueComponent<JSX.KritzelCursorTrail> = /*@__PURE__*/ defineContainer<JSX.KritzelCursorTrail>('kritzel-cursor-trail', defineKritzelCursorTrail);


export const KritzelDropdown: StencilVueComponent<JSX.KritzelDropdown> = /*@__PURE__*/ defineContainer<JSX.KritzelDropdown>('kritzel-dropdown', defineKritzelDropdown, [
  'options',
  'value',
  'width',
  'selectStyles',
  'valueChanged'
], [
  'valueChanged'
]);


export const KritzelEditor: StencilVueComponent<JSX.KritzelEditor> = /*@__PURE__*/ defineContainer<JSX.KritzelEditor>('kritzel-editor', defineKritzelEditor, [
  'controls',
  'customSvgIcons',
  'hideControls'
]);


export const KritzelEngine: StencilVueComponent<JSX.KritzelEngine> = /*@__PURE__*/ defineContainer<JSX.KritzelEngine>('kritzel-engine', defineKritzelEngine, [
  'activeTool',
  'globalContextMenuItems',
  'objectContextMenuItems',
  'engineReady',
  'activeToolChange'
], [
  'engineReady',
  'activeToolChange'
]);


export const KritzelFont: StencilVueComponent<JSX.KritzelFont> = /*@__PURE__*/ defineContainer<JSX.KritzelFont>('kritzel-font', defineKritzelFont, [
  'fontFamily',
  'size',
  'color'
]);


export const KritzelFontFamily: StencilVueComponent<JSX.KritzelFontFamily> = /*@__PURE__*/ defineContainer<JSX.KritzelFontFamily>('kritzel-font-family', defineKritzelFontFamily, [
  'fontOptions',
  'selectedFontFamily',
  'fontFamilyChange'
], [
  'fontFamilyChange'
]);


export const KritzelFontSize: StencilVueComponent<JSX.KritzelFontSize> = /*@__PURE__*/ defineContainer<JSX.KritzelFontSize>('kritzel-font-size', defineKritzelFontSize, [
  'sizes',
  'selectedSize',
  'fontFamily',
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


export const KritzelTooltip: StencilVueComponent<JSX.KritzelTooltip> = /*@__PURE__*/ defineContainer<JSX.KritzelTooltip>('kritzel-tooltip', defineKritzelTooltip, [
  'isVisible',
  'anchorElement',
  'arrowSize',
  'offsetY'
]);


export const KritzelUtilityPanel: StencilVueComponent<JSX.KritzelUtilityPanel> = /*@__PURE__*/ defineContainer<JSX.KritzelUtilityPanel>('kritzel-utility-panel', defineKritzelUtilityPanel, [
  'undo',
  'redo',
  'delete'
], [
  'undo',
  'redo',
  'delete'
]);

