/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@upmade/engine/dist/components';

import { defineCustomElement as defineUpmadeEngine } from '@upmade/engine/dist/components/upmade-engine.js';
@ProxyCmp({
  defineCustomElementFn: defineUpmadeEngine,
  inputs: ['activeWorkspaceId', 'assetStorageConfig', 'chatSession', 'cursorTarget', 'debugInfo', 'editorId', 'fallbackLocale', 'globalContextMenuItems', 'isPanningEnabled', 'isWatermarkVisible', 'isZoomingEnabled', 'locale', 'locales', 'lockDrawingScale', 'objectConfig', 'objectContextMenuItems', 'objectTitlebar', 'scaleMax', 'scaleMin', 'syncConfig', 'theme', 'themes', 'tools', 'user', 'viewportBoundaryBottom', 'viewportBoundaryLeft', 'viewportBoundaryRight', 'viewportBoundaryTop', 'workspaces'],
  methods: ['triggerSelectionChange', 'beginSceneBootstrap', 'endSceneBootstrap', 'registerTool', 'setActiveTool', 'disable', 'enable', 'delete', 'copy', 'cut', 'paste', 'bringForward', 'sendBackward', 'bringToFront', 'sendToBack', 'alignObjects', 'group', 'ungroup', 'undo', 'redo', 'hideContextMenu', 'closeObjectTitlebarMenu', 'selectObjectTitlebarMenuItem', 'openContextMenu', 'getObjectById', 'getAllObjects', 'findObjects', 'getObjectsTotalCount', 'addObject', 'addObjects', 'updateObject', 'removeObject', 'removeObjects', 'getSelectedObjects', 'getDisplayableShortcuts', 'selectObjects', 'selectAllObjectsInViewport', 'clearSelection', 'centerObjectInViewport', 'panToObject', 'backToContent', 'centerAllObjects', 'centerObjects', 'setViewport', 'panTo', 'zoomTo', 'zoomIn', 'zoomOut', 'getViewport', 'screenToWorld', 'worldToScreen', 'getObjectsInViewport', 'addAgent', 'removeAgent', 'getAgent', 'getAgents', 'getRemoteAgents', 'setObjectElementPicking', 'highlightObjectElements', 'clearObjectElementHighlights', 'queryObjectElements', 'getScreenshot', 'exportViewportAsPng', 'exportViewportAsSvg', 'getSelectedObjectSupportedExportFormats', 'canExportSelectedObjectAs', 'exportSelectedObject', 'exportAsJson', 'importFromJson', 'loadObjectsFromJson', 'downloadAsJson', 'importFromFile', 'cancelImportFromFile', 'setActiveWorkspace', 'createWorkspace', 'updateWorkspace', 'deleteWorkspace', 'getWorkspaces', 'getActiveWorkspace', 'getIsPublic', 'loadSharedWorkspace', 'reinitSync', 'saveSettings', 'loadSettings', 'registerLocales', 'configureLocales', 'setLocale', 'getLocale', 'getAvailableLocales', 'getAvailableLocaleOptions', 't', 'getResolvedTerms', 'getTool']
})
@Component({
  selector: 'upmade-engine',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeWorkspaceId', 'assetStorageConfig', 'chatSession', 'cursorTarget', 'debugInfo', 'editorId', 'fallbackLocale', 'globalContextMenuItems', 'isPanningEnabled', 'isWatermarkVisible', 'isZoomingEnabled', 'locale', 'locales', 'lockDrawingScale', 'objectConfig', 'objectContextMenuItems', 'objectTitlebar', 'scaleMax', 'scaleMin', 'syncConfig', 'theme', 'themes', 'tools', 'user', 'viewportBoundaryBottom', 'viewportBoundaryLeft', 'viewportBoundaryRight', 'viewportBoundaryTop', 'workspaces'],
  outputs: ['isEngineReady', 'activeToolChange', 'workspacesChange', 'activeWorkspaceChange', 'longpress', 'objectsChange', 'objectsAdded', 'objectsRemoved', 'objectsUpdated', 'objectsSelectionChange', 'undoStateChange', 'objectsInViewportChange', 'viewportChange', 'awarenessChange', 'notificationsChange', 'contextMenuStateChange', 'isLoadingChange', 'agentsChange', 'objectTitlebarAction', 'objectTitlebarMenuStateChange', 'objectElementHover', 'objectElementClick', 'objectElementPick'],
})
export class UpmadeEngine {
  protected el: HTMLUpmadeEngineElement;
  @Output() isEngineReady = new EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeEngineState>>();
  @Output() activeToolChange = new EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeBaseTool>>();
  @Output() workspacesChange = new EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeWorkspace[]>>();
  @Output() activeWorkspaceChange = new EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeWorkspace>>();
  @Output() longpress = new EventEmitter<UpmadeEngineCustomEvent<PointerEvent>>();
  @Output() objectsChange = new EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeBaseObject[]>>();
  @Output() objectsAdded = new EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineObjectsAddedEvent>>();
  @Output() objectsRemoved = new EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineObjectsRemovedEvent>>();
  @Output() objectsUpdated = new EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineObjectsUpdatedEvent>>();
  @Output() objectsSelectionChange = new EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeBaseObject[]>>();
  @Output() undoStateChange = new EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeUndoState>>();
  @Output() objectsInViewportChange = new EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineObjectsInViewportChangeEvent>>();
  @Output() viewportChange = new EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeViewportState>>();
  @Output() awarenessChange = new EventEmitter<UpmadeEngineCustomEvent<Map<number, Record<string, any>>>>();
  @Output() notificationsChange = new EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeNotification>>();
  @Output() contextMenuStateChange = new EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeContextMenuState>>();
  @Output() isLoadingChange = new EventEmitter<UpmadeEngineCustomEvent<boolean>>();
  @Output() agentsChange = new EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeAgentsChangeEvent>>();
  @Output() objectTitlebarAction = new EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeObjectTitlebarActionEvent>>();
  @Output() objectTitlebarMenuStateChange = new EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeObjectTitlebarMenuState>>();
  @Output() objectElementHover = new EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeObjectElementHoverEvent>>();
  @Output() objectElementClick = new EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeObjectElementClickEvent>>();
  @Output() objectElementPick = new EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeObjectElementPickEvent>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { UpmadeEngineCustomEvent } from '@upmade/engine/dist/components';
import type { UpmadeEngineState as IUpmadeEngineUpmadeEngineState } from '@upmade/engine/dist/components';
import type { UpmadeBaseTool as IUpmadeEngineUpmadeBaseTool } from '@upmade/engine/dist/components';
import type { UpmadeWorkspace as IUpmadeEngineUpmadeWorkspace } from '@upmade/engine/dist/components';
import type { UpmadeBaseObject as IUpmadeEngineUpmadeBaseObject } from '@upmade/engine/dist/components';
import type { ObjectsAddedEvent as IUpmadeEngineObjectsAddedEvent } from '@upmade/engine/dist/components';
import type { ObjectsRemovedEvent as IUpmadeEngineObjectsRemovedEvent } from '@upmade/engine/dist/components';
import type { ObjectsUpdatedEvent as IUpmadeEngineObjectsUpdatedEvent } from '@upmade/engine/dist/components';
import type { UpmadeUndoState as IUpmadeEngineUpmadeUndoState } from '@upmade/engine/dist/components';
import type { ObjectsInViewportChangeEvent as IUpmadeEngineObjectsInViewportChangeEvent } from '@upmade/engine/dist/components';
import type { UpmadeViewportState as IUpmadeEngineUpmadeViewportState } from '@upmade/engine/dist/components';
import type { UpmadeNotification as IUpmadeEngineUpmadeNotification } from '@upmade/engine/dist/components';
import type { UpmadeContextMenuState as IUpmadeEngineUpmadeContextMenuState } from '@upmade/engine/dist/components';
import type { UpmadeAgentsChangeEvent as IUpmadeEngineUpmadeAgentsChangeEvent } from '@upmade/engine/dist/components';
import type { UpmadeObjectTitlebarActionEvent as IUpmadeEngineUpmadeObjectTitlebarActionEvent } from '@upmade/engine/dist/components';
import type { UpmadeObjectTitlebarMenuState as IUpmadeEngineUpmadeObjectTitlebarMenuState } from '@upmade/engine/dist/components';
import type { UpmadeObjectElementHoverEvent as IUpmadeEngineUpmadeObjectElementHoverEvent } from '@upmade/engine/dist/components';
import type { UpmadeObjectElementClickEvent as IUpmadeEngineUpmadeObjectElementClickEvent } from '@upmade/engine/dist/components';
import type { UpmadeObjectElementPickEvent as IUpmadeEngineUpmadeObjectElementPickEvent } from '@upmade/engine/dist/components';

export declare interface UpmadeEngine extends Components.UpmadeEngine {
  /**
   * Emitted when the engine has fully initialized and is ready for interaction.
   */
  isEngineReady: EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeEngineState>>;
  /**
   * Emitted when the active drawing tool changes.
   */
  activeToolChange: EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeBaseTool>>;
  /**
   * Emitted when workspaces are created, updated, or deleted.
   */
  workspacesChange: EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeWorkspace[]>>;
  /**
   * Emitted when the active workspace changes (e.g., after import).
   */
  activeWorkspaceChange: EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeWorkspace>>;
  /**
   * Emitted on long-press (touch/pen). Useful for showing custom context menus on mobile.
   */
  longpress: EventEmitter<UpmadeEngineCustomEvent<PointerEvent>>;
  /**
   * Emitted when objects on the canvas are added, removed, or modified.
   */
  objectsChange: EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeBaseObject[]>>;
  /**
   * Emitted when one or more objects are added to the canvas. `source` is set when an agent made the change.
   */
  objectsAdded: EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineObjectsAddedEvent>>;
  /**
   * Emitted when one or more objects are removed from the canvas. `source` is set when an agent made the change.
   */
  objectsRemoved: EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineObjectsRemovedEvent>>;
  /**
   * Emitted when one or more objects are updated on the canvas. `source` is set when an agent made the change.
   */
  objectsUpdated: EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineObjectsUpdatedEvent>>;
  /**
   * Emitted when the set of selected objects changes.
   */
  objectsSelectionChange: EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeBaseObject[]>>;
  /**
   * Emitted when the undo/redo state changes, providing current undo availability.
   */
  undoStateChange: EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeUndoState>>;
  /**
   * Emitted when the set of objects visible in the current viewport changes (e.g., after pan or zoom).
   */
  objectsInViewportChange: EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineObjectsInViewportChangeEvent>>;
  /**
   * Emitted when the viewport position, scale, or dimensions change (e.g., after pan, zoom, or resize).
   */
  viewportChange: EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeViewportState>>;
  /**
   * Emitted when the awareness state changes (remote user cursors, presence).
   */
  awarenessChange: EventEmitter<UpmadeEngineCustomEvent<Map<number, Record<string, any>>>>;
  /**
   * Emitted when notifications change.
   */
  notificationsChange: EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeNotification>>;
  /**
   * Emitted when context-menu visibility, items, or position changes.
   */
  contextMenuStateChange: EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeContextMenuState>>;
  /**
   * Emitted while the selected workspace's objects are being initialized and synchronized.
   */
  isLoadingChange: EventEmitter<UpmadeEngineCustomEvent<boolean>>;
  /**
   * Emitted when agents are added or removed, or when what the avatar stack shows of them changes
(name, color, avatar, status, visibility, activity). Lists the local agents first, then the agents of
collaborators (`isRemote: true`). Never emitted for plain cursor motion.
   */
  agentsChange: EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeAgentsChangeEvent>>;
  /**
   * Emitted when a button or a menu item in an object titlebar is clicked.
   */
  objectTitlebarAction: EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeObjectTitlebarActionEvent>>;
  /**
   * Emitted when a titlebar menu opens or closes. The engine renders no menu itself; hosts render
`items` anchored to `anchor` and report selections through `selectObjectTitlebarMenuItem`.
   */
  objectTitlebarMenuStateChange: EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeObjectTitlebarMenuState>>;
  /**
   * Emitted when the pointer moves onto another element inside the content of an interactive (selected) object,
such as an iframe object, and with `element: null` when it leaves the content or the object stops being interactive.
   */
  objectElementHover: EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeObjectElementHoverEvent>>;
  /**
   * Emitted when the user clicks an element inside the content of an interactive (selected) object. The click works as usual.
   */
  objectElementClick: EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeObjectElementClickEvent>>;
  /**
   * Emitted when the user picks an element inside an object that is picking elements, see `setObjectElementPicking`.
   */
  objectElementPick: EventEmitter<UpmadeEngineCustomEvent<IUpmadeEngineUpmadeObjectElementPickEvent>>;
}


