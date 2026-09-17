/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@kritzel/editor/dist/components';

import { defineCustomElement as defineKritzelEditor } from '@kritzel/editor/dist/components/kritzel-editor.js';
import { defineCustomElement as defineKritzelSettings } from '@kritzel/editor/dist/components/kritzel-settings.js';
import { defineCustomElement as defineKritzelShapeFill } from '@kritzel/editor/dist/components/kritzel-shape-fill.js';
import { defineCustomElement as defineKritzelShareDialog } from '@kritzel/editor/dist/components/kritzel-share-dialog.js';
import { defineCustomElement as defineKritzelSplitButton } from '@kritzel/editor/dist/components/kritzel-split-button.js';
import { defineCustomElement as defineKritzelStrokeSize } from '@kritzel/editor/dist/components/kritzel-stroke-size.js';
@ProxyCmp({
  defineCustomElementFn: defineKritzelEditor,
  inputs: ['activeUsers', 'activeWorkspaceId', 'assetStorageConfig', 'cursorTarget', 'customFonts', 'customSvgIcons', 'debugInfo', 'editorId', 'fallbackLocale', 'globalContextMenuItems', 'isMoreMenuVisible', 'isPanningEnabled', 'isToolbarVisible', 'isUtilityPanelVisible', 'isWorkspaceManagerVisible', 'isZoomPanelVisible', 'isZoomingEnabled', 'licenseKey', 'locale', 'locales', 'lockDrawingScale', 'loginConfig', 'moreMenuItems', 'objectContextMenuItems', 'scaleMax', 'scaleMin', 'syncConfig', 'theme', 'themes', 'toolbarItems', 'user', 'viewportBoundaryBottom', 'viewportBoundaryLeft', 'viewportBoundaryRight', 'viewportBoundaryTop', 'workspaces'],
  methods: ['getObjectById', 'addObject', 'addObjects', 'updateObject', 'removeObject', 'removeObjects', 'getSelectedObjects', 'selectObjects', 'selectAllObjectsInViewport', 'clearSelection', 'centerObjectInViewport', 'panToObject', 'backToContent', 'centerAllObjects', 'centerObjects', 'setViewport', 'panTo', 'zoomTo', 'zoomIn', 'zoomOut', 'getViewport', 'screenToWorld', 'worldToScreen', 'setActiveWorkspace', 'createWorkspace', 'updateWorkspace', 'deleteWorkspace', 'getWorkspaces', 'getActiveWorkspace', 'loadSharedWorkspace', 'reinitSync', 'registerTool', 'setActiveTool', 'disable', 'enable', 'copy', 'cut', 'paste', 'delete', 'bringForward', 'sendBackward', 'bringToFront', 'sendToBack', 'alignObjects', 'group', 'ungroup', 'undo', 'redo', 'getScreenshot', 'exportViewportAsPng', 'exportViewportAsSvg', 'getSelectedObjectSupportedExportFormats', 'canExportSelectedObjectAs', 'exportSelectedObject', 'exportAsJson', 'importFromJson', 'downloadAsJson', 'importFromFile', 'loadObjectsFromJson', 'getObjectsTotalCount', 'getAllObjects', 'findObjects', 'getObjectsInViewport', 'hideContextMenu', 'openContextMenu', 'openWorkspaceManagerMenu', 'closeWorkspaceManagerMenu', 'openMoreMenu', 'closeMoreMenu', 'openUserDialog', 'closeUserDialog', 'openExportDialog', 'closeExportDialog', 'openImportDialog', 'closeImportDialog', 'openSettingsDialog', 'closeSettingsDialog', 'openShareDialog', 'closeShareDialog', 'triggerSelectionChange', 'beginSceneBootstrap', 'endSceneBootstrap', 'getDisplayableShortcuts', 'openLoginDialog', 'closeLoginDialog', 'setLoginLoading', 'setLocale', 'getLocale', 'getAvailableLocales', 'registerLocales', 'registerFonts', 't', 'triggerNotification']
})
@Component({
  selector: 'kritzel-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeUsers', 'activeWorkspaceId', 'assetStorageConfig', 'cursorTarget', 'customFonts', 'customSvgIcons', 'debugInfo', 'editorId', 'fallbackLocale', 'globalContextMenuItems', 'isMoreMenuVisible', 'isPanningEnabled', 'isToolbarVisible', 'isUtilityPanelVisible', 'isWorkspaceManagerVisible', 'isZoomPanelVisible', 'isZoomingEnabled', 'licenseKey', 'locale', 'locales', 'lockDrawingScale', 'loginConfig', 'moreMenuItems', 'objectContextMenuItems', 'scaleMax', 'scaleMin', 'syncConfig', 'theme', 'themes', 'toolbarItems', 'user', 'viewportBoundaryBottom', 'viewportBoundaryLeft', 'viewportBoundaryRight', 'viewportBoundaryTop', 'workspaces'],
  outputs: ['isReady', 'activeWorkspaceChange', 'objectsChange', 'objectsAdded', 'objectsRemoved', 'objectsUpdated', 'objectsSelectionChange', 'undoStateChange', 'themeChange', 'localeChange', 'viewportChange', 'logout', 'login', 'isPublicChange', 'awarenessChange'],
})
export class KritzelEditor {
  protected el: HTMLKritzelEditorElement;
  @Output() isReady = new EventEmitter<KritzelEditorCustomEvent<IKritzelEditorEditorIsReadyEvent>>();
  @Output() activeWorkspaceChange = new EventEmitter<KritzelEditorCustomEvent<IKritzelEditorActiveWorkspaceChangeEvent>>();
  @Output() objectsChange = new EventEmitter<KritzelEditorCustomEvent<IKritzelEditorKritzelBaseObject[]>>();
  @Output() objectsAdded = new EventEmitter<KritzelEditorCustomEvent<IKritzelEditorObjectsAddedEvent>>();
  @Output() objectsRemoved = new EventEmitter<KritzelEditorCustomEvent<IKritzelEditorObjectsRemovedEvent>>();
  @Output() objectsUpdated = new EventEmitter<KritzelEditorCustomEvent<IKritzelEditorObjectsUpdatedEvent>>();
  @Output() objectsSelectionChange = new EventEmitter<KritzelEditorCustomEvent<IKritzelEditorKritzelBaseObject[]>>();
  @Output() undoStateChange = new EventEmitter<KritzelEditorCustomEvent<IKritzelEditorKritzelUndoState>>();
  @Output() themeChange = new EventEmitter<KritzelEditorCustomEvent<IKritzelEditorThemeName>>();
  @Output() localeChange = new EventEmitter<KritzelEditorCustomEvent<IKritzelEditorLocaleCode>>();
  @Output() viewportChange = new EventEmitter<KritzelEditorCustomEvent<IKritzelEditorKritzelViewportState>>();
  @Output() logout = new EventEmitter<KritzelEditorCustomEvent<void>>();
  @Output() login = new EventEmitter<KritzelEditorCustomEvent<IKritzelEditorLoginEvent>>();
  @Output() isPublicChange = new EventEmitter<KritzelEditorCustomEvent<IKritzelEditorIKritzelIsPublicChangeEvent>>();
  @Output() awarenessChange = new EventEmitter<KritzelEditorCustomEvent<Map<number, Record<string, any>>>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelEditorCustomEvent } from '@kritzel/editor/dist/components';
