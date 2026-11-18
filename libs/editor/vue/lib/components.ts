/* eslint-disable */
/* tslint:disable */
/* auto-generated vue proxies */
import { defineContainer, type StencilVueComponent } from '@stencil/vue-output-target/runtime';

import type { JSX } from '@upmade/editor/dist/components';

import { defineCustomElement as defineUpmadeChatBox } from '@upmade/editor/dist/components/upmade-chat-box.js';
import { defineCustomElement as defineUpmadeEditor } from '@upmade/editor/dist/components/upmade-editor.js';
import { defineCustomElement as defineUpmadeSettings } from '@upmade/editor/dist/components/upmade-settings.js';
import { defineCustomElement as defineUpmadeShapeFill } from '@upmade/editor/dist/components/upmade-shape-fill.js';
import { defineCustomElement as defineUpmadeShareDialog } from '@upmade/editor/dist/components/upmade-share-dialog.js';
import { defineCustomElement as defineUpmadeSplitButton } from '@upmade/editor/dist/components/upmade-split-button.js';
import { defineCustomElement as defineUpmadeStrokeSize } from '@upmade/editor/dist/components/upmade-stroke-size.js';


export const UpmadeChatBox: StencilVueComponent<JSX.UpmadeChatBox> = /*@__PURE__*/ defineContainer<JSX.UpmadeChatBox>('upmade-chat-box', defineUpmadeChatBox, [
  'value',
  'mode',
  'placeholder',
  'disabled',
  'loading',
  'terms',
  'chips',
  'chatSubmit',
  'chatStop',
  'modeChange',
  'chatChipRemove'
], [
  'chatSubmit',
  'chatStop',
  'modeChange',
  'chatChipRemove'
]);


export const UpmadeEditor: StencilVueComponent<JSX.UpmadeEditor> = /*@__PURE__*/ defineContainer<JSX.UpmadeEditor>('upmade-editor', defineUpmadeEditor, [
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
  'isAgentAvatarsVisible',
  'toolbarItems',
  'globalContextMenuItems',
  'objectContextMenuItems',
  'objectConfig',
  'objectTitlebar',
  'moreMenuItems',
  'themes',
  'theme',
  'locale',
  'locales',
  'fallbackLocale',
  'customSvgIcons',
  'customFonts',
  'isPanningEnabled',
  'isZoomingEnabled',
  'isToolbarVisible',
  'isChatBoxVisible',
  'chatBoxMode',
  'isChatBoxLoading',
  'chatBoxChips',
  'chatSession',
  'isUtilityPanelVisible',
  'isWorkspaceManagerVisible',
  'isMoreMenuVisible',
  'isZoomPanelVisible',
  'isWatermarkVisible',
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
  'awarenessChange',
  'chatSubmit',
  'chatStop',
  'chatChipRemove',
  'agentsChange',
  'objectTitlebarAction',
  'objectElementHover',
  'objectElementClick',
  'objectElementPick'
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
  'awarenessChange',
  'chatSubmit',
  'chatStop',
  'chatChipRemove',
  'agentsChange',
  'objectTitlebarAction',
  'objectElementHover',
  'objectElementClick',
  'objectElementPick'
]);


export const UpmadeSettings: StencilVueComponent<JSX.UpmadeSettings> = /*@__PURE__*/ defineContainer<JSX.UpmadeSettings>('upmade-settings', defineUpmadeSettings, [
  'availableThemes',
  'availableLocales',
  'shortcuts',
  'terms',
  'settings',
  'settingsChange'
], [
  'settingsChange'
]);


export const UpmadeShapeFill: StencilVueComponent<JSX.UpmadeShapeFill> = /*@__PURE__*/ defineContainer<JSX.UpmadeShapeFill>('upmade-shape-fill', defineUpmadeShapeFill, [
  'value',
  'valueChange'
], [
  'valueChange'
]);


export const UpmadeShareDialog: StencilVueComponent<JSX.UpmadeShareDialog> = /*@__PURE__*/ defineContainer<JSX.UpmadeShareDialog>('upmade-share-dialog', defineUpmadeShareDialog, [
  'isPublic',
  'workspaceId',
  'terms',
  'toggleIsPublic',
  'dialogClosed'
], [
  'toggleIsPublic',
  'dialogClosed'
]);


export const UpmadeSplitButton: StencilVueComponent<JSX.UpmadeSplitButton> = /*@__PURE__*/ defineContainer<JSX.UpmadeSplitButton>('upmade-split-button', defineUpmadeSplitButton, [
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


export const UpmadeStrokeSize: StencilVueComponent<JSX.UpmadeStrokeSize> = /*@__PURE__*/ defineContainer<JSX.UpmadeStrokeSize>('upmade-stroke-size', defineUpmadeStrokeSize, [
  'sizes',
  'selectedSize',
  'sizeChange'
], [
  'sizeChange'
]);

