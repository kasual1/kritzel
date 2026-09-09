/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from 'kritzel-stencil/dist/components';

import { defineCustomElement as defineKritzelAwarenessCursors } from 'kritzel-stencil/dist/components/kritzel-awareness-cursors.js';
import { defineCustomElement as defineKritzelBackToContent } from 'kritzel-stencil/dist/components/kritzel-back-to-content.js';
import { defineCustomElement as defineKritzelButton } from 'kritzel-stencil/dist/components/kritzel-button.js';
import { defineCustomElement as defineKritzelCurrentUserDialog } from 'kritzel-stencil/dist/components/kritzel-current-user-dialog.js';
import { defineCustomElement as defineKritzelDialog } from 'kritzel-stencil/dist/components/kritzel-dialog.js';
import { defineCustomElement as defineKritzelEditor } from 'kritzel-stencil/dist/components/kritzel-editor.js';
import { defineCustomElement as defineKritzelEngine } from 'kritzel-stencil/dist/components/kritzel-engine.js';
import { defineCustomElement as defineKritzelExport } from 'kritzel-stencil/dist/components/kritzel-export.js';
import { defineCustomElement as defineKritzelInput } from 'kritzel-stencil/dist/components/kritzel-input.js';
import { defineCustomElement as defineKritzelLineEndings } from 'kritzel-stencil/dist/components/kritzel-line-endings.js';
import { defineCustomElement as defineKritzelLoadingOverlay } from 'kritzel-stencil/dist/components/kritzel-loading-overlay.js';
import { defineCustomElement as defineKritzelLoginDialog } from 'kritzel-stencil/dist/components/kritzel-login-dialog.js';
import { defineCustomElement as defineKritzelMasterDetail } from 'kritzel-stencil/dist/components/kritzel-master-detail.js';
import { defineCustomElement as defineKritzelNotificationCard } from 'kritzel-stencil/dist/components/kritzel-notification-card.js';
import { defineCustomElement as defineKritzelNumericInput } from 'kritzel-stencil/dist/components/kritzel-numeric-input.js';
import { defineCustomElement as defineKritzelOpacitySlider } from 'kritzel-stencil/dist/components/kritzel-opacity-slider.js';
import { defineCustomElement as defineKritzelPillTabs } from 'kritzel-stencil/dist/components/kritzel-pill-tabs.js';
import { defineCustomElement as defineKritzelSettings } from 'kritzel-stencil/dist/components/kritzel-settings.js';
import { defineCustomElement as defineKritzelWatermark } from 'kritzel-stencil/dist/components/kritzel-watermark.js';
import { defineCustomElement as defineKritzelZoomPanel } from 'kritzel-stencil/dist/components/kritzel-zoom-panel.js';
@ProxyCmp({
  defineCustomElementFn: defineKritzelAwarenessCursors,
  inputs: ['core', 'edgeIndicatorPadding', 'showEdgeIndicators']
})
@Component({
  selector: 'kritzel-awareness-cursors',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: [{ name: 'core', required: true }, 'edgeIndicatorPadding', 'showEdgeIndicators'],
})
export class KritzelAwarenessCursors {
  protected el: HTMLKritzelAwarenessCursorsElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelAwarenessCursors extends Components.KritzelAwarenessCursors {}


@ProxyCmp({
  defineCustomElementFn: defineKritzelBackToContent,
  inputs: ['text', 'visible']
})
@Component({
  selector: 'kritzel-back-to-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['text', 'visible'],
  outputs: ['backToContent'],
})
export class KritzelBackToContent {
  protected el: HTMLKritzelBackToContentElement;
  @Output() backToContent = new EventEmitter<KritzelBackToContentCustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelBackToContentCustomEvent } from 'kritzel-stencil/dist/components';

export declare interface KritzelBackToContent extends Components.KritzelBackToContent {
  /**
   * Emitted when the button is clicked
   */
  backToContent: EventEmitter<KritzelBackToContentCustomEvent<void>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelButton,
  inputs: ['disabled', 'type', 'variant']
})
@Component({
  selector: 'kritzel-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['disabled', 'type', 'variant'],
  outputs: ['buttonClick'],
})
export class KritzelButton {
  protected el: HTMLKritzelButtonElement;
  @Output() buttonClick = new EventEmitter<KritzelButtonCustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelButtonCustomEvent } from 'kritzel-stencil/dist/components';