import type { EditorIsReadyEvent as IKritzelEditorEditorIsReadyEvent } from '@kritzel/editor/dist/components';
import type { ActiveWorkspaceChangeEvent as IKritzelEditorActiveWorkspaceChangeEvent } from '@kritzel/editor/dist/components';
import type { KritzelBaseObject as IKritzelEditorKritzelBaseObject } from '@kritzel/editor/dist/components';
import type { ObjectsAddedEvent as IKritzelEditorObjectsAddedEvent } from '@kritzel/editor/dist/components';
import type { ObjectsRemovedEvent as IKritzelEditorObjectsRemovedEvent } from '@kritzel/editor/dist/components';
import type { ObjectsUpdatedEvent as IKritzelEditorObjectsUpdatedEvent } from '@kritzel/editor/dist/components';
import type { KritzelUndoState as IKritzelEditorKritzelUndoState } from '@kritzel/editor/dist/components';
import type { ThemeName as IKritzelEditorThemeName } from '@kritzel/editor/dist/components';
import type { LocaleCode as IKritzelEditorLocaleCode } from '@kritzel/editor/dist/components';
import type { KritzelViewportState as IKritzelEditorKritzelViewportState } from '@kritzel/editor/dist/components';
import type { LoginEvent as IKritzelEditorLoginEvent } from '@kritzel/editor/dist/components';
import type { IKritzelIsPublicChangeEvent as IKritzelEditorIKritzelIsPublicChangeEvent } from '@kritzel/editor/dist/components';

