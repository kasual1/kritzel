/* eslint-disable */
/* tslint:disable */
/* auto-generated vue proxies */
import { defineContainer, type StencilVueComponent } from '@stencil/vue-output-target/runtime';

import type { JSX } from '../../kritzel-stencil/dist/components';

import { defineCustomElement as defineKritzelAwarenessCursors } from '../../kritzel-stencil/dist/components/kritzel-awareness-cursors.js';
import { defineCustomElement as defineKritzelBackToContent } from '../../kritzel-stencil/dist/components/kritzel-back-to-content.js';
import { defineCustomElement as defineKritzelButton } from '../../kritzel-stencil/dist/components/kritzel-button.js';
import { defineCustomElement as defineKritzelCurrentUserDialog } from '../../kritzel-stencil/dist/components/kritzel-current-user-dialog.js';
import { defineCustomElement as defineKritzelDialog } from '../../kritzel-stencil/dist/components/kritzel-dialog.js';
import { defineCustomElement as defineKritzelEditor } from '../../kritzel-stencil/dist/components/kritzel-editor.js';
import { defineCustomElement as defineKritzelEngine } from '../../kritzel-stencil/dist/components/kritzel-engine.js';
import { defineCustomElement as defineKritzelExport } from '../../kritzel-stencil/dist/components/kritzel-export.js';
import { defineCustomElement as defineKritzelInput } from '../../kritzel-stencil/dist/components/kritzel-input.js';
import { defineCustomElement as defineKritzelLineEndings } from '../../kritzel-stencil/dist/components/kritzel-line-endings.js';
import { defineCustomElement as defineKritzelLoadingOverlay } from '../../kritzel-stencil/dist/components/kritzel-loading-overlay.js';
import { defineCustomElement as defineKritzelLoginDialog } from '../../kritzel-stencil/dist/components/kritzel-login-dialog.js';
import { defineCustomElement as defineKritzelMasterDetail } from '../../kritzel-stencil/dist/components/kritzel-master-detail.js';
import { defineCustomElement as defineKritzelNotificationCard } from '../../kritzel-stencil/dist/components/kritzel-notification-card.js';
import { defineCustomElement as defineKritzelNumericInput } from '../../kritzel-stencil/dist/components/kritzel-numeric-input.js';
import { defineCustomElement as defineKritzelOpacitySlider } from '../../kritzel-stencil/dist/components/kritzel-opacity-slider.js';
import { defineCustomElement as defineKritzelPillTabs } from '../../kritzel-stencil/dist/components/kritzel-pill-tabs.js';
import { defineCustomElement as defineKritzelSettings } from '../../kritzel-stencil/dist/components/kritzel-settings.js';
import { defineCustomElement as defineKritzelSyncIndicator } from '../../kritzel-stencil/dist/components/kritzel-sync-indicator.js';
import { defineCustomElement as defineKritzelWatermark } from '../../kritzel-stencil/dist/components/kritzel-watermark.js';
import { defineCustomElement as defineKritzelZoomPanel } from '../../kritzel-stencil/dist/components/kritzel-zoom-panel.js';


export const KritzelAwarenessCursors: StencilVueComponent<JSX.KritzelAwarenessCursors> = /*@__PURE__*/ defineContainer<JSX.KritzelAwarenessCursors>('kritzel-awareness-cursors', defineKritzelAwarenessCursors, [
  'core',
  'showEdgeIndicators',
  'edgeIndicatorPadding'
]);


export const KritzelBackToContent: StencilVueComponent<JSX.KritzelBackToContent> = /*@__PURE__*/ defineContainer<JSX.KritzelBackToContent>('kritzel-back-to-content', defineKritzelBackToContent, [
  'visible',
  'text',
  'backToContent'
], [
  'backToContent'
]);


export const KritzelButton: StencilVueComponent<JSX.KritzelButton> = /*@__PURE__*/ defineContainer<JSX.KritzelButton>('kritzel-button', defineKritzelButton, [
  'variant',
  'disabled',
  'type',
  'buttonClick'
], [
  'buttonClick'
]);


export const KritzelCurrentUserDialog: StencilVueComponent<JSX.KritzelCurrentUserDialog> = /*@__PURE__*/ defineContainer<JSX.KritzelCurrentUserDialog>('kritzel-current-user-dialog', defineKritzelCurrentUserDialog, [
  'user',
  'terms',
  'logoutRequest'
], [
  'logoutRequest'
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
  'contained',
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
  'viewportBoundaryLeft',
  'viewportBoundaryRight',
  'viewportBoundaryTop',
  'viewportBoundaryBottom',
  'debugInfo',
  'user',
  'activeUsers',
  'controls',
  'globalContextMenuItems',
  'objectContextMenuItems',
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
  'isControlsVisible',
  'isUtilityPanelVisible',
  'isWorkspaceManagerVisible',
  'isMoreMenuVisible',
  'isZoomPanelVisible',
  'isObjectDistanceFadingActive',
  'syncConfig',
  'assetStorageConfig',
  'cursorTarget',
  'loginConfig',
  'isLoading',
  'editorId',
  'activeWorkspaceId',
  'isReady',
  'activeWorkspaceChange',
  'objectsChange',
  'objectsAdded',
  'objectsRemoved',
  'objectsUpdated',
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
  'undoStateChange',
  'themeChange',
  'localeChange',
  'viewportChange',
  'logout',
  'login',
  'isPublicChange',
  'awarenessChange'
]);


