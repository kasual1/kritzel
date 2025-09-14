/* eslint-disable */
/* tslint:disable */
/* auto-generated vue proxies */
import { defineContainer, type StencilVueComponent } from '@stencil/vue-output-target/runtime';

import type { JSX } from '../../kritzel-stencil/dist/components';

import { defineCustomElement as defineKritzelEditor } from '../../kritzel-stencil/dist/components/kritzel-editor.js';
import { defineCustomElement as defineKritzelMenuItem } from '../../kritzel-stencil/dist/components/kritzel-menu-item.js';


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


export const KritzelMenuItem: StencilVueComponent<JSX.KritzelMenuItem> = /*@__PURE__*/ defineContainer<JSX.KritzelMenuItem>('kritzel-menu-item', defineKritzelMenuItem, [
  'label',
  'isSelected',
  'isEditing',
  'isDisabled',
  'save',
  'cancel'
], [
  'save',
  'cancel'
]);