export declare interface KritzelButton extends Components.KritzelButton {
  /**
   * Emitted when the button is clicked
   */
  buttonClick: EventEmitter<KritzelButtonCustomEvent<void>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelCurrentUserDialog,
  inputs: ['terms', 'user'],
  methods: ['open', 'close']
})
@Component({
  selector: 'kritzel-current-user-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['terms', 'user'],
  outputs: ['logoutRequest'],
})
export class KritzelCurrentUserDialog {
  protected el: HTMLKritzelCurrentUserDialogElement;
  @Output() logoutRequest = new EventEmitter<KritzelCurrentUserDialogCustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelCurrentUserDialogCustomEvent } from 'kritzel-stencil/dist/components';

export declare interface KritzelCurrentUserDialog extends Components.KritzelCurrentUserDialog {
  /**
   * Emitted when the user clicks the logout action.
   */
  logoutRequest: EventEmitter<KritzelCurrentUserDialogCustomEvent<void>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelDialog,
  inputs: ['autoFocus', 'closable', 'closeOnBackdrop', 'closeOnEscape', 'contained', 'dialogTitle', 'fullscreenOnMobile', 'isOpen', 'size', 'trapFocus'],
  methods: ['open', 'close', 'focusFirstElement']
})
@Component({
  selector: 'kritzel-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['autoFocus', 'closable', 'closeOnBackdrop', 'closeOnEscape', 'contained', 'dialogTitle', 'fullscreenOnMobile', 'isOpen', 'size', 'trapFocus'],
  outputs: ['dialogOpen', 'dialogClose'],
})
export class KritzelDialog {
  protected el: HTMLKritzelDialogElement;
  @Output() dialogOpen = new EventEmitter<KritzelDialogCustomEvent<void>>();
  @Output() dialogClose = new EventEmitter<KritzelDialogCustomEvent<IKritzelDialogIKritzelDialogCloseEvent>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelDialogCustomEvent } from 'kritzel-stencil/dist/components';
import type { IKritzelDialogCloseEvent as IKritzelDialogIKritzelDialogCloseEvent } from 'kritzel-stencil/dist/components';