export declare interface KritzelEditor extends Components.KritzelEditor {

  isReady: EventEmitter<KritzelEditorCustomEvent<IKritzelEditorEditorIsReadyEvent>>;

  activeWorkspaceChange: EventEmitter<KritzelEditorCustomEvent<IKritzelEditorActiveWorkspaceChangeEvent>>;

  objectsChange: EventEmitter<KritzelEditorCustomEvent<IKritzelEditorKritzelBaseObject[]>>;

  objectsAdded: EventEmitter<KritzelEditorCustomEvent<IKritzelEditorObjectsAddedEvent>>;

  objectsRemoved: EventEmitter<KritzelEditorCustomEvent<IKritzelEditorObjectsRemovedEvent>>;

  objectsUpdated: EventEmitter<KritzelEditorCustomEvent<IKritzelEditorObjectsUpdatedEvent>>;

  objectsSelectionChange: EventEmitter<KritzelEditorCustomEvent<IKritzelEditorKritzelBaseObject[]>>;

  undoStateChange: EventEmitter<KritzelEditorCustomEvent<IKritzelEditorKritzelUndoState>>;

  themeChange: EventEmitter<KritzelEditorCustomEvent<IKritzelEditorThemeName>>;

  localeChange: EventEmitter<KritzelEditorCustomEvent<IKritzelEditorLocaleCode>>;

  viewportChange: EventEmitter<KritzelEditorCustomEvent<IKritzelEditorKritzelViewportState>>;

  logout: EventEmitter<KritzelEditorCustomEvent<void>>;

  login: EventEmitter<KritzelEditorCustomEvent<IKritzelEditorLoginEvent>>;

  isPublicChange: EventEmitter<KritzelEditorCustomEvent<IKritzelEditorIKritzelIsPublicChangeEvent>>;

  awarenessChange: EventEmitter<KritzelEditorCustomEvent<Map<number, Record<string, any>>>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelSettings,
  inputs: ['availableLocales', 'availableThemes', 'settings', 'shortcuts', 'terms'],
  methods: ['open', 'close']
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


import type { KritzelSettingsCustomEvent } from '@kritzel/editor/dist/components';
import type { KritzelSettingsConfig as IKritzelSettingsKritzelSettingsConfig } from '@kritzel/editor/dist/components';

export declare interface KritzelSettings extends Components.KritzelSettings {
  /**
   * Emitted when settings change
   */
  settingsChange: EventEmitter<KritzelSettingsCustomEvent<IKritzelSettingsKritzelSettingsConfig>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelShapeFill,
  inputs: ['value']
})
@Component({
  selector: 'kritzel-shape-fill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['value'],
  outputs: ['valueChange'],
})
export class KritzelShapeFill {
  protected el: HTMLKritzelShapeFillElement;
  @Output() valueChange = new EventEmitter<KritzelShapeFillCustomEvent<IKritzelShapeFillShapeFillType>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelShapeFillCustomEvent } from '@kritzel/editor/dist/components';
import type { ShapeFillType as IKritzelShapeFillShapeFillType } from '@kritzel/editor/dist/components';

export declare interface KritzelShapeFill extends Components.KritzelShapeFill {

  valueChange: EventEmitter<KritzelShapeFillCustomEvent<IKritzelShapeFillShapeFillType>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelShareDialog,
  inputs: ['isPublic', 'terms', 'workspaceId'],
  methods: ['open', 'close']
})
@Component({
  selector: 'kritzel-share-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['isPublic', 'terms', 'workspaceId'],
  outputs: ['toggleIsPublic', 'dialogClosed'],
})
export class KritzelShareDialog {
  protected el: HTMLKritzelShareDialogElement;
  @Output() toggleIsPublic = new EventEmitter<KritzelShareDialogCustomEvent<boolean>>();
  @Output() dialogClosed = new EventEmitter<KritzelShareDialogCustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelShareDialogCustomEvent } from '@kritzel/editor/dist/components';

