/* eslint-disable */
/* tslint:disable */
/* auto-generated vue proxies */
import { defineContainer, type StencilVueComponent } from '@stencil/vue-output-target/runtime';

import type { JSX } from '@kritzel/editor/dist/components';

import { defineCustomElement as defineKritzelEditor } from '@kritzel/editor/dist/components/kritzel-editor.js';
import { defineCustomElement as defineKritzelSettings } from '@kritzel/editor/dist/components/kritzel-settings.js';
import { defineCustomElement as defineKritzelShapeFill } from '@kritzel/editor/dist/components/kritzel-shape-fill.js';
import { defineCustomElement as defineKritzelShareDialog } from '@kritzel/editor/dist/components/kritzel-share-dialog.js';
import { defineCustomElement as defineKritzelSplitButton } from '@kritzel/editor/dist/components/kritzel-split-button.js';
import { defineCustomElement as defineKritzelStrokeSize } from '@kritzel/editor/dist/components/kritzel-stroke-size.js';


export const KritzelEditor: StencilVueComponent<JSX.KritzelEditor> = /*@__PURE__*/ defineContainer<JSX.KritzelEditor>('kritzel-editor', defineKritzelEditor, [
  'scaleMax',
  'scaleMin',
  'lockDrawingScale',
  'viewportBoundaryLeft',
  'viewportBoundaryRight',
  'viewportBoundaryTop',
  'viewportBoundaryBottom',
  'debugInfo',
  'user',
  'activeUsers',
  'toolbarItems',
  'globalContextMenuItems',
  'objectContextMenuItems',
  'moreMenuItems',
  'themes',
  'theme',
  'licenseKey',
  'locale',
  'locales',
  'fallbackLocale',
  'customSvgIcons',
  'customFonts',
  'isPanningEnabled',
  'isZoomingEnabled',
  'isToolbarVisible',
  'isUtilityPanelVisible',
  'isWorkspaceManagerVisible',
  'isMoreMenuVisible',
  'isZoomPanelVisible',
  'syncConfig',
  'assetStorageConfig',
  'cursorTarget',
  'loginConfig',
  'editorId',
  'activeWorkspaceId',
  'workspaces',
  'isReady',
  'activeWorkspaceChange',
  'objectsChange',
  'objectsAdded',
  'objectsRemoved',
  'objectsUpdated',
  'objectsSelectionChange',
  'undoStateChange',
  'themeChange',
  'localeChange',
  'viewportChange',
  'logout',
  'login',
  'isPublicChange',
  'awarenessChange'
], [
  'isReady',
  'activeWorkspaceChange',
  'objectsChange',
  'objectsAdded',
  'objectsRemoved',
  'objectsUpdated',
  'objectsSelectionChange',
  'undoStateChange',
  'themeChange',
  'localeChange',
  'viewportChange',
  'logout',
  'login',
  'isPublicChange',
  'awarenessChange'
]);


export const KritzelSettings: StencilVueComponent<JSX.KritzelSettings> = /*@__PURE__*/ defineContainer<JSX.KritzelSettings>('kritzel-settings', defineKritzelSettings, [
  'availableThemes',
  'availableLocales',
  'shortcuts',
  'terms',
  'settings',
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


export const KritzelShareDialog: StencilVueComponent<JSX.KritzelShareDialog> = /*@__PURE__*/ defineContainer<JSX.KritzelShareDialog>('kritzel-share-dialog', defineKritzelShareDialog, [
  'isPublic',
  'workspaceId',
  'terms',
  'toggleIsPublic',
  'dialogClosed'
], [
  'toggleIsPublic',
  'dialogClosed'
]);


export const KritzelSplitButton: StencilVueComponent<JSX.KritzelSplitButton> = /*@__PURE__*/ defineContainer<JSX.KritzelSplitButton>('kritzel-split-button', defineKritzelSplitButton, [
  'buttonIcon',
  'dropdownIcon',
  'items',
  'mainButtonDisabled',
  'menuButtonDisabled',
  'mainButtonClick',
  'itemSelect',
  'itemSave',
  'itemCancel',
  'itemToggleChildMenu',
  'itemCloseChildMenu',
  'menuOpen',
  'menuClose'
], [
  'mainButtonClick',
  'itemSelect',
  'itemSave',
  'itemCancel',
  'itemToggleChildMenu',
  'itemCloseChildMenu',
  'menuOpen',
  'menuClose'
]);


export const KritzelStrokeSize: StencilVueComponent<JSX.KritzelStrokeSize> = /*@__PURE__*/ defineContainer<JSX.KritzelStrokeSize>('kritzel-stroke-size', defineKritzelStrokeSize, [
  'sizes',
  'selectedSize',
  'sizeChange'
], [
  'sizeChange'
]);

