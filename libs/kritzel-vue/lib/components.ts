/* eslint-disable */
/* tslint:disable */
/* auto-generated vue proxies */
import { defineContainer, type StencilVueComponent } from '@stencil/vue-output-target/runtime';

import type { JSX } from '../../kritzel-stencil/dist/components';

import { defineCustomElement as defineKritzelEditor } from '../../kritzel-stencil/dist/components/kritzel-editor.js';
import { defineCustomElement as defineKritzelMenuItem } from '../../kritzel-stencil/dist/components/kritzel-menu-item.js';
import { defineCustomElement as defineKritzelMenuNew } from '../../kritzel-stencil/dist/components/kritzel-menu-new.js';


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
  'item',
  'isSelected',
  'isEditing',
  'isDisabled',
  'parent',
  'itemSelect',
  'save',
  'cancel',
  'childOpen'
], [
  'itemSelect',
  'save',
  'cancel',
  'childOpen'
]);


export const KritzelMenuNew: StencilVueComponent<JSX.KritzelMenuNew> = /*@__PURE__*/ defineContainer<JSX.KritzelMenuNew>('kritzel-menu-new', defineKritzelMenuNew, [
  'items',
  'itemSelect',
  'close'
], [
  'itemSelect',
  'close'
]);