export const KritzelEngine: StencilVueComponent<JSX.KritzelEngine> = /*@__PURE__*/ defineContainer<JSX.KritzelEngine>('kritzel-engine', defineKritzelEngine, [
  'workspace',
  'editorId',
  'activeWorkspaceId',
  'syncConfig',
  'assetStorageConfig',
  'user',
  'globalContextMenuItems',
  'objectContextMenuItems',
  'scaleMax',
  'scaleMin',
  'cursorTarget',
  'lockDrawingScale',
  'isObjectDistanceFadingActive',
  'theme',
  'licenseKey',
  'themes',
  'locale',
  'locales',
  'fallbackLocale',
  'viewportBoundaryLeft',
  'viewportBoundaryRight',
  'viewportBoundaryTop',
  'viewportBoundaryBottom',
  'debugInfo',
  'isPanningEnabled',
  'isZoomingEnabled',
  'isLoading',
  'isEngineReady',
  'activeToolChange',
  'objectsSelectionChange',
  'workspacesChange',
  'activeWorkspaceChange',
  'longpress',
  'objectsChange',
  'objectsAdded',
  'objectsRemoved',
  'objectsUpdated',
  'undoStateChange',
  'objectsInViewportChange',
  'viewportChange',
  'awarenessChange',
  'notificationsChange',
  'contextMenuStateChange',
  'loadingChange',
  'syncingChange'
], [
  'isEngineReady',
  'activeToolChange',
  'objectsSelectionChange',
  'workspacesChange',
  'activeWorkspaceChange',
  'longpress',
  'objectsChange',
  'objectsAdded',
  'objectsRemoved',
  'objectsUpdated',
  'undoStateChange',
  'objectsInViewportChange',
  'viewportChange',
  'awarenessChange',
  'notificationsChange',
  'contextMenuStateChange',
  'loadingChange',
  'syncingChange'
]);


export const KritzelExport: StencilVueComponent<JSX.KritzelExport> = /*@__PURE__*/ defineContainer<JSX.KritzelExport>('kritzel-export', defineKritzelExport, [
  'workspaceName',
  'terms',
  'exportPng',
  'exportSvg',
  'exportJson'
], [
  'exportPng',
  'exportSvg',
  'exportJson'
]);


export const KritzelInput: StencilVueComponent<JSX.KritzelInput> = /*@__PURE__*/ defineContainer<JSX.KritzelInput>('kritzel-input', defineKritzelInput, [
  'value',
  'label',
  'placeholder',
  'suffix',
  'type',
  'disabled',
  'valueChange'
], [
  'valueChange'
]);


export const KritzelLineEndings: StencilVueComponent<JSX.KritzelLineEndings> = /*@__PURE__*/ defineContainer<JSX.KritzelLineEndings>('kritzel-line-endings', defineKritzelLineEndings, [
  'styles',
  'value',
  'valueChange'
], [
  'valueChange'
]);


export const KritzelLoadingOverlay: StencilVueComponent<JSX.KritzelLoadingOverlay> = /*@__PURE__*/ defineContainer<JSX.KritzelLoadingOverlay>('kritzel-loading-overlay', defineKritzelLoadingOverlay, [
  'visible',
  'text'
]);


export const KritzelLoginDialog: StencilVueComponent<JSX.KritzelLoginDialog> = /*@__PURE__*/ defineContainer<JSX.KritzelLoginDialog>('kritzel-login-dialog', defineKritzelLoginDialog, [
  'providers',
  'dialogTitle',
  'subtitle',
  'providerLogin',
  'dialogClosed'
], [
  'providerLogin',
  'dialogClosed'
]);


export const KritzelMasterDetail: StencilVueComponent<JSX.KritzelMasterDetail> = /*@__PURE__*/ defineContainer<JSX.KritzelMasterDetail>('kritzel-master-detail', defineKritzelMasterDetail, [
  'items',
  'selectedItemId',
  'itemSelect'
], [
  'itemSelect'
]);


export const KritzelNotificationCard: StencilVueComponent<JSX.KritzelNotificationCard> = /*@__PURE__*/ defineContainer<JSX.KritzelNotificationCard>('kritzel-notification-card', defineKritzelNotificationCard, [
  'notification',
  'showTimestamp',
  'locale',
  'dismiss',
  'hoverChange'
], [
  'dismiss',
  'hoverChange'
]);


export const KritzelNumericInput: StencilVueComponent<JSX.KritzelNumericInput> = /*@__PURE__*/ defineContainer<JSX.KritzelNumericInput>('kritzel-numeric-input', defineKritzelNumericInput, [
  'value',
  'min',
  'max',
  'step',
  'label',
  'placeholder',
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


export const KritzelPillTabs: StencilVueComponent<JSX.KritzelPillTabs> = /*@__PURE__*/ defineContainer<JSX.KritzelPillTabs>('kritzel-pill-tabs', defineKritzelPillTabs, [
  'tabs',
  'value',
  'valueChange'
], [
  'valueChange'
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


export const KritzelSyncIndicator: StencilVueComponent<JSX.KritzelSyncIndicator> = /*@__PURE__*/ defineContainer<JSX.KritzelSyncIndicator>('kritzel-sync-indicator', defineKritzelSyncIndicator, [
  'visible',
  'text'
]);


export const KritzelWatermark: StencilVueComponent<JSX.KritzelWatermark> = /*@__PURE__*/ defineContainer<JSX.KritzelWatermark>('kritzel-watermark', defineKritzelWatermark, [
  'core',
  'label'
]);


export const KritzelZoomPanel: StencilVueComponent<JSX.KritzelZoomPanel> = /*@__PURE__*/ defineContainer<JSX.KritzelZoomPanel>('kritzel-zoom-panel', defineKritzelZoomPanel, [
  'visible',
  'disabled',
  'zoomPercent',
  'terms',
  'zoomIn',
  'zoomOut'
], [
  'zoomIn',
  'zoomOut'
]);

