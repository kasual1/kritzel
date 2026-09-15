/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@kritzel/editor/dist/components';

import { defineCustomElement as defineKritzelEditor } from '@kritzel/editor/dist/components/kritzel-editor.js';
@ProxyCmp({
  defineCustomElementFn: defineKritzelEditor,
  inputs: ['activeUsers', 'activeWorkspaceId', 'assetStorageConfig', 'cursorTarget', 'customFonts', 'customSvgIcons', 'debugInfo', 'editorId', 'fallbackLocale', 'globalContextMenuItems', 'isMoreMenuVisible', 'isPanningEnabled', 'isToolbarVisible', 'isUtilityPanelVisible', 'isWorkspaceManagerVisible', 'isZoomPanelVisible', 'isZoomingEnabled', 'licenseKey', 'locale', 'locales', 'lockDrawingScale', 'loginConfig', 'moreMenuItems', 'objectContextMenuItems', 'scaleMax', 'scaleMin', 'syncConfig', 'theme', 'themes', 'toolbarItems', 'user', 'viewportBoundaryBottom', 'viewportBoundaryLeft', 'viewportBoundaryRight', 'viewportBoundaryTop', 'workspaces'],
  methods: ['getObjectById', 'addObject', 'addObjects', 'updateObject', 'removeObject', 'removeObjects', 'getSelectedObjects', 'selectObjects', 'selectAllObjectsInViewport', 'clearSelection', 'centerObjectInViewport', 'panToObject', 'backToContent', 'centerAllObjects', 'centerObjects', 'setViewport', 'panTo', 'zoomTo', 'zoomIn', 'zoomOut', 'getViewport', 'screenToWorld', 'worldToScreen', 'setActiveWorkspace', 'createWorkspace', 'updateWorkspace', 'deleteWorkspace', 'getWorkspaces', 'getActiveWorkspace', 'loadSharedWorkspace', 'reinitSync', 'registerTool', 'changeActiveTool', 'disable', 'enable', 'copy', 'cut', 'paste', 'delete', 'bringForward', 'sendBackward', 'bringToFront', 'sendToBack', 'alignObjects', 'group', 'ungroup', 'undo', 'redo', 'getScreenshot', 'exportViewportAsPng', 'exportViewportAsSvg', 'getSelectedObjectSupportedExportFormats', 'canExportSelectedObjectAs', 'exportSelectedObject', 'exportAsJson', 'importFromJson', 'downloadAsJson', 'importFromFile', 'loadObjectsFromJson', 'getObjectsTotalCount', 'getAllObjects', 'findObjects', 'getObjectsInViewport', 'hideContextMenu', 'openContextMenu', 'openWorkspaceManagerMenu', 'closeWorkspaceManagerMenu', 'openMoreMenu', 'closeMoreMenu', 'openUserDialog', 'closeUserDialog', 'openExportDialog', 'closeExportDialog', 'openImportDialog', 'closeImportDialog', 'openSettingsDialog', 'closeSettingsDialog', 'openShareDialog', 'closeShareDialog', 'triggerSelectionChange', 'beginSceneBootstrap', 'endSceneBootstrap', 'getDisplayableShortcuts', 'triggerNotification', 'openLoginDialog', 'closeLoginDialog', 'setLoginLoading', 'setLocale', 'getLocale', 'getAvailableLocales', 'registerLocales', 'registerFonts', 't']
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


