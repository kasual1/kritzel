/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@upmade/editor/dist/components';

import { defineCustomElement as defineUpmadeChatBox } from '@upmade/editor/dist/components/upmade-chat-box.js';
import { defineCustomElement as defineUpmadeEditor } from '@upmade/editor/dist/components/upmade-editor.js';
import { defineCustomElement as defineUpmadeSettings } from '@upmade/editor/dist/components/upmade-settings.js';
import { defineCustomElement as defineUpmadeShapeFill } from '@upmade/editor/dist/components/upmade-shape-fill.js';
import { defineCustomElement as defineUpmadeShareDialog } from '@upmade/editor/dist/components/upmade-share-dialog.js';
import { defineCustomElement as defineUpmadeSplitButton } from '@upmade/editor/dist/components/upmade-split-button.js';
import { defineCustomElement as defineUpmadeStrokeSize } from '@upmade/editor/dist/components/upmade-stroke-size.js';
@ProxyCmp({
  defineCustomElementFn: defineUpmadeChatBox,
  inputs: ['chips', 'disabled', 'loading', 'mode', 'placeholder', 'terms', 'value']
})
@Component({
  selector: 'upmade-chat-box',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['chips', 'disabled', 'loading', 'mode', 'placeholder', 'terms', 'value'],
  outputs: ['chatSubmit', 'chatStop', 'modeChange', 'chatChipRemove'],
})
export class UpmadeChatBox {
  protected el: HTMLUpmadeChatBoxElement;
  @Output() chatSubmit = new EventEmitter<UpmadeChatBoxCustomEvent<string>>();
  @Output() chatStop = new EventEmitter<UpmadeChatBoxCustomEvent<void>>();
  @Output() modeChange = new EventEmitter<UpmadeChatBoxCustomEvent<IUpmadeChatBoxUpmadeChatBoxMode>>();
  @Output() chatChipRemove = new EventEmitter<UpmadeChatBoxCustomEvent<IUpmadeChatBoxUpmadeChatBoxChip>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { UpmadeChatBoxCustomEvent } from '@upmade/editor/dist/components';
import type { UpmadeChatBoxMode as IUpmadeChatBoxUpmadeChatBoxMode } from '@upmade/editor/dist/components';
import type { UpmadeChatBoxChip as IUpmadeChatBoxUpmadeChatBoxChip } from '@upmade/editor/dist/components';

export declare interface UpmadeChatBox extends Components.UpmadeChatBox {
  /**
   * Emitted with the current text when the user submits the chat box.
   */
  chatSubmit: EventEmitter<UpmadeChatBoxCustomEvent<string>>;
  /**
   * Emitted when the user stops the current response.
   */
  chatStop: EventEmitter<UpmadeChatBoxCustomEvent<void>>;
  /**
   * Emitted when the mode changes, including automatic expansion.
   */
  modeChange: EventEmitter<UpmadeChatBoxCustomEvent<IUpmadeChatBoxUpmadeChatBoxMode>>;
  /**
   * Emitted with the chip whose remove button the user activated. The chip stays until `chips` no longer contains it.
   */
  chatChipRemove: EventEmitter<UpmadeChatBoxCustomEvent<IUpmadeChatBoxUpmadeChatBoxChip>>;
}


@ProxyCmp({
  defineCustomElementFn: defineUpmadeEditor,
  inputs: ['activeUsers', 'activeWorkspaceId', 'assetStorageConfig', 'chatBoxChips', 'chatBoxMode', 'chatSession', 'cursorTarget', 'customFonts', 'customSvgIcons', 'debugInfo', 'editorId', 'fallbackLocale', 'globalContextMenuItems', 'isAgentAvatarsVisible', 'isChatBoxLoading', 'isChatBoxVisible', 'isMoreMenuVisible', 'isPanningEnabled', 'isToolbarVisible', 'isUtilityPanelVisible', 'isWatermarkVisible', 'isWorkspaceManagerVisible', 'isZoomPanelVisible', 'isZoomingEnabled', 'locale', 'locales', 'lockDrawingScale', 'loginConfig', 'moreMenuItems', 'objectConfig', 'objectContextMenuItems', 'objectTitlebar', 'scaleMax', 'scaleMin', 'syncConfig', 'theme', 'themes', 'toolbarItems', 'user', 'viewportBoundaryBottom', 'viewportBoundaryLeft', 'viewportBoundaryRight', 'viewportBoundaryTop', 'workspaces'],
  methods: ['getObjectById', 'addObject', 'addObjects', 'updateObject', 'removeObject', 'removeObjects', 'getSelectedObjects', 'selectObjects', 'selectAllObjectsInViewport', 'clearSelection', 'centerObjectInViewport', 'panToObject', 'backToContent', 'centerAllObjects', 'centerObjects', 'setViewport', 'panTo', 'zoomTo', 'zoomIn', 'zoomOut', 'getViewport', 'screenToWorld', 'worldToScreen', 'setActiveWorkspace', 'createWorkspace', 'updateWorkspace', 'deleteWorkspace', 'getWorkspaces', 'getActiveWorkspace', 'loadSharedWorkspace', 'reinitSync', 'registerTool', 'setActiveTool', 'disable', 'enable', 'copy', 'cut', 'paste', 'delete', 'bringForward', 'sendBackward', 'bringToFront', 'sendToBack', 'alignObjects', 'group', 'ungroup', 'undo', 'redo', 'getScreenshot', 'exportViewportAsPng', 'exportViewportAsSvg', 'getSelectedObjectSupportedExportFormats', 'canExportSelectedObjectAs', 'exportSelectedObject', 'exportAsJson', 'importFromJson', 'downloadAsJson', 'importFromFile', 'loadObjectsFromJson', 'getObjectsTotalCount', 'getAllObjects', 'findObjects', 'getObjectsInViewport', 'addAgent', 'removeAgent', 'getAgent', 'getAgents', 'getRemoteAgents', 'setObjectElementPicking', 'highlightObjectElements', 'clearObjectElementHighlights', 'queryObjectElements', 'hideContextMenu', 'openContextMenu', 'openWorkspaceManagerMenu', 'closeWorkspaceManagerMenu', 'openMoreMenu', 'closeMoreMenu', 'openUserDialog', 'closeUserDialog', 'openExportDialog', 'closeExportDialog', 'openImportDialog', 'closeImportDialog', 'openSettingsDialog', 'closeSettingsDialog', 'openShareDialog', 'closeShareDialog', 'triggerSelectionChange', 'beginSceneBootstrap', 'endSceneBootstrap', 'getDisplayableShortcuts', 'openLoginDialog', 'closeLoginDialog', 'setLoginLoading', 'setLocale', 'getLocale', 'getAvailableLocales', 'registerLocales', 'registerFonts', 't', 'triggerNotification']
})
@Component({
  selector: 'upmade-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeUsers', 'activeWorkspaceId', 'assetStorageConfig', 'chatBoxChips', 'chatBoxMode', 'chatSession', 'cursorTarget', 'customFonts', 'customSvgIcons', 'debugInfo', 'editorId', 'fallbackLocale', 'globalContextMenuItems', 'isAgentAvatarsVisible', 'isChatBoxLoading', 'isChatBoxVisible', 'isMoreMenuVisible', 'isPanningEnabled', 'isToolbarVisible', 'isUtilityPanelVisible', 'isWatermarkVisible', 'isWorkspaceManagerVisible', 'isZoomPanelVisible', 'isZoomingEnabled', 'locale', 'locales', 'lockDrawingScale', 'loginConfig', 'moreMenuItems', 'objectConfig', 'objectContextMenuItems', 'objectTitlebar', 'scaleMax', 'scaleMin', 'syncConfig', 'theme', 'themes', 'toolbarItems', 'user', 'viewportBoundaryBottom', 'viewportBoundaryLeft', 'viewportBoundaryRight', 'viewportBoundaryTop', 'workspaces'],
  outputs: ['isReady', 'activeWorkspaceChange', 'objectsChange', 'objectsAdded', 'objectsRemoved', 'objectsUpdated', 'objectsSelectionChange', 'undoStateChange', 'themeChange', 'localeChange', 'viewportChange', 'logout', 'login', 'isPublicChange', 'awarenessChange', 'chatSubmit', 'chatStop', 'chatChipRemove', 'agentsChange', 'objectTitlebarAction', 'objectElementHover', 'objectElementClick', 'objectElementPick'],
})
export class UpmadeEditor {
  protected el: HTMLUpmadeEditorElement;
  @Output() isReady = new EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorEditorIsReadyEvent>>();
  @Output() activeWorkspaceChange = new EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorActiveWorkspaceChangeEvent>>();
  @Output() objectsChange = new EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorUpmadeBaseObject[]>>();
  @Output() objectsAdded = new EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorObjectsAddedEvent>>();
  @Output() objectsRemoved = new EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorObjectsRemovedEvent>>();
  @Output() objectsUpdated = new EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorObjectsUpdatedEvent>>();
  @Output() objectsSelectionChange = new EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorUpmadeBaseObject[]>>();
  @Output() undoStateChange = new EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorUpmadeUndoState>>();
  @Output() themeChange = new EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorThemeName>>();
  @Output() localeChange = new EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorLocaleCode>>();
  @Output() viewportChange = new EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorUpmadeViewportState>>();
  @Output() logout = new EventEmitter<UpmadeEditorCustomEvent<void>>();
  @Output() login = new EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorLoginEvent>>();
  @Output() isPublicChange = new EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorIUpmadeIsPublicChangeEvent>>();
  @Output() awarenessChange = new EventEmitter<UpmadeEditorCustomEvent<Map<number, Record<string, any>>>>();
  @Output() chatSubmit = new EventEmitter<UpmadeEditorCustomEvent<string>>();
  @Output() chatStop = new EventEmitter<UpmadeEditorCustomEvent<void>>();
  @Output() chatChipRemove = new EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorUpmadeChatBoxChip>>();
  @Output() agentsChange = new EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorUpmadeAgentsChangeEvent>>();
  @Output() objectTitlebarAction = new EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorUpmadeObjectTitlebarActionEvent>>();
  @Output() objectElementHover = new EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorUpmadeObjectElementHoverEvent>>();
  @Output() objectElementClick = new EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorUpmadeObjectElementClickEvent>>();
  @Output() objectElementPick = new EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorUpmadeObjectElementPickEvent>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { UpmadeEditorCustomEvent } from '@upmade/editor/dist/components';
import type { EditorIsReadyEvent as IUpmadeEditorEditorIsReadyEvent } from '@upmade/editor/dist/components';
import type { ActiveWorkspaceChangeEvent as IUpmadeEditorActiveWorkspaceChangeEvent } from '@upmade/editor/dist/components';
import type { UpmadeBaseObject as IUpmadeEditorUpmadeBaseObject } from '@upmade/editor/dist/components';
import type { ObjectsAddedEvent as IUpmadeEditorObjectsAddedEvent } from '@upmade/editor/dist/components';
import type { ObjectsRemovedEvent as IUpmadeEditorObjectsRemovedEvent } from '@upmade/editor/dist/components';
import type { ObjectsUpdatedEvent as IUpmadeEditorObjectsUpdatedEvent } from '@upmade/editor/dist/components';
import type { UpmadeUndoState as IUpmadeEditorUpmadeUndoState } from '@upmade/editor/dist/components';
import type { ThemeName as IUpmadeEditorThemeName } from '@upmade/editor/dist/components';
import type { LocaleCode as IUpmadeEditorLocaleCode } from '@upmade/editor/dist/components';
import type { UpmadeViewportState as IUpmadeEditorUpmadeViewportState } from '@upmade/editor/dist/components';
import type { LoginEvent as IUpmadeEditorLoginEvent } from '@upmade/editor/dist/components';
import type { IUpmadeIsPublicChangeEvent as IUpmadeEditorIUpmadeIsPublicChangeEvent } from '@upmade/editor/dist/components';
import type { UpmadeChatBoxChip as IUpmadeEditorUpmadeChatBoxChip } from '@upmade/editor/dist/components';
import type { UpmadeAgentsChangeEvent as IUpmadeEditorUpmadeAgentsChangeEvent } from '@upmade/editor/dist/components';
import type { UpmadeObjectTitlebarActionEvent as IUpmadeEditorUpmadeObjectTitlebarActionEvent } from '@upmade/editor/dist/components';
import type { UpmadeObjectElementHoverEvent as IUpmadeEditorUpmadeObjectElementHoverEvent } from '@upmade/editor/dist/components';
import type { UpmadeObjectElementClickEvent as IUpmadeEditorUpmadeObjectElementClickEvent } from '@upmade/editor/dist/components';
import type { UpmadeObjectElementPickEvent as IUpmadeEditorUpmadeObjectElementPickEvent } from '@upmade/editor/dist/components';

export declare interface UpmadeEditor extends Components.UpmadeEditor {

