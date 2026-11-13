/* eslint-disable */
/* tslint:disable */
/* auto-generated vue proxies */
import { defineContainer, type StencilVueComponent } from '@stencil/vue-output-target/runtime';

import type { JSX } from '@updraw/editor/dist/components';

import { defineCustomElement as defineUpdrawChatBox } from '@updraw/editor/dist/components/updraw-chat-box.js';
import { defineCustomElement as defineUpdrawEditor } from '@updraw/editor/dist/components/updraw-editor.js';
import { defineCustomElement as defineUpdrawSettings } from '@updraw/editor/dist/components/updraw-settings.js';
import { defineCustomElement as defineUpdrawShapeFill } from '@updraw/editor/dist/components/updraw-shape-fill.js';
import { defineCustomElement as defineUpdrawShareDialog } from '@updraw/editor/dist/components/updraw-share-dialog.js';
import { defineCustomElement as defineUpdrawSplitButton } from '@updraw/editor/dist/components/updraw-split-button.js';
import { defineCustomElement as defineUpdrawStrokeSize } from '@updraw/editor/dist/components/updraw-stroke-size.js';


export const UpdrawChatBox: StencilVueComponent<JSX.UpdrawChatBox> = /*@__PURE__*/ defineContainer<JSX.UpdrawChatBox>('updraw-chat-box', defineUpdrawChatBox, [
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


export const UpdrawEditor: StencilVueComponent<JSX.UpdrawEditor> = /*@__PURE__*/ defineContainer<JSX.UpdrawEditor>('updraw-editor', defineUpdrawEditor, [
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


export const UpdrawSettings: StencilVueComponent<JSX.UpdrawSettings> = /*@__PURE__*/ defineContainer<JSX.UpdrawSettings>('updraw-settings', defineUpdrawSettings, [
  'availableThemes',
  'availableLocales',
  'shortcuts',
  'terms',
  'settings',
  'settingsChange'
], [
  'settingsChange'
]);


export const UpdrawShapeFill: StencilVueComponent<JSX.UpdrawShapeFill> = /*@__PURE__*/ defineContainer<JSX.UpdrawShapeFill>('updraw-shape-fill', defineUpdrawShapeFill, [
  'value',
  'valueChange'
], [
  'valueChange'
]);


export const UpdrawShareDialog: StencilVueComponent<JSX.UpdrawShareDialog> = /*@__PURE__*/ defineContainer<JSX.UpdrawShareDialog>('updraw-share-dialog', defineUpdrawShareDialog, [
  'isPublic',
  'workspaceId',
  'terms',
  'toggleIsPublic',
  'dialogClosed'
], [
  'toggleIsPublic',
  'dialogClosed'
]);


export const UpdrawSplitButton: StencilVueComponent<JSX.UpdrawSplitButton> = /*@__PURE__*/ defineContainer<JSX.UpdrawSplitButton>('updraw-split-button', defineUpdrawSplitButton, [
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


export const UpdrawStrokeSize: StencilVueComponent<JSX.UpdrawStrokeSize> = /*@__PURE__*/ defineContainer<JSX.UpdrawStrokeSize>('updraw-stroke-size', defineUpdrawStrokeSize, [
  'sizes',
  'selectedSize',
  'sizeChange'
], [
  'sizeChange'
]);