export declare interface KritzelDialog extends Components.KritzelDialog {
  /**
   * Emitted when the dialog opens
   */
  dialogOpen: EventEmitter<KritzelDialogCustomEvent<void>>;
  /**
   * Emitted when the dialog closes
   */
  dialogClose: EventEmitter<KritzelDialogCustomEvent<IKritzelDialogIKritzelDialogCloseEvent>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelEditor,
  inputs: ['activeUsers', 'activeWorkspaceId', 'assetStorageConfig', 'controls', 'cursorTarget', 'customFonts', 'customSvgIcons', 'debugInfo', 'editorId', 'fallbackLocale', 'globalContextMenuItems', 'isControlsVisible', 'isLoading', 'isMoreMenuVisible', 'isObjectDistanceFadingActive', 'isPanningEnabled', 'isUtilityPanelVisible', 'isWorkspaceManagerVisible', 'isZoomPanelVisible', 'isZoomingEnabled', 'licenseKey', 'locale', 'locales', 'lockDrawingScale', 'loginConfig', 'moreMenuItems', 'objectContextMenuItems', 'scaleMax', 'scaleMin', 'syncConfig', 'theme', 'themes', 'user', 'viewportBoundaryBottom', 'viewportBoundaryLeft', 'viewportBoundaryRight', 'viewportBoundaryTop'],
  methods: ['getObjectById', 'addObject', 'addObjects', 'updateObject', 'removeObject', 'removeObjects', 'getSelectedObjects', 'selectObjects', 'selectAllObjectsInViewport', 'clearSelection', 'centerObjectInViewport', 'panToObject', 'backToContent', 'centerAllObjects', 'centerObjects', 'setViewport', 'panTo', 'zoomTo', 'zoomIn', 'zoomOut', 'getViewport', 'screenToWorld', 'worldToScreen', 'createWorkspace', 'updateWorkspace', 'deleteWorkspace', 'getWorkspaces', 'getActiveWorkspace', 'loadSharedWorkspace', 'reinitSync', 'registerTool', 'changeActiveTool', 'changeActiveToolByName', 'disable', 'enable', 'copy', 'cut', 'paste', 'delete', 'bringForward', 'sendBackward', 'bringToFront', 'sendToBack', 'alignObjects', 'group', 'ungroup', 'undo', 'redo', 'getScreenshot', 'exportViewportAsPng', 'exportViewportAsSvg', 'getSelectedObjectSupportedExportFormats', 'canExportSelectedObjectAs', 'exportSelectedObject', 'downloadAsJson', 'importFromFile', 'loadObjectsFromJson', 'getObjectsTotalCount', 'getAllObjects', 'findObjects', 'getObjectsInViewport', 'hideContextMenu', 'openContextMenu', 'triggerSelectionChange', 'beginSceneBootstrap', 'endSceneBootstrap', 'getDisplayableShortcuts', 'triggerNotification', 'openLoginDialog', 'setLoginLoading', 'setLocale', 'getLocale', 'getAvailableLocales', 'registerLocales', 'registerFonts', 't']
})
@Component({
  selector: 'kritzel-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeUsers', 'activeWorkspaceId', 'assetStorageConfig', 'controls', 'cursorTarget', 'customFonts', 'customSvgIcons', 'debugInfo', 'editorId', 'fallbackLocale', 'globalContextMenuItems', 'isControlsVisible', 'isLoading', 'isMoreMenuVisible', 'isObjectDistanceFadingActive', 'isPanningEnabled', 'isUtilityPanelVisible', 'isWorkspaceManagerVisible', 'isZoomPanelVisible', 'isZoomingEnabled', 'licenseKey', 'locale', 'locales', 'lockDrawingScale', 'loginConfig', 'moreMenuItems', 'objectContextMenuItems', 'scaleMax', 'scaleMin', 'syncConfig', 'theme', 'themes', 'user', 'viewportBoundaryBottom', 'viewportBoundaryLeft', 'viewportBoundaryRight', 'viewportBoundaryTop'],
  outputs: ['isReady', 'activeWorkspaceChange', 'objectsChange', 'objectsAdded', 'objectsRemoved', 'objectsUpdated', 'undoStateChange', 'themeChange', 'localeChange', 'viewportChange', 'logout', 'login', 'isPublicChange', 'awarenessChange'],
})
export class KritzelEditor {
  protected el: HTMLKritzelEditorElement;
  @Output() isReady = new EventEmitter<KritzelEditorCustomEvent<IKritzelEditorEditorIsReadyEvent>>();
  @Output() activeWorkspaceChange = new EventEmitter<KritzelEditorCustomEvent<IKritzelEditorActiveWorkspaceChangeEvent>>();
  @Output() objectsChange = new EventEmitter<KritzelEditorCustomEvent<IKritzelEditorKritzelBaseObject[]>>();
  @Output() objectsAdded = new EventEmitter<KritzelEditorCustomEvent<IKritzelEditorObjectsAddedEvent>>();
  @Output() objectsRemoved = new EventEmitter<KritzelEditorCustomEvent<IKritzelEditorObjectsRemovedEvent>>();
  @Output() objectsUpdated = new EventEmitter<KritzelEditorCustomEvent<IKritzelEditorObjectsUpdatedEvent>>();
  @Output() undoStateChange = new EventEmitter<KritzelEditorCustomEvent<IKritzelEditorKritzelUndoState>>();
  @Output() themeChange = new EventEmitter<KritzelEditorCustomEvent<IKritzelEditorThemeName>>();
  @Output() localeChange = new EventEmitter<KritzelEditorCustomEvent<IKritzelEditorLocaleCode>>();
  @Output() viewportChange = new EventEmitter<KritzelEditorCustomEvent<IKritzelEditorKritzelViewportState>>();
  @Output() logout = new EventEmitter<KritzelEditorCustomEvent<void>>();
  @Output() login = new EventEmitter<KritzelEditorCustomEvent<IKritzelEditorLoginEvent>>();
  @Output() isPublicChange = new EventEmitter<KritzelEditorCustomEvent<IKritzelEditorIKritzelIsPublicChangedEvent>>();
  @Output() awarenessChange = new EventEmitter<KritzelEditorCustomEvent<Map<number, Record<string, any>>>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelEditorCustomEvent } from 'kritzel-stencil/dist/components';
import type { EditorIsReadyEvent as IKritzelEditorEditorIsReadyEvent } from 'kritzel-stencil/dist/components';
import type { ActiveWorkspaceChangeEvent as IKritzelEditorActiveWorkspaceChangeEvent } from 'kritzel-stencil/dist/components';
import type { KritzelBaseObject as IKritzelEditorKritzelBaseObject } from 'kritzel-stencil/dist/components';
import type { ObjectsAddedEvent as IKritzelEditorObjectsAddedEvent } from 'kritzel-stencil/dist/components';
import type { ObjectsRemovedEvent as IKritzelEditorObjectsRemovedEvent } from 'kritzel-stencil/dist/components';
import type { ObjectsUpdatedEvent as IKritzelEditorObjectsUpdatedEvent } from 'kritzel-stencil/dist/components';
import type { KritzelUndoState as IKritzelEditorKritzelUndoState } from 'kritzel-stencil/dist/components';
import type { ThemeName as IKritzelEditorThemeName } from 'kritzel-stencil/dist/components';
import type { LocaleCode as IKritzelEditorLocaleCode } from 'kritzel-stencil/dist/components';
import type { KritzelViewportState as IKritzelEditorKritzelViewportState } from 'kritzel-stencil/dist/components';
import type { LoginEvent as IKritzelEditorLoginEvent } from 'kritzel-stencil/dist/components';
import type { IKritzelIsPublicChangedEvent as IKritzelEditorIKritzelIsPublicChangedEvent } from 'kritzel-stencil/dist/components';