  isReady: EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorEditorIsReadyEvent>>;

  activeWorkspaceChange: EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorActiveWorkspaceChangeEvent>>;

  objectsChange: EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorUpmadeBaseObject[]>>;
  /**
   * Emitted when objects are added. `source` is set when an agent made the change.
   */
  objectsAdded: EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorObjectsAddedEvent>>;
  /**
   * Emitted when objects are removed. `source` is set when an agent made the change.
   */
  objectsRemoved: EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorObjectsRemovedEvent>>;
  /**
   * Emitted when objects are updated. `source` is set when an agent made the change.
   */
  objectsUpdated: EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorObjectsUpdatedEvent>>;

  objectsSelectionChange: EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorUpmadeBaseObject[]>>;

  undoStateChange: EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorUpmadeUndoState>>;

  themeChange: EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorThemeName>>;

  localeChange: EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorLocaleCode>>;

  viewportChange: EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorUpmadeViewportState>>;

  logout: EventEmitter<UpmadeEditorCustomEvent<void>>;

  login: EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorLoginEvent>>;

  isPublicChange: EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorIUpmadeIsPublicChangeEvent>>;

  awarenessChange: EventEmitter<UpmadeEditorCustomEvent<Map<number, Record<string, any>>>>;
  /**
   * Emitted with the chat box text when the user submits it. With a `chatSession`, the prompt is sent to it
unless a listener calls `preventDefault()`.
   */
  chatSubmit: EventEmitter<UpmadeEditorCustomEvent<string>>;
  /**
   * Emitted when the user stops the current chat response. A `chatSession` is stopped too.
   */
  chatStop: EventEmitter<UpmadeEditorCustomEvent<void>>;
  /**
   * Emitted with the chat box chip whose remove button the user activated. The chip stays until `chatBoxChips` no longer contains it.
   */
  chatChipRemove: EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorUpmadeChatBoxChip>>;
  /**
   * Emitted when agents are added or removed, or when what the avatar stack shows of them changes
(name, color, avatar, status, visibility, activity). Never emitted for plain cursor motion.
   */
  agentsChange: EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorUpmadeAgentsChangeEvent>>;
  /**
   * Emitted when a button or a menu item in an object titlebar is clicked.
   */
  objectTitlebarAction: EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorUpmadeObjectTitlebarActionEvent>>;
  /**
   * Emitted when the pointer moves onto another element inside the content of an interactive (selected) object,
such as an iframe object, and with `element: null` when it leaves the content or the object stops being interactive.
   */
  objectElementHover: EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorUpmadeObjectElementHoverEvent>>;
  /**
   * Emitted when the user clicks an element inside the content of an interactive (selected) object. The click works as usual.
   */
  objectElementClick: EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorUpmadeObjectElementClickEvent>>;
  /**
   * Emitted when the user picks an element inside an object that is picking elements, see `setObjectElementPicking`.
   */
  objectElementPick: EventEmitter<UpmadeEditorCustomEvent<IUpmadeEditorUpmadeObjectElementPickEvent>>;
}


@ProxyCmp({
  defineCustomElementFn: defineUpmadeSettings,
  inputs: ['availableLocales', 'availableThemes', 'settings', 'shortcuts', 'terms'],
  methods: ['open', 'close']
})
@Component({
  selector: 'upmade-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['availableLocales', 'availableThemes', 'settings', 'shortcuts', 'terms'],
  outputs: ['settingsChange'],
})
export class UpmadeSettings {
  protected el: HTMLUpmadeSettingsElement;
  @Output() settingsChange = new EventEmitter<UpmadeSettingsCustomEvent<IUpmadeSettingsUpmadeSettingsConfig>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { UpmadeSettingsCustomEvent } from '@upmade/editor/dist/components';
import type { UpmadeSettingsConfig as IUpmadeSettingsUpmadeSettingsConfig } from '@upmade/editor/dist/components';

export declare interface UpmadeSettings extends Components.UpmadeSettings {
  /**
   * Emitted when settings change
   */
  settingsChange: EventEmitter<UpmadeSettingsCustomEvent<IUpmadeSettingsUpmadeSettingsConfig>>;
}


@ProxyCmp({
  defineCustomElementFn: defineUpmadeShapeFill,
  inputs: ['value']
})
@Component({
  selector: 'upmade-shape-fill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['value'],
  outputs: ['valueChange'],
})
export class UpmadeShapeFill {
  protected el: HTMLUpmadeShapeFillElement;
  @Output() valueChange = new EventEmitter<UpmadeShapeFillCustomEvent<IUpmadeShapeFillShapeFillType>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { UpmadeShapeFillCustomEvent } from '@upmade/editor/dist/components';
import type { ShapeFillType as IUpmadeShapeFillShapeFillType } from '@upmade/editor/dist/components';

export declare interface UpmadeShapeFill extends Components.UpmadeShapeFill {

