/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@updraw/engine/dist/components';

import { defineCustomElement as defineUpdrawEngine } from '@updraw/engine/dist/components/updraw-engine.js';
@ProxyCmp({
  defineCustomElementFn: defineUpdrawEngine,
  inputs: ['activeWorkspaceId', 'assetStorageConfig', 'chatSession', 'cursorTarget', 'debugInfo', 'editorId', 'fallbackLocale', 'globalContextMenuItems', 'isPanningEnabled', 'isWatermarkVisible', 'isZoomingEnabled', 'locale', 'locales', 'lockDrawingScale', 'objectConfig', 'objectContextMenuItems', 'objectTitlebar', 'scaleMax', 'scaleMin', 'syncConfig', 'theme', 'themes', 'tools', 'user', 'viewportBoundaryBottom', 'viewportBoundaryLeft', 'viewportBoundaryRight', 'viewportBoundaryTop', 'workspaces'],
  methods: ['triggerSelectionChange', 'beginSceneBootstrap', 'endSceneBootstrap', 'registerTool', 'setActiveTool', 'disable', 'enable', 'delete', 'copy', 'cut', 'paste', 'bringForward', 'sendBackward', 'bringToFront', 'sendToBack', 'alignObjects', 'group', 'ungroup', 'undo', 'redo', 'hideContextMenu', 'closeObjectTitlebarMenu', 'selectObjectTitlebarMenuItem', 'openContextMenu', 'getObjectById', 'getAllObjects', 'findObjects', 'getObjectsTotalCount', 'addObject', 'addObjects', 'updateObject', 'removeObject', 'removeObjects', 'getSelectedObjects', 'getDisplayableShortcuts', 'selectObjects', 'selectAllObjectsInViewport', 'clearSelection', 'centerObjectInViewport', 'panToObject', 'backToContent', 'centerAllObjects', 'centerObjects', 'setViewport', 'panTo', 'zoomTo', 'zoomIn', 'zoomOut', 'getViewport', 'screenToWorld', 'worldToScreen', 'getObjectsInViewport', 'addAgent', 'removeAgent', 'getAgent', 'getAgents', 'getRemoteAgents', 'setObjectElementPicking', 'highlightObjectElements', 'clearObjectElementHighlights', 'queryObjectElements', 'getScreenshot', 'exportViewportAsPng', 'exportViewportAsSvg', 'getSelectedObjectSupportedExportFormats', 'canExportSelectedObjectAs', 'exportSelectedObject', 'exportAsJson', 'importFromJson', 'loadObjectsFromJson', 'downloadAsJson', 'importFromFile', 'cancelImportFromFile', 'setActiveWorkspace', 'createWorkspace', 'updateWorkspace', 'deleteWorkspace', 'getWorkspaces', 'getActiveWorkspace', 'getIsPublic', 'loadSharedWorkspace', 'reinitSync', 'saveSettings', 'loadSettings', 'registerLocales', 'configureLocales', 'setLocale', 'getLocale', 'getAvailableLocales', 'getAvailableLocaleOptions', 't', 'getResolvedTerms', 'getTool']
})
@Component({
  selector: 'updraw-engine',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeWorkspaceId', 'assetStorageConfig', 'chatSession', 'cursorTarget', 'debugInfo', 'editorId', 'fallbackLocale', 'globalContextMenuItems', 'isPanningEnabled', 'isWatermarkVisible', 'isZoomingEnabled', 'locale', 'locales', 'lockDrawingScale', 'objectConfig', 'objectContextMenuItems', 'objectTitlebar', 'scaleMax', 'scaleMin', 'syncConfig', 'theme', 'themes', 'tools', 'user', 'viewportBoundaryBottom', 'viewportBoundaryLeft', 'viewportBoundaryRight', 'viewportBoundaryTop', 'workspaces'],
  outputs: ['isEngineReady', 'activeToolChange', 'workspacesChange', 'activeWorkspaceChange', 'longpress', 'objectsChange', 'objectsAdded', 'objectsRemoved', 'objectsUpdated', 'objectsSelectionChange', 'undoStateChange', 'objectsInViewportChange', 'viewportChange', 'awarenessChange', 'notificationsChange', 'contextMenuStateChange', 'isLoadingChange', 'agentsChange', 'objectTitlebarAction', 'objectTitlebarMenuStateChange', 'objectElementHover', 'objectElementClick', 'objectElementPick'],
})
export class UpdrawEngine {
  protected el: HTMLUpdrawEngineElement;
  @Output() isEngineReady = new EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawEngineState>>();
  @Output() activeToolChange = new EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawBaseTool>>();
  @Output() workspacesChange = new EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawWorkspace[]>>();
  @Output() activeWorkspaceChange = new EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawWorkspace>>();
  @Output() longpress = new EventEmitter<UpdrawEngineCustomEvent<PointerEvent>>();
  @Output() objectsChange = new EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawBaseObject[]>>();
  @Output() objectsAdded = new EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineObjectsAddedEvent>>();
  @Output() objectsRemoved = new EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineObjectsRemovedEvent>>();
  @Output() objectsUpdated = new EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineObjectsUpdatedEvent>>();
  @Output() objectsSelectionChange = new EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawBaseObject[]>>();
  @Output() undoStateChange = new EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawUndoState>>();
  @Output() objectsInViewportChange = new EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineObjectsInViewportChangeEvent>>();
  @Output() viewportChange = new EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawViewportState>>();
  @Output() awarenessChange = new EventEmitter<UpdrawEngineCustomEvent<Map<number, Record<string, any>>>>();
  @Output() notificationsChange = new EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawNotification>>();
  @Output() contextMenuStateChange = new EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawContextMenuState>>();
  @Output() isLoadingChange = new EventEmitter<UpdrawEngineCustomEvent<boolean>>();
  @Output() agentsChange = new EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawAgentsChangeEvent>>();
  @Output() objectTitlebarAction = new EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawObjectTitlebarActionEvent>>();
  @Output() objectTitlebarMenuStateChange = new EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawObjectTitlebarMenuState>>();
  @Output() objectElementHover = new EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawObjectElementHoverEvent>>();
  @Output() objectElementClick = new EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawObjectElementClickEvent>>();
  @Output() objectElementPick = new EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawObjectElementPickEvent>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { UpdrawEngineCustomEvent } from '@updraw/engine/dist/components';
import type { UpdrawEngineState as IUpdrawEngineUpdrawEngineState } from '@updraw/engine/dist/components';
import type { UpdrawBaseTool as IUpdrawEngineUpdrawBaseTool } from '@updraw/engine/dist/components';
import type { UpdrawWorkspace as IUpdrawEngineUpdrawWorkspace } from '@updraw/engine/dist/components';
import type { UpdrawBaseObject as IUpdrawEngineUpdrawBaseObject } from '@updraw/engine/dist/components';
import type { ObjectsAddedEvent as IUpdrawEngineObjectsAddedEvent } from '@updraw/engine/dist/components';
import type { ObjectsRemovedEvent as IUpdrawEngineObjectsRemovedEvent } from '@updraw/engine/dist/components';
import type { ObjectsUpdatedEvent as IUpdrawEngineObjectsUpdatedEvent } from '@updraw/engine/dist/components';
import type { UpdrawUndoState as IUpdrawEngineUpdrawUndoState } from '@updraw/engine/dist/components';
import type { ObjectsInViewportChangeEvent as IUpdrawEngineObjectsInViewportChangeEvent } from '@updraw/engine/dist/components';
import type { UpdrawViewportState as IUpdrawEngineUpdrawViewportState } from '@updraw/engine/dist/components';
import type { UpdrawNotification as IUpdrawEngineUpdrawNotification } from '@updraw/engine/dist/components';
import type { UpdrawContextMenuState as IUpdrawEngineUpdrawContextMenuState } from '@updraw/engine/dist/components';
import type { UpdrawAgentsChangeEvent as IUpdrawEngineUpdrawAgentsChangeEvent } from '@updraw/engine/dist/components';
import type { UpdrawObjectTitlebarActionEvent as IUpdrawEngineUpdrawObjectTitlebarActionEvent } from '@updraw/engine/dist/components';
import type { UpdrawObjectTitlebarMenuState as IUpdrawEngineUpdrawObjectTitlebarMenuState } from '@updraw/engine/dist/components';
import type { UpdrawObjectElementHoverEvent as IUpdrawEngineUpdrawObjectElementHoverEvent } from '@updraw/engine/dist/components';
import type { UpdrawObjectElementClickEvent as IUpdrawEngineUpdrawObjectElementClickEvent } from '@updraw/engine/dist/components';
import type { UpdrawObjectElementPickEvent as IUpdrawEngineUpdrawObjectElementPickEvent } from '@updraw/engine/dist/components';

export declare interface UpdrawEngine extends Components.UpdrawEngine {
  /**
   * Emitted when the engine has fully initialized and is ready for interaction.
   */
  isEngineReady: EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawEngineState>>;
  /**
   * Emitted when the active drawing tool changes.
   */
  activeToolChange: EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawBaseTool>>;
  /**
   * Emitted when workspaces are created, updated, or deleted.
   */
  workspacesChange: EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawWorkspace[]>>;
  /**
   * Emitted when the active workspace changes (e.g., after import).
   */
  activeWorkspaceChange: EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawWorkspace>>;
  /**
   * Emitted on long-press (touch/pen). Useful for showing custom context menus on mobile.
   */
  longpress: EventEmitter<UpdrawEngineCustomEvent<PointerEvent>>;
  /**
   * Emitted when objects on the canvas are added, removed, or modified.
   */
  objectsChange: EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawBaseObject[]>>;
  /**
   * Emitted when one or more objects are added to the canvas. `source` is set when an agent made the change.
   */
  objectsAdded: EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineObjectsAddedEvent>>;
  /**
   * Emitted when one or more objects are removed from the canvas. `source` is set when an agent made the change.
   */
  objectsRemoved: EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineObjectsRemovedEvent>>;
  /**
   * Emitted when one or more objects are updated on the canvas. `source` is set when an agent made the change.
   */
  objectsUpdated: EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineObjectsUpdatedEvent>>;
  /**
   * Emitted when the set of selected objects changes.
   */
  objectsSelectionChange: EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawBaseObject[]>>;
  /**
   * Emitted when the undo/redo state changes, providing current undo availability.
   */
  undoStateChange: EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawUndoState>>;
  /**
   * Emitted when the set of objects visible in the current viewport changes (e.g., after pan or zoom).
   */
  objectsInViewportChange: EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineObjectsInViewportChangeEvent>>;
  /**
   * Emitted when the viewport position, scale, or dimensions change (e.g., after pan, zoom, or resize).
   */
  viewportChange: EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawViewportState>>;
  /**
   * Emitted when the awareness state changes (remote user cursors, presence).
   */
  awarenessChange: EventEmitter<UpdrawEngineCustomEvent<Map<number, Record<string, any>>>>;
  /**
   * Emitted when notifications change.
   */
  notificationsChange: EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawNotification>>;
  /**
   * Emitted when context-menu visibility, items, or position changes.
   */
  contextMenuStateChange: EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawContextMenuState>>;
  /**
   * Emitted while the selected workspace's objects are being initialized and synchronized.
   */
  isLoadingChange: EventEmitter<UpdrawEngineCustomEvent<boolean>>;
  /**
   * Emitted when agents are added or removed, or when what the avatar stack shows of them changes
(name, color, avatar, status, visibility, activity). Lists the local agents first, then the agents of
collaborators (`isRemote: true`). Never emitted for plain cursor motion.
   */
  agentsChange: EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawAgentsChangeEvent>>;
  /**
   * Emitted when a button or a menu item in an object titlebar is clicked.
   */
  objectTitlebarAction: EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawObjectTitlebarActionEvent>>;
  /**
   * Emitted when a titlebar menu opens or closes. The engine renders no menu itself; hosts render
`items` anchored to `anchor` and report selections through `selectObjectTitlebarMenuItem`.
   */
  objectTitlebarMenuStateChange: EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawObjectTitlebarMenuState>>;
  /**
   * Emitted when the pointer moves onto another element inside the content of an interactive (selected) object,
such as an iframe object, and with `element: null` when it leaves the content or the object stops being interactive.
   */
  objectElementHover: EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawObjectElementHoverEvent>>;
  /**
   * Emitted when the user clicks an element inside the content of an interactive (selected) object. The click works as usual.
   */
  objectElementClick: EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawObjectElementClickEvent>>;
  /**
   * Emitted when the user picks an element inside an object that is picking elements, see `setObjectElementPicking`.
   */
  objectElementPick: EventEmitter<UpdrawEngineCustomEvent<IUpdrawEngineUpdrawObjectElementPickEvent>>;
}