export declare interface KritzelEditor extends Components.KritzelEditor {

  isReady: EventEmitter<KritzelEditorCustomEvent<IKritzelEditorEditorIsReadyEvent>>;

  activeWorkspaceChange: EventEmitter<KritzelEditorCustomEvent<IKritzelEditorActiveWorkspaceChangeEvent>>;

  objectsChange: EventEmitter<KritzelEditorCustomEvent<IKritzelEditorKritzelBaseObject[]>>;

  objectsAdded: EventEmitter<KritzelEditorCustomEvent<IKritzelEditorObjectsAddedEvent>>;

  objectsRemoved: EventEmitter<KritzelEditorCustomEvent<IKritzelEditorObjectsRemovedEvent>>;

  objectsUpdated: EventEmitter<KritzelEditorCustomEvent<IKritzelEditorObjectsUpdatedEvent>>;

  undoStateChange: EventEmitter<KritzelEditorCustomEvent<IKritzelEditorKritzelUndoState>>;

  themeChange: EventEmitter<KritzelEditorCustomEvent<IKritzelEditorThemeName>>;

  localeChange: EventEmitter<KritzelEditorCustomEvent<IKritzelEditorLocaleCode>>;

  viewportChange: EventEmitter<KritzelEditorCustomEvent<IKritzelEditorKritzelViewportState>>;

  logout: EventEmitter<KritzelEditorCustomEvent<void>>;

  login: EventEmitter<KritzelEditorCustomEvent<IKritzelEditorLoginEvent>>;

  isPublicChange: EventEmitter<KritzelEditorCustomEvent<IKritzelEditorIKritzelIsPublicChangedEvent>>;