  valueChange: EventEmitter<UpmadeShapeFillCustomEvent<IUpmadeShapeFillShapeFillType>>;
}


@ProxyCmp({
  defineCustomElementFn: defineUpmadeShareDialog,
  inputs: ['isPublic', 'terms', 'workspaceId'],
  methods: ['open', 'close']
})
@Component({
  selector: 'upmade-share-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['isPublic', 'terms', 'workspaceId'],
  outputs: ['toggleIsPublic', 'dialogClosed'],
})
export class UpmadeShareDialog {
  protected el: HTMLUpmadeShareDialogElement;
  @Output() toggleIsPublic = new EventEmitter<UpmadeShareDialogCustomEvent<boolean>>();
  @Output() dialogClosed = new EventEmitter<UpmadeShareDialogCustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { UpmadeShareDialogCustomEvent } from '@upmade/editor/dist/components';

export declare interface UpmadeShareDialog extends Components.UpmadeShareDialog {
  /**
   * Emitted when the user toggles the public sharing state.
   */
  toggleIsPublic: EventEmitter<UpmadeShareDialogCustomEvent<boolean>>;
  /**
   * Emitted when the dialog is closed.
   */
  dialogClosed: EventEmitter<UpmadeShareDialogCustomEvent<void>>;
}


@ProxyCmp({
  defineCustomElementFn: defineUpmadeSplitButton,
  inputs: ['buttonIcon', 'dropdownIcon', 'items', 'mainButtonDisabled', 'menuButtonDisabled'],
  methods: ['open', 'close', 'focusMenu']
})
@Component({
  selector: 'upmade-split-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['buttonIcon', 'dropdownIcon', 'items', 'mainButtonDisabled', 'menuButtonDisabled'],
  outputs: ['mainButtonClick', 'itemSelect', 'itemSave', 'itemCancel', 'itemToggleChildMenu', 'itemCloseChildMenu', 'menuOpen', 'menuClose'],
})
export class UpmadeSplitButton {
  protected el: HTMLUpmadeSplitButtonElement;
  @Output() mainButtonClick = new EventEmitter<UpmadeSplitButtonCustomEvent<void>>();
  @Output() itemSelect = new EventEmitter<UpmadeSplitButtonCustomEvent<IUpmadeSplitButtonIUpmadeMenuItemSelectEvent>>();
  @Output() itemSave = new EventEmitter<UpmadeSplitButtonCustomEvent<IUpmadeSplitButtonIUpmadeMenuItem>>();
  @Output() itemCancel = new EventEmitter<UpmadeSplitButtonCustomEvent<IUpmadeSplitButtonIUpmadeMenuItem>>();
  @Output() itemToggleChildMenu = new EventEmitter<UpmadeSplitButtonCustomEvent<IUpmadeSplitButtonIUpmadeMenuItemToggleChildMenuEvent>>();
  @Output() itemCloseChildMenu = new EventEmitter<UpmadeSplitButtonCustomEvent<IUpmadeSplitButtonIUpmadeMenuItem>>();
  @Output() menuOpen = new EventEmitter<UpmadeSplitButtonCustomEvent<void>>();
  @Output() menuClose = new EventEmitter<UpmadeSplitButtonCustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { UpmadeSplitButtonCustomEvent } from '@upmade/editor/dist/components';
import type { IUpmadeMenuItemSelectEvent as IUpmadeSplitButtonIUpmadeMenuItemSelectEvent } from '@upmade/editor/dist/components';
import type { IUpmadeMenuItem as IUpmadeSplitButtonIUpmadeMenuItem } from '@upmade/editor/dist/components';
import type { IUpmadeMenuItemToggleChildMenuEvent as IUpmadeSplitButtonIUpmadeMenuItemToggleChildMenuEvent } from '@upmade/editor/dist/components';

export declare interface UpmadeSplitButton extends Components.UpmadeSplitButton {