export declare interface KritzelShareDialog extends Components.KritzelShareDialog {
  /**
   * Emitted when the user toggles the public sharing state.
   */
  toggleIsPublic: EventEmitter<KritzelShareDialogCustomEvent<boolean>>;
  /**
   * Emitted when the dialog is closed.
   */
  dialogClosed: EventEmitter<KritzelShareDialogCustomEvent<void>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelSplitButton,
  inputs: ['buttonIcon', 'dropdownIcon', 'items', 'mainButtonDisabled', 'menuButtonDisabled'],
  methods: ['open', 'close', 'focusMenu']
})
@Component({
  selector: 'kritzel-split-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['buttonIcon', 'dropdownIcon', 'items', 'mainButtonDisabled', 'menuButtonDisabled'],
  outputs: ['mainButtonClick', 'itemSelect', 'itemSave', 'itemCancel', 'itemToggleChildMenu', 'itemCloseChildMenu', 'menuOpen', 'menuClose'],
})
export class KritzelSplitButton {
  protected el: HTMLKritzelSplitButtonElement;
  @Output() mainButtonClick = new EventEmitter<KritzelSplitButtonCustomEvent<void>>();
  @Output() itemSelect = new EventEmitter<KritzelSplitButtonCustomEvent<IKritzelSplitButtonIKritzelMenuItemSelectEvent>>();
  @Output() itemSave = new EventEmitter<KritzelSplitButtonCustomEvent<IKritzelSplitButtonIKritzelMenuItem>>();
  @Output() itemCancel = new EventEmitter<KritzelSplitButtonCustomEvent<IKritzelSplitButtonIKritzelMenuItem>>();
  @Output() itemToggleChildMenu = new EventEmitter<KritzelSplitButtonCustomEvent<IKritzelSplitButtonIKritzelMenuItemToggleChildMenuEvent>>();
  @Output() itemCloseChildMenu = new EventEmitter<KritzelSplitButtonCustomEvent<IKritzelSplitButtonIKritzelMenuItem>>();
  @Output() menuOpen = new EventEmitter<KritzelSplitButtonCustomEvent<void>>();
  @Output() menuClose = new EventEmitter<KritzelSplitButtonCustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelSplitButtonCustomEvent } from '@kritzel/editor/dist/components';
import type { IKritzelMenuItemSelectEvent as IKritzelSplitButtonIKritzelMenuItemSelectEvent } from '@kritzel/editor/dist/components';
import type { IKritzelMenuItem as IKritzelSplitButtonIKritzelMenuItem } from '@kritzel/editor/dist/components';
import type { IKritzelMenuItemToggleChildMenuEvent as IKritzelSplitButtonIKritzelMenuItemToggleChildMenuEvent } from '@kritzel/editor/dist/components';

export declare interface KritzelSplitButton extends Components.KritzelSplitButton {

  mainButtonClick: EventEmitter<KritzelSplitButtonCustomEvent<void>>;

  itemSelect: EventEmitter<KritzelSplitButtonCustomEvent<IKritzelSplitButtonIKritzelMenuItemSelectEvent>>;

  itemSave: EventEmitter<KritzelSplitButtonCustomEvent<IKritzelSplitButtonIKritzelMenuItem>>;

  itemCancel: EventEmitter<KritzelSplitButtonCustomEvent<IKritzelSplitButtonIKritzelMenuItem>>;

  itemToggleChildMenu: EventEmitter<KritzelSplitButtonCustomEvent<IKritzelSplitButtonIKritzelMenuItemToggleChildMenuEvent>>;

  itemCloseChildMenu: EventEmitter<KritzelSplitButtonCustomEvent<IKritzelSplitButtonIKritzelMenuItem>>;

  menuOpen: EventEmitter<KritzelSplitButtonCustomEvent<void>>;

  menuClose: EventEmitter<KritzelSplitButtonCustomEvent<void>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelStrokeSize,
  inputs: ['selectedSize', 'sizes']
})
@Component({
  selector: 'kritzel-stroke-size',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['selectedSize', 'sizes'],
  outputs: ['sizeChange'],
})
export class KritzelStrokeSize {
  protected el: HTMLKritzelStrokeSizeElement;
  @Output() sizeChange = new EventEmitter<KritzelStrokeSizeCustomEvent<number>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelStrokeSizeCustomEvent } from '@kritzel/editor/dist/components';

export declare interface KritzelStrokeSize extends Components.KritzelStrokeSize {

  sizeChange: EventEmitter<KritzelStrokeSizeCustomEvent<number>>;
}