  awarenessChange: EventEmitter<KritzelEditorCustomEvent<Map<number, Record<string, any>>>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelEngine,
  inputs: ['activeWorkspaceId', 'assetStorageConfig', 'cursorTarget', 'debugInfo', 'editorId', 'fallbackLocale', 'globalContextMenuItems', 'isLoading', 'isObjectDistanceFadingActive', 'isPanningEnabled', 'isZoomingEnabled', 'licenseKey', 'locale', 'locales', 'lockDrawingScale', 'objectContextMenuItems', 'scaleMax', 'scaleMin', 'syncConfig', 'theme', 'themes', 'user', 'viewportBoundaryBottom', 'viewportBoundaryLeft', 'viewportBoundaryRight', 'viewportBoundaryTop', 'workspace'],
  methods: ['triggerSelectionChange', 'beginSceneBootstrap', 'endSceneBootstrap', 'registerTool', 'changeActiveTool', 'changeActiveToolByName', 'disable', 'enable', 'delete', 'copy', 'cut', 'paste', 'bringForward', 'sendBackward', 'bringToFront', 'sendToBack', 'alignObjects', 'group', 'ungroup', 'undo', 'redo', 'hideContextMenu', 'openContextMenu', 'getObjectById', 'getAllObjects', 'findObjects', 'getObjectsTotalCount', 'addObject', 'addObjects', 'updateObject', 'removeObject', 'removeObjects', 'getSelectedObjects', 'getDisplayableShortcuts', 'selectObjects', 'selectAllObjectsInViewport', 'clearSelection', 'centerObjectInViewport', 'panToObject', 'backToContent', 'centerAllObjects', 'centerObjects', 'setViewport', 'panTo', 'zoomTo', 'zoomIn', 'zoomOut', 'getViewport', 'screenToWorld', 'worldToScreen', 'getObjectsInViewport', 'getScreenshot', 'exportViewportAsPng', 'exportViewportAsSvg', 'getSelectedObjectSupportedExportFormats', 'canExportSelectedObjectAs', 'exportSelectedObject', 'exportAsJson', 'importFromJson', 'loadObjectsFromJson', 'downloadAsJson', 'importFromFile', 'createWorkspace', 'updateWorkspace', 'deleteWorkspace', 'getWorkspaces', 'getActiveWorkspace', 'getIsPublic', 'loadSharedWorkspace', 'reinitSync', 'saveSettings', 'loadSettings', 'registerLocales', 'setLocale', 'getLocale', 'getAvailableLocales', 'getAvailableLocaleOptions', 't', 'getResolvedTerms']
})
@Component({
  selector: 'kritzel-engine',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeWorkspaceId', 'assetStorageConfig', 'cursorTarget', 'debugInfo', 'editorId', 'fallbackLocale', 'globalContextMenuItems', 'isLoading', 'isObjectDistanceFadingActive', 'isPanningEnabled', 'isZoomingEnabled', 'licenseKey', 'locale', 'locales', 'lockDrawingScale', 'objectContextMenuItems', 'scaleMax', 'scaleMin', 'syncConfig', 'theme', 'themes', 'user', 'viewportBoundaryBottom', 'viewportBoundaryLeft', 'viewportBoundaryRight', 'viewportBoundaryTop', 'workspace'],
  outputs: ['isEngineReady', 'activeToolChange', 'objectsSelectionChange', 'workspacesChange', 'activeWorkspaceChange', 'longpress', 'objectsChange', 'objectsAdded', 'objectsRemoved', 'objectsUpdated', 'undoStateChange', 'objectsInViewportChange', 'viewportChange', 'awarenessChange', 'notificationsChange', 'contextMenuStateChange', 'loadingChange'],
})
export class KritzelEngine {
  protected el: HTMLKritzelEngineElement;
  @Output() isEngineReady = new EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelEngineState>>();
  @Output() activeToolChange = new EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelBaseTool>>();
  @Output() objectsSelectionChange = new EventEmitter<KritzelEngineCustomEvent<void>>();
  @Output() workspacesChange = new EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelWorkspace[]>>();
  @Output() activeWorkspaceChange = new EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelWorkspace>>();
  @Output() longpress = new EventEmitter<KritzelEngineCustomEvent<PointerEvent>>();
  @Output() objectsChange = new EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelBaseObject[]>>();
  @Output() objectsAdded = new EventEmitter<KritzelEngineCustomEvent<IKritzelEngineObjectsAddedEvent>>();
  @Output() objectsRemoved = new EventEmitter<KritzelEngineCustomEvent<IKritzelEngineObjectsRemovedEvent>>();
  @Output() objectsUpdated = new EventEmitter<KritzelEngineCustomEvent<IKritzelEngineObjectsUpdatedEvent>>();
  @Output() undoStateChange = new EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelUndoState>>();
  @Output() objectsInViewportChange = new EventEmitter<KritzelEngineCustomEvent<IKritzelEngineObjectsInViewportChangeEvent>>();
  @Output() viewportChange = new EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelViewportState>>();
  @Output() awarenessChange = new EventEmitter<KritzelEngineCustomEvent<Map<number, Record<string, any>>>>();
  @Output() notificationsChange = new EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelNotification>>();
  @Output() contextMenuStateChange = new EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelContextMenuState>>();
  @Output() loadingChange = new EventEmitter<KritzelEngineCustomEvent<boolean>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelEngineCustomEvent } from 'kritzel-stencil/dist/components';
import type { KritzelEngineState as IKritzelEngineKritzelEngineState } from 'kritzel-stencil/dist/components';
import type { KritzelBaseTool as IKritzelEngineKritzelBaseTool } from 'kritzel-stencil/dist/components';
import type { KritzelWorkspace as IKritzelEngineKritzelWorkspace } from 'kritzel-stencil/dist/components';
import type { KritzelBaseObject as IKritzelEngineKritzelBaseObject } from 'kritzel-stencil/dist/components';
import type { ObjectsAddedEvent as IKritzelEngineObjectsAddedEvent } from 'kritzel-stencil/dist/components';
import type { ObjectsRemovedEvent as IKritzelEngineObjectsRemovedEvent } from 'kritzel-stencil/dist/components';
import type { ObjectsUpdatedEvent as IKritzelEngineObjectsUpdatedEvent } from 'kritzel-stencil/dist/components';
import type { KritzelUndoState as IKritzelEngineKritzelUndoState } from 'kritzel-stencil/dist/components';
import type { ObjectsInViewportChangeEvent as IKritzelEngineObjectsInViewportChangeEvent } from 'kritzel-stencil/dist/components';
import type { KritzelViewportState as IKritzelEngineKritzelViewportState } from 'kritzel-stencil/dist/components';
import type { KritzelNotification as IKritzelEngineKritzelNotification } from 'kritzel-stencil/dist/components';
import type { KritzelContextMenuState as IKritzelEngineKritzelContextMenuState } from 'kritzel-stencil/dist/components';

