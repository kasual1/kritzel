/* eslint-disable */
/* tslint:disable */
/* auto-generated vue proxies */
import { defineContainer, type StencilVueComponent } from '@stencil/vue-output-target/runtime';

import type { JSX } from '../../kritzel-stencil/dist/components';

import { defineCustomElement as defineKritzelEditor } from '../../kritzel-stencil/dist/components/kritzel-editor.js';
import { defineCustomElement as defineKritzelMenuItem } from '../../kritzel-stencil/dist/components/kritzel-menu-item.js';
import { defineCustomElement as defineKritzelMenuNew } from '../../kritzel-stencil/dist/components/kritzel-menu-new.js';
import { defineCustomElement as defineKritzelPopup } from '../../kritzel-stencil/dist/components/kritzel-popup.js';
import { defineCustomElement as defineKritzelPortalManager } from '../../kritzel-stencil/dist/components/kritzel-portal-manager.js';


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
  'itemSelect',
  'save',
  'cancel'
], [
  'itemSelect',
  'save',
  'cancel'
]);


export const KritzelMenuNew: StencilVueComponent<JSX.KritzelMenuNew> = /*@__PURE__*/ defineContainer<JSX.KritzelMenuNew>('kritzel-menu-new', defineKritzelMenuNew, [
  'items',
  'itemSelect'
], [
  'itemSelect'
]);


export const KritzelPopup: StencilVueComponent<JSX.KritzelPopup> = /*@__PURE__*/ defineContainer<JSX.KritzelPopup>('kritzel-popup', defineKritzelPopup, [
  'isOpen',
  'closeOnOutsideClick',
  'anchorId',
  'position',
  'animation'
]);


export const KritzelPortalManager: StencilVueComponent<JSX.KritzelPortalManager> = /*@__PURE__*/ defineContainer<JSX.KritzelPortalManager>('kritzel-portal-manager', defineKritzelPortalManager);

