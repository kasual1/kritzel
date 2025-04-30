/* eslint-disable */
/* tslint:disable */
/* auto-generated vue proxies */
import { defineContainer, type StencilVueComponent } from '@stencil/vue-output-target/runtime';

import type { JSX } from '../../kritzel-stencil/dist/components';

import { defineCustomElement as defineKritzelColorPalette } from '../../kritzel-stencil/dist/components/kritzel-color-palette.js';
import { defineCustomElement as defineKritzelControls } from '../../kritzel-stencil/dist/components/kritzel-controls.js';
import { defineCustomElement as defineKritzelEditor } from '../../kritzel-stencil/dist/components/kritzel-editor.js';
import { defineCustomElement as defineKritzelEngine } from '../../kritzel-stencil/dist/components/kritzel-engine.js';
import { defineCustomElement as defineKritzelIcon } from '../../kritzel-stencil/dist/components/kritzel-icon.js';


export const KritzelColorPalette: StencilVueComponent<JSX.KritzelColorPalette> = /*@__PURE__*/ defineContainer<JSX.KritzelColorPalette>('kritzel-color-palette', defineKritzelColorPalette, [
  'colors',
  'selectedColor',
  'colorChange'
], [
  'colorChange'
]);


export const KritzelControls: StencilVueComponent<JSX.KritzelControls> = /*@__PURE__*/ defineContainer<JSX.KritzelControls>('kritzel-controls', defineKritzelControls, [
  'controls',
  'selectedControl'
]);


export const KritzelEditor: StencilVueComponent<JSX.KritzelEditor> = /*@__PURE__*/ defineContainer<JSX.KritzelEditor>('kritzel-editor', defineKritzelEditor);


export const KritzelEngine: StencilVueComponent<JSX.KritzelEngine> = /*@__PURE__*/ defineContainer<JSX.KritzelEngine>('kritzel-engine', defineKritzelEngine, [
  'activeTool',
  'activeToolChange'
], [
  'activeToolChange'
]);


export const KritzelIcon: StencilVueComponent<JSX.KritzelIcon> = /*@__PURE__*/ defineContainer<JSX.KritzelIcon>('kritzel-icon', defineKritzelIcon, [
  'name',
  'label'
]);