export declare interface KritzelEngine extends Components.KritzelEngine {
  /**
   * Emitted when the engine has fully initialized and is ready for interaction.
   */
  isEngineReady: EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelEngineState>>;
  /**
   * Emitted when the active drawing tool changes.
   */
  activeToolChange: EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelBaseTool>>;
  /**
   * Emitted when the set of selected objects changes.
   */
  objectsSelectionChange: EventEmitter<KritzelEngineCustomEvent<void>>;
  /**
   * Emitted when workspaces are created, updated, or deleted.
   */
  workspacesChange: EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelWorkspace[]>>;
  /**
   * Emitted when the active workspace changes (e.g., after import).
   */
  activeWorkspaceChange: EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelWorkspace>>;
  /**
   * Emitted on long-press (touch/pen). Useful for showing custom context menus on mobile.
   */
  longpress: EventEmitter<KritzelEngineCustomEvent<PointerEvent>>;
  /**
   * Emitted when objects on the canvas are added, removed, or modified.
   */
  objectsChange: EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelBaseObject[]>>;
  /**
   * Emitted when one or more objects are added to the canvas.
   */
  objectsAdded: EventEmitter<KritzelEngineCustomEvent<IKritzelEngineObjectsAddedEvent>>;
  /**
   * Emitted when one or more objects are removed from the canvas.
   */
  objectsRemoved: EventEmitter<KritzelEngineCustomEvent<IKritzelEngineObjectsRemovedEvent>>;
  /**
   * Emitted when one or more objects are updated on the canvas.
   */
  objectsUpdated: EventEmitter<KritzelEngineCustomEvent<IKritzelEngineObjectsUpdatedEvent>>;
  /**
   * Emitted when the undo/redo state changes, providing current undo availability.
   */
  undoStateChange: EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelUndoState>>;
  /**
   * Emitted when the set of objects visible in the current viewport changes (e.g., after pan or zoom).
   */
  objectsInViewportChange: EventEmitter<KritzelEngineCustomEvent<IKritzelEngineObjectsInViewportChangeEvent>>;
  /**
   * Emitted when the viewport position, scale, or dimensions change (e.g., after pan, zoom, or resize).
   */
  viewportChange: EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelViewportState>>;
  /**
   * Emitted when the awareness state changes (remote user cursors, presence).
   */
  awarenessChange: EventEmitter<KritzelEngineCustomEvent<Map<number, Record<string, any>>>>;
  /**
   * Emitted when notifications change.
   */
  notificationsChange: EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelNotification>>;
  /**
   * Emitted when context-menu visibility, items, or position changes.
   */
  contextMenuStateChange: EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelContextMenuState>>;
  /**
   * Emitted when the combined loading state (external `isLoading` prop or internal workspace loading) changes.
   */
  loadingChange: EventEmitter<KritzelEngineCustomEvent<boolean>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelExport,
  inputs: ['terms', 'workspaceName'],
  methods: ['open']
})
@Component({
  selector: 'kritzel-export',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['terms', 'workspaceName'],
  outputs: ['exportPng', 'exportSvg', 'exportJson'],
})
export class KritzelExport {
  protected el: HTMLKritzelExportElement;
  @Output() exportPng = new EventEmitter<KritzelExportCustomEvent<void>>();
  @Output() exportSvg = new EventEmitter<KritzelExportCustomEvent<void>>();
  @Output() exportJson = new EventEmitter<KritzelExportCustomEvent<string>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelExportCustomEvent } from 'kritzel-stencil/dist/components';

export declare interface KritzelExport extends Components.KritzelExport {

  exportPng: EventEmitter<KritzelExportCustomEvent<void>>;

  exportSvg: EventEmitter<KritzelExportCustomEvent<void>>;

  exportJson: EventEmitter<KritzelExportCustomEvent<string>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelInput,
  inputs: ['disabled', 'label', 'placeholder', 'suffix', 'type', 'value']
})
@Component({
  selector: 'kritzel-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['disabled', 'label', 'placeholder', 'suffix', 'type', 'value'],
  outputs: ['valueChange'],
})
export class KritzelInput {
  protected el: HTMLKritzelInputElement;
  @Output() valueChange = new EventEmitter<KritzelInputCustomEvent<string>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelInputCustomEvent } from 'kritzel-stencil/dist/components';