  mainButtonClick: EventEmitter<UpmadeSplitButtonCustomEvent<void>>;

  itemSelect: EventEmitter<UpmadeSplitButtonCustomEvent<IUpmadeSplitButtonIUpmadeMenuItemSelectEvent>>;

  itemSave: EventEmitter<UpmadeSplitButtonCustomEvent<IUpmadeSplitButtonIUpmadeMenuItem>>;

  itemCancel: EventEmitter<UpmadeSplitButtonCustomEvent<IUpmadeSplitButtonIUpmadeMenuItem>>;

  itemToggleChildMenu: EventEmitter<UpmadeSplitButtonCustomEvent<IUpmadeSplitButtonIUpmadeMenuItemToggleChildMenuEvent>>;

  itemCloseChildMenu: EventEmitter<UpmadeSplitButtonCustomEvent<IUpmadeSplitButtonIUpmadeMenuItem>>;

  menuOpen: EventEmitter<UpmadeSplitButtonCustomEvent<void>>;

  menuClose: EventEmitter<UpmadeSplitButtonCustomEvent<void>>;
}


@ProxyCmp({
  defineCustomElementFn: defineUpmadeStrokeSize,
  inputs: ['selectedSize', 'sizes']
})
@Component({
  selector: 'upmade-stroke-size',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['selectedSize', 'sizes'],
  outputs: ['sizeChange'],
})
export class UpmadeStrokeSize {
  protected el: HTMLUpmadeStrokeSizeElement;
  @Output() sizeChange = new EventEmitter<UpmadeStrokeSizeCustomEvent<number>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { UpmadeStrokeSizeCustomEvent } from '@upmade/editor/dist/components';

export declare interface UpmadeStrokeSize extends Components.UpmadeStrokeSize {

  sizeChange: EventEmitter<UpmadeStrokeSizeCustomEvent<number>>;
}


