/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@kritzel/engine/dist/components';

import { defineCustomElement as defineKritzelEngine } from '@kritzel/engine/dist/components/kritzel-engine.js';
@ProxyCmp({
  defineCustomElementFn: defineKritzelEngine,
  inputs: ['activeWorkspaceId', 'assetStorageConfig', 'cursorTarget', 'debugInfo', 'editorId', 'fallbackLocale', 'globalContextMenuItems', 'isPanningEnabled', 'isWatermarkVisible', 'isZoomingEnabled', 'locale', 'locales', 'lockDrawingScale', 'objectContextMenuItems', 'scaleMax', 'scaleMin', 'syncConfig', 'theme', 'themes', 'tools', 'user', 'viewportBoundaryBottom', 'viewportBoundaryLeft', 'viewportBoundaryRight', 'viewportBoundaryTop', 'workspaces'],
  methods: ['triggerSelectionChange', 'beginSceneBootstrap', 'endSceneBootstrap', 'registerTool', 'setActiveTool', 'disable', 'enable', 'delete', 'copy', 'cut', 'paste', 'bringForward', 'sendBackward', 'bringToFront', 'sendToBack', 'alignObjects', 'group', 'ungroup', 'undo', 'redo', 'hideContextMenu', 'openContextMenu', 'getObjectById', 'getAllObjects', 'findObjects', 'getObjectsTotalCount', 'addObject', 'addObjects', 'updateObject', 'removeObject', 'removeObjects', 'getSelectedObjects', 'getDisplayableShortcuts', 'selectObjects', 'selectAllObjectsInViewport', 'clearSelection', 'centerObjectInViewport', 'panToObject', 'backToContent', 'centerAllObjects', 'centerObjects', 'setViewport', 'panTo', 'zoomTo', 'zoomIn', 'zoomOut', 'getViewport', 'screenToWorld', 'worldToScreen', 'getObjectsInViewport', 'getScreenshot', 'exportViewportAsPng', 'exportViewportAsSvg', 'getSelectedObjectSupportedExportFormats', 'canExportSelectedObjectAs', 'exportSelectedObject', 'exportAsJson', 'importFromJson', 'loadObjectsFromJson', 'downloadAsJson', 'importFromFile', 'cancelImportFromFile', 'setActiveWorkspace', 'createWorkspace', 'updateWorkspace', 'deleteWorkspace', 'getWorkspaces', 'getActiveWorkspace', 'getIsPublic', 'loadSharedWorkspace', 'reinitSync', 'saveSettings', 'loadSettings', 'registerLocales', 'configureLocales', 'setLocale', 'getLocale', 'getAvailableLocales', 'getAvailableLocaleOptions', 't', 'getResolvedTerms', 'getTool']
})
@Component({
  selector: 'kritzel-engine',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeWorkspaceId', 'assetStorageConfig', 'cursorTarget', 'debugInfo', 'editorId', 'fallbackLocale', 'globalContextMenuItems', 'isPanningEnabled', 'isWatermarkVisible', 'isZoomingEnabled', 'locale', 'locales', 'lockDrawingScale', 'objectContextMenuItems', 'scaleMax', 'scaleMin', 'syncConfig', 'theme', 'themes', 'tools', 'user', 'viewportBoundaryBottom', 'viewportBoundaryLeft', 'viewportBoundaryRight', 'viewportBoundaryTop', 'workspaces'],
  outputs: ['isEngineReady', 'activeToolChange', 'workspacesChange', 'activeWorkspaceChange', 'longpress', 'objectsChange', 'objectsAdded', 'objectsRemoved', 'objectsUpdated', 'objectsSelectionChange', 'undoStateChange', 'objectsInViewportChange', 'viewportChange', 'awarenessChange', 'notificationsChange', 'contextMenuStateChange', 'isLoadingChange'],
})
export class KritzelEngine {
  protected el: HTMLKritzelEngineElement;
  @Output() isEngineReady = new EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelEngineState>>();
  @Output() activeToolChange = new EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelBaseTool>>();
  @Output() workspacesChange = new EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelWorkspace[]>>();
  @Output() activeWorkspaceChange = new EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelWorkspace>>();
  @Output() longpress = new EventEmitter<KritzelEngineCustomEvent<PointerEvent>>();
  @Output() objectsChange = new EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelBaseObject[]>>();
  @Output() objectsAdded = new EventEmitter<KritzelEngineCustomEvent<IKritzelEngineObjectsAddedEvent>>();
  @Output() objectsRemoved = new EventEmitter<KritzelEngineCustomEvent<IKritzelEngineObjectsRemovedEvent>>();
  @Output() objectsUpdated = new EventEmitter<KritzelEngineCustomEvent<IKritzelEngineObjectsUpdatedEvent>>();
  @Output() objectsSelectionChange = new EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelBaseObject[]>>();
  @Output() undoStateChange = new EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelUndoState>>();
  @Output() objectsInViewportChange = new EventEmitter<KritzelEngineCustomEvent<IKritzelEngineObjectsInViewportChangeEvent>>();
  @Output() viewportChange = new EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelViewportState>>();
  @Output() awarenessChange = new EventEmitter<KritzelEngineCustomEvent<Map<number, Record<string, any>>>>();
  @Output() notificationsChange = new EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelNotification>>();
  @Output() contextMenuStateChange = new EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelContextMenuState>>();
  @Output() isLoadingChange = new EventEmitter<KritzelEngineCustomEvent<boolean>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelEngineCustomEvent } from '@kritzel/engine/dist/components';
import type { KritzelEngineState as IKritzelEngineKritzelEngineState } from '@kritzel/engine/dist/components';
import type { KritzelBaseTool as IKritzelEngineKritzelBaseTool } from '@kritzel/engine/dist/components';
import type { KritzelWorkspace as IKritzelEngineKritzelWorkspace } from '@kritzel/engine/dist/components';
import type { KritzelBaseObject as IKritzelEngineKritzelBaseObject } from '@kritzel/engine/dist/components';
import type { ObjectsAddedEvent as IKritzelEngineObjectsAddedEvent } from '@kritzel/engine/dist/components';
import type { ObjectsRemovedEvent as IKritzelEngineObjectsRemovedEvent } from '@kritzel/engine/dist/components';
import type { ObjectsUpdatedEvent as IKritzelEngineObjectsUpdatedEvent } from '@kritzel/engine/dist/components';
import type { KritzelUndoState as IKritzelEngineKritzelUndoState } from '@kritzel/engine/dist/components';
import type { ObjectsInViewportChangeEvent as IKritzelEngineObjectsInViewportChangeEvent } from '@kritzel/engine/dist/components';
import type { KritzelViewportState as IKritzelEngineKritzelViewportState } from '@kritzel/engine/dist/components';
import type { KritzelNotification as IKritzelEngineKritzelNotification } from '@kritzel/engine/dist/components';
import type { KritzelContextMenuState as IKritzelEngineKritzelContextMenuState } from '@kritzel/engine/dist/components';

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
   * Emitted when the set of selected objects changes.
   */
  objectsSelectionChange: EventEmitter<KritzelEngineCustomEvent<IKritzelEngineKritzelBaseObject[]>>;
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
   * Emitted while the selected workspace's objects are being initialized and synchronized.
   */
  isLoadingChange: EventEmitter<KritzelEngineCustomEvent<boolean>>;
}