export declare interface KritzelInput extends Components.KritzelInput {
  /**
   * Emitted when the value changes
   */
  valueChange: EventEmitter<KritzelInputCustomEvent<string>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelLineEndings,
  inputs: ['styles', 'value']
})
@Component({
  selector: 'kritzel-line-endings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['styles', 'value'],
  outputs: ['valueChange'],
})
export class KritzelLineEndings {
  protected el: HTMLKritzelLineEndingsElement;
  @Output() valueChange = new EventEmitter<KritzelLineEndingsCustomEvent<IKritzelLineEndingsLineArrowConfig>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelLineEndingsCustomEvent } from 'kritzel-stencil/dist/components';
import type { LineArrowConfig as IKritzelLineEndingsLineArrowConfig } from 'kritzel-stencil/dist/components';

export declare interface KritzelLineEndings extends Components.KritzelLineEndings {

  valueChange: EventEmitter<KritzelLineEndingsCustomEvent<IKritzelLineEndingsLineArrowConfig>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelLoadingOverlay,
  inputs: ['text', 'visible']
})
@Component({
  selector: 'kritzel-loading-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['text', 'visible'],
})
export class KritzelLoadingOverlay {
  protected el: HTMLKritzelLoadingOverlayElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelLoadingOverlay extends Components.KritzelLoadingOverlay {}


@ProxyCmp({
  defineCustomElementFn: defineKritzelLoginDialog,
  inputs: ['dialogTitle', 'providers', 'subtitle'],
  methods: ['open', 'close', 'setLoading']
})
@Component({
  selector: 'kritzel-login-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['dialogTitle', 'providers', 'subtitle'],
  outputs: ['providerLogin', 'dialogClosed'],
})
export class KritzelLoginDialog {
  protected el: HTMLKritzelLoginDialogElement;
  @Output() providerLogin = new EventEmitter<KritzelLoginDialogCustomEvent<IKritzelLoginDialogLoginEvent>>();
  @Output() dialogClosed = new EventEmitter<KritzelLoginDialogCustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelLoginDialogCustomEvent } from 'kritzel-stencil/dist/components';
import type { LoginEvent as IKritzelLoginDialogLoginEvent } from 'kritzel-stencil/dist/components';

export declare interface KritzelLoginDialog extends Components.KritzelLoginDialog {
  /**
   * Emitted when a provider button is clicked
   */
  providerLogin: EventEmitter<KritzelLoginDialogCustomEvent<IKritzelLoginDialogLoginEvent>>;
  /**
   * Emitted when the dialog is closed
   */
  dialogClosed: EventEmitter<KritzelLoginDialogCustomEvent<void>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelMasterDetail,
  inputs: ['items', 'selectedItemId']
})
@Component({
  selector: 'kritzel-master-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['items', 'selectedItemId'],
  outputs: ['itemSelect'],
})
export class KritzelMasterDetail {
  protected el: HTMLKritzelMasterDetailElement;
  @Output() itemSelect = new EventEmitter<KritzelMasterDetailCustomEvent<IKritzelMasterDetailIKritzelMasterDetailSelectEvent>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelMasterDetailCustomEvent } from 'kritzel-stencil/dist/components';
import type { IKritzelMasterDetailSelectEvent as IKritzelMasterDetailIKritzelMasterDetailSelectEvent } from 'kritzel-stencil/dist/components';

export declare interface KritzelMasterDetail extends Components.KritzelMasterDetail {
  /**
   * Emitted when an item is selected
   */
  itemSelect: EventEmitter<KritzelMasterDetailCustomEvent<IKritzelMasterDetailIKritzelMasterDetailSelectEvent>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelNotificationCard,
  inputs: ['locale', 'notification', 'showTimestamp']
})
@Component({
  selector: 'kritzel-notification-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['locale', 'notification', 'showTimestamp'],
  outputs: ['dismiss', 'hoverChange'],
})
export class KritzelNotificationCard {
  protected el: HTMLKritzelNotificationCardElement;
  @Output() dismiss = new EventEmitter<KritzelNotificationCardCustomEvent<void>>();
  @Output() hoverChange = new EventEmitter<KritzelNotificationCardCustomEvent<boolean>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelNotificationCardCustomEvent } from 'kritzel-stencil/dist/components';

export declare interface KritzelNotificationCard extends Components.KritzelNotificationCard {
  /**
   * Emitted when the notification should be dismissed manually.
   */
  dismiss: EventEmitter<KritzelNotificationCardCustomEvent<void>>;
  /**
   * Emitted when pointer hover state changes.
   */
  hoverChange: EventEmitter<KritzelNotificationCardCustomEvent<boolean>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelNumericInput,
  inputs: ['label', 'max', 'min', 'placeholder', 'step', 'value']
})
@Component({
  selector: 'kritzel-numeric-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['label', 'max', 'min', 'placeholder', 'step', 'value'],
  outputs: ['valueChange'],
})
export class KritzelNumericInput {
  protected el: HTMLKritzelNumericInputElement;
  @Output() valueChange = new EventEmitter<KritzelNumericInputCustomEvent<number | undefined>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelNumericInputCustomEvent } from 'kritzel-stencil/dist/components';

export declare interface KritzelNumericInput extends Components.KritzelNumericInput {
  /**
   * Emitted when the value changes (after normalization)
   */
  valueChange: EventEmitter<KritzelNumericInputCustomEvent<number | undefined>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelOpacitySlider,
  inputs: ['max', 'min', 'previewColor', 'step', 'value']
})
@Component({
  selector: 'kritzel-opacity-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['max', 'min', 'previewColor', 'step', 'value'],
  outputs: ['valueChange'],
})
export class KritzelOpacitySlider {
  protected el: HTMLKritzelOpacitySliderElement;
  @Output() valueChange = new EventEmitter<KritzelOpacitySliderCustomEvent<number>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelOpacitySliderCustomEvent } from 'kritzel-stencil/dist/components';

export declare interface KritzelOpacitySlider extends Components.KritzelOpacitySlider {

  valueChange: EventEmitter<KritzelOpacitySliderCustomEvent<number>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelPillTabs,
  inputs: ['tabs', 'value']
})
@Component({
  selector: 'kritzel-pill-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['tabs', 'value'],
  outputs: ['valueChange'],
})
export class KritzelPillTabs {
  protected el: HTMLKritzelPillTabsElement;
  @Output() valueChange = new EventEmitter<KritzelPillTabsCustomEvent<string>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelPillTabsCustomEvent } from 'kritzel-stencil/dist/components';

export declare interface KritzelPillTabs extends Components.KritzelPillTabs {
  /**
   * Emitted when the selected tab changes
   */
  valueChange: EventEmitter<KritzelPillTabsCustomEvent<string>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelSettings,
  inputs: ['availableLocales', 'availableThemes', 'settings', 'shortcuts', 'terms'],
  methods: ['open']
})
@Component({
  selector: 'kritzel-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['availableLocales', 'availableThemes', 'settings', 'shortcuts', 'terms'],
  outputs: ['settingsChange'],
})
export class KritzelSettings {
  protected el: HTMLKritzelSettingsElement;
  @Output() settingsChange = new EventEmitter<KritzelSettingsCustomEvent<IKritzelSettingsKritzelSettingsConfig>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelSettingsCustomEvent } from 'kritzel-stencil/dist/components';
import type { KritzelSettingsConfig as IKritzelSettingsKritzelSettingsConfig } from 'kritzel-stencil/dist/components';

export declare interface KritzelSettings extends Components.KritzelSettings {
  /**
   * Emitted when settings change
   */
  settingsChange: EventEmitter<KritzelSettingsCustomEvent<IKritzelSettingsKritzelSettingsConfig>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelWatermark,
  inputs: ['core', 'label']
})
@Component({
  selector: 'kritzel-watermark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: [{ name: 'core', required: true }, 'label'],
})
export class KritzelWatermark {
  protected el: HTMLKritzelWatermarkElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelWatermark extends Components.KritzelWatermark {}


@ProxyCmp({
  defineCustomElementFn: defineKritzelZoomPanel,
  inputs: ['disabled', 'terms', 'visible', 'zoomPercent']
})
@Component({
  selector: 'kritzel-zoom-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['disabled', 'terms', 'visible', 'zoomPercent'],
  outputs: ['zoomIn', 'zoomOut'],
})
export class KritzelZoomPanel {
  protected el: HTMLKritzelZoomPanelElement;
  @Output() zoomIn = new EventEmitter<KritzelZoomPanelCustomEvent<void>>();
  @Output() zoomOut = new EventEmitter<KritzelZoomPanelCustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelZoomPanelCustomEvent } from 'kritzel-stencil/dist/components';

export declare interface KritzelZoomPanel extends Components.KritzelZoomPanel {
  /**
   * Emitted when the zoom-in button is clicked.
   */
  zoomIn: EventEmitter<KritzelZoomPanelCustomEvent<void>>;
  /**
   * Emitted when the zoom-out button is clicked.
   */
  zoomOut: EventEmitter<KritzelZoomPanelCustomEvent<void>>;
}


