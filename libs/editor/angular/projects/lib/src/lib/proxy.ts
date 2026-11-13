/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@updraw/editor/dist/components';

import { defineCustomElement as defineUpdrawChatBox } from '@updraw/editor/dist/components/updraw-chat-box.js';
import { defineCustomElement as defineUpdrawEditor } from '@updraw/editor/dist/components/updraw-editor.js';
import { defineCustomElement as defineUpdrawSettings } from '@updraw/editor/dist/components/updraw-settings.js';
import { defineCustomElement as defineUpdrawShapeFill } from '@updraw/editor/dist/components/updraw-shape-fill.js';
import { defineCustomElement as defineUpdrawShareDialog } from '@updraw/editor/dist/components/updraw-share-dialog.js';
import { defineCustomElement as defineUpdrawSplitButton } from '@updraw/editor/dist/components/updraw-split-button.js';
import { defineCustomElement as defineUpdrawStrokeSize } from '@updraw/editor/dist/components/updraw-stroke-size.js';
@ProxyCmp({
  defineCustomElementFn: defineUpdrawChatBox,
  inputs: ['chips', 'disabled', 'loading', 'mode', 'placeholder', 'terms', 'value']
})
@Component({
  selector: 'updraw-chat-box',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['chips', 'disabled', 'loading', 'mode', 'placeholder', 'terms', 'value'],
  outputs: ['chatSubmit', 'chatStop', 'modeChange', 'chatChipRemove'],
})
export class UpdrawChatBox {
  protected el: HTMLUpdrawChatBoxElement;
  @Output() chatSubmit = new EventEmitter<UpdrawChatBoxCustomEvent<string>>();
  @Output() chatStop = new EventEmitter<UpdrawChatBoxCustomEvent<void>>();
  @Output() modeChange = new EventEmitter<UpdrawChatBoxCustomEvent<IUpdrawChatBoxUpdrawChatBoxMode>>();
  @Output() chatChipRemove = new EventEmitter<UpdrawChatBoxCustomEvent<IUpdrawChatBoxUpdrawChatBoxChip>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { UpdrawChatBoxCustomEvent } from '@updraw/editor/dist/components';
import type { UpdrawChatBoxMode as IUpdrawChatBoxUpdrawChatBoxMode } from '@updraw/editor/dist/components';
import type { UpdrawChatBoxChip as IUpdrawChatBoxUpdrawChatBoxChip } from '@updraw/editor/dist/components';

export declare interface UpdrawChatBox extends Components.UpdrawChatBox {
  /**
   * Emitted with the current text when the user submits the chat box.
   */
  chatSubmit: EventEmitter<UpdrawChatBoxCustomEvent<string>>;
  /**
   * Emitted when the user stops the current response.
   */
  chatStop: EventEmitter<UpdrawChatBoxCustomEvent<void>>;
  /**
   * Emitted when the mode changes, including automatic expansion.
   */
  modeChange: EventEmitter<UpdrawChatBoxCustomEvent<IUpdrawChatBoxUpdrawChatBoxMode>>;
  /**
   * Emitted with the chip whose remove button the user activated. The chip stays until `chips` no longer contains it.
   */
  chatChipRemove: EventEmitter<UpdrawChatBoxCustomEvent<IUpdrawChatBoxUpdrawChatBoxChip>>;
}


@ProxyCmp({
  defineCustomElementFn: defineUpdrawEditor,
  inputs: ['activeUsers', 'activeWorkspaceId', 'assetStorageConfig', 'chatBoxChips', 'chatBoxMode', 'chatSession', 'cursorTarget', 'customFonts', 'customSvgIcons', 'debugInfo', 'editorId', 'fallbackLocale', 'globalContextMenuItems', 'isAgentAvatarsVisible', 'isChatBoxLoading', 'isChatBoxVisible', 'isMoreMenuVisible', 'isPanningEnabled', 'isToolbarVisible', 'isUtilityPanelVisible', 'isWatermarkVisible', 'isWorkspaceManagerVisible', 'isZoomPanelVisible', 'isZoomingEnabled', 'locale', 'locales', 'lockDrawingScale', 'loginConfig', 'moreMenuItems', 'objectConfig', 'objectContextMenuItems', 'objectTitlebar', 'scaleMax', 'scaleMin', 'syncConfig', 'theme', 'themes', 'toolbarItems', 'user', 'viewportBoundaryBottom', 'viewportBoundaryLeft', 'viewportBoundaryRight', 'viewportBoundaryTop', 'workspaces'],
  methods: ['getObjectById', 'addObject', 'addObjects', 'updateObject', 'removeObject', 'removeObjects', 'getSelectedObjects', 'selectObjects', 'selectAllObjectsInViewport', 'clearSelection', 'centerObjectInViewport', 'panToObject', 'backToContent', 'centerAllObjects', 'centerObjects', 'setViewport', 'panTo', 'zoomTo', 'zoomIn', 'zoomOut', 'getViewport', 'screenToWorld', 'worldToScreen', 'setActiveWorkspace', 'createWorkspace', 'updateWorkspace', 'deleteWorkspace', 'getWorkspaces', 'getActiveWorkspace', 'loadSharedWorkspace', 'reinitSync', 'registerTool', 'setActiveTool', 'disable', 'enable', 'copy', 'cut', 'paste', 'delete', 'bringForward', 'sendBackward', 'bringToFront', 'sendToBack', 'alignObjects', 'group', 'ungroup', 'undo', 'redo', 'getScreenshot', 'exportViewportAsPng', 'exportViewportAsSvg', 'getSelectedObjectSupportedExportFormats', 'canExportSelectedObjectAs', 'exportSelectedObject', 'exportAsJson', 'importFromJson', 'downloadAsJson', 'importFromFile', 'loadObjectsFromJson', 'getObjectsTotalCount', 'getAllObjects', 'findObjects', 'getObjectsInViewport', 'addAgent', 'removeAgent', 'getAgent', 'getAgents', 'getRemoteAgents', 'setObjectElementPicking', 'highlightObjectElements', 'clearObjectElementHighlights', 'queryObjectElements', 'hideContextMenu', 'openContextMenu', 'openWorkspaceManagerMenu', 'closeWorkspaceManagerMenu', 'openMoreMenu', 'closeMoreMenu', 'openUserDialog', 'closeUserDialog', 'openExportDialog', 'closeExportDialog', 'openImportDialog', 'closeImportDialog', 'openSettingsDialog', 'closeSettingsDialog', 'openShareDialog', 'closeShareDialog', 'triggerSelectionChange', 'beginSceneBootstrap', 'endSceneBootstrap', 'getDisplayableShortcuts', 'openLoginDialog', 'closeLoginDialog', 'setLoginLoading', 'setLocale', 'getLocale', 'getAvailableLocales', 'registerLocales', 'registerFonts', 't', 'triggerNotification']
})
@Component({
  selector: 'updraw-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeUsers', 'activeWorkspaceId', 'assetStorageConfig', 'chatBoxChips', 'chatBoxMode', 'chatSession', 'cursorTarget', 'customFonts', 'customSvgIcons', 'debugInfo', 'editorId', 'fallbackLocale', 'globalContextMenuItems', 'isAgentAvatarsVisible', 'isChatBoxLoading', 'isChatBoxVisible', 'isMoreMenuVisible', 'isPanningEnabled', 'isToolbarVisible', 'isUtilityPanelVisible', 'isWatermarkVisible', 'isWorkspaceManagerVisible', 'isZoomPanelVisible', 'isZoomingEnabled', 'locale', 'locales', 'lockDrawingScale', 'loginConfig', 'moreMenuItems', 'objectConfig', 'objectContextMenuItems', 'objectTitlebar', 'scaleMax', 'scaleMin', 'syncConfig', 'theme', 'themes', 'toolbarItems', 'user', 'viewportBoundaryBottom', 'viewportBoundaryLeft', 'viewportBoundaryRight', 'viewportBoundaryTop', 'workspaces'],
  outputs: ['isReady', 'activeWorkspaceChange', 'objectsChange', 'objectsAdded', 'objectsRemoved', 'objectsUpdated', 'objectsSelectionChange', 'undoStateChange', 'themeChange', 'localeChange', 'viewportChange', 'logout', 'login', 'isPublicChange', 'awarenessChange', 'chatSubmit', 'chatStop', 'chatChipRemove', 'agentsChange', 'objectTitlebarAction', 'objectElementHover', 'objectElementClick', 'objectElementPick'],
})
export class UpdrawEditor {
  protected el: HTMLUpdrawEditorElement;
  @Output() isReady = new EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorEditorIsReadyEvent>>();
  @Output() activeWorkspaceChange = new EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorActiveWorkspaceChangeEvent>>();
  @Output() objectsChange = new EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorUpdrawBaseObject[]>>();
  @Output() objectsAdded = new EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorObjectsAddedEvent>>();
  @Output() objectsRemoved = new EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorObjectsRemovedEvent>>();
  @Output() objectsUpdated = new EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorObjectsUpdatedEvent>>();
  @Output() objectsSelectionChange = new EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorUpdrawBaseObject[]>>();
  @Output() undoStateChange = new EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorUpdrawUndoState>>();
  @Output() themeChange = new EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorThemeName>>();
  @Output() localeChange = new EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorLocaleCode>>();
  @Output() viewportChange = new EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorUpdrawViewportState>>();
  @Output() logout = new EventEmitter<UpdrawEditorCustomEvent<void>>();
  @Output() login = new EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorLoginEvent>>();
  @Output() isPublicChange = new EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorIUpdrawIsPublicChangeEvent>>();
  @Output() awarenessChange = new EventEmitter<UpdrawEditorCustomEvent<Map<number, Record<string, any>>>>();
  @Output() chatSubmit = new EventEmitter<UpdrawEditorCustomEvent<string>>();
  @Output() chatStop = new EventEmitter<UpdrawEditorCustomEvent<void>>();
  @Output() chatChipRemove = new EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorUpdrawChatBoxChip>>();
  @Output() agentsChange = new EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorUpdrawAgentsChangeEvent>>();
  @Output() objectTitlebarAction = new EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorUpdrawObjectTitlebarActionEvent>>();
  @Output() objectElementHover = new EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorUpdrawObjectElementHoverEvent>>();
  @Output() objectElementClick = new EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorUpdrawObjectElementClickEvent>>();
  @Output() objectElementPick = new EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorUpdrawObjectElementPickEvent>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { UpdrawEditorCustomEvent } from '@updraw/editor/dist/components';
import type { EditorIsReadyEvent as IUpdrawEditorEditorIsReadyEvent } from '@updraw/editor/dist/components';
import type { ActiveWorkspaceChangeEvent as IUpdrawEditorActiveWorkspaceChangeEvent } from '@updraw/editor/dist/components';
import type { UpdrawBaseObject as IUpdrawEditorUpdrawBaseObject } from '@updraw/editor/dist/components';
import type { ObjectsAddedEvent as IUpdrawEditorObjectsAddedEvent } from '@updraw/editor/dist/components';
import type { ObjectsRemovedEvent as IUpdrawEditorObjectsRemovedEvent } from '@updraw/editor/dist/components';
import type { ObjectsUpdatedEvent as IUpdrawEditorObjectsUpdatedEvent } from '@updraw/editor/dist/components';
import type { UpdrawUndoState as IUpdrawEditorUpdrawUndoState } from '@updraw/editor/dist/components';
import type { ThemeName as IUpdrawEditorThemeName } from '@updraw/editor/dist/components';
import type { LocaleCode as IUpdrawEditorLocaleCode } from '@updraw/editor/dist/components';
import type { UpdrawViewportState as IUpdrawEditorUpdrawViewportState } from '@updraw/editor/dist/components';
import type { LoginEvent as IUpdrawEditorLoginEvent } from '@updraw/editor/dist/components';
import type { IUpdrawIsPublicChangeEvent as IUpdrawEditorIUpdrawIsPublicChangeEvent } from '@updraw/editor/dist/components';
import type { UpdrawChatBoxChip as IUpdrawEditorUpdrawChatBoxChip } from '@updraw/editor/dist/components';
import type { UpdrawAgentsChangeEvent as IUpdrawEditorUpdrawAgentsChangeEvent } from '@updraw/editor/dist/components';
import type { UpdrawObjectTitlebarActionEvent as IUpdrawEditorUpdrawObjectTitlebarActionEvent } from '@updraw/editor/dist/components';
import type { UpdrawObjectElementHoverEvent as IUpdrawEditorUpdrawObjectElementHoverEvent } from '@updraw/editor/dist/components';
import type { UpdrawObjectElementClickEvent as IUpdrawEditorUpdrawObjectElementClickEvent } from '@updraw/editor/dist/components';
import type { UpdrawObjectElementPickEvent as IUpdrawEditorUpdrawObjectElementPickEvent } from '@updraw/editor/dist/components';

export declare interface UpdrawEditor extends Components.UpdrawEditor {

  isReady: EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorEditorIsReadyEvent>>;

  activeWorkspaceChange: EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorActiveWorkspaceChangeEvent>>;

  objectsChange: EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorUpdrawBaseObject[]>>;
  /**
   * Emitted when objects are added. `source` is set when an agent made the change.
   */
  objectsAdded: EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorObjectsAddedEvent>>;
  /**
   * Emitted when objects are removed. `source` is set when an agent made the change.
   */
  objectsRemoved: EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorObjectsRemovedEvent>>;
  /**
   * Emitted when objects are updated. `source` is set when an agent made the change.
   */
  objectsUpdated: EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorObjectsUpdatedEvent>>;

  objectsSelectionChange: EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorUpdrawBaseObject[]>>;

  undoStateChange: EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorUpdrawUndoState>>;

  themeChange: EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorThemeName>>;

  localeChange: EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorLocaleCode>>;

  viewportChange: EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorUpdrawViewportState>>;

  logout: EventEmitter<UpdrawEditorCustomEvent<void>>;

  login: EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorLoginEvent>>;

  isPublicChange: EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorIUpdrawIsPublicChangeEvent>>;

  awarenessChange: EventEmitter<UpdrawEditorCustomEvent<Map<number, Record<string, any>>>>;
  /**
   * Emitted with the chat box text when the user submits it. With a `chatSession`, the prompt is sent to it
unless a listener calls `preventDefault()`.
   */
  chatSubmit: EventEmitter<UpdrawEditorCustomEvent<string>>;
  /**
   * Emitted when the user stops the current chat response. A `chatSession` is stopped too.
   */
  chatStop: EventEmitter<UpdrawEditorCustomEvent<void>>;
  /**
   * Emitted with the chat box chip whose remove button the user activated. The chip stays until `chatBoxChips` no longer contains it.
   */
  chatChipRemove: EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorUpdrawChatBoxChip>>;
  /**
   * Emitted when agents are added or removed, or when what the avatar stack shows of them changes
(name, color, avatar, status, visibility, activity). Never emitted for plain cursor motion.
   */
  agentsChange: EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorUpdrawAgentsChangeEvent>>;
  /**
   * Emitted when a button or a menu item in an object titlebar is clicked.
   */
  objectTitlebarAction: EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorUpdrawObjectTitlebarActionEvent>>;
  /**
   * Emitted when the pointer moves onto another element inside the content of an interactive (selected) object,
such as an iframe object, and with `element: null` when it leaves the content or the object stops being interactive.
   */
  objectElementHover: EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorUpdrawObjectElementHoverEvent>>;
  /**
   * Emitted when the user clicks an element inside the content of an interactive (selected) object. The click works as usual.
   */
  objectElementClick: EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorUpdrawObjectElementClickEvent>>;
  /**
   * Emitted when the user picks an element inside an object that is picking elements, see `setObjectElementPicking`.
   */
  objectElementPick: EventEmitter<UpdrawEditorCustomEvent<IUpdrawEditorUpdrawObjectElementPickEvent>>;
}


@ProxyCmp({
  defineCustomElementFn: defineUpdrawSettings,
  inputs: ['availableLocales', 'availableThemes', 'settings', 'shortcuts', 'terms'],
  methods: ['open', 'close']
})
@Component({
  selector: 'updraw-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['availableLocales', 'availableThemes', 'settings', 'shortcuts', 'terms'],
  outputs: ['settingsChange'],
})
export class UpdrawSettings {
  protected el: HTMLUpdrawSettingsElement;
  @Output() settingsChange = new EventEmitter<UpdrawSettingsCustomEvent<IUpdrawSettingsUpdrawSettingsConfig>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { UpdrawSettingsCustomEvent } from '@updraw/editor/dist/components';
import type { UpdrawSettingsConfig as IUpdrawSettingsUpdrawSettingsConfig } from '@updraw/editor/dist/components';

export declare interface UpdrawSettings extends Components.UpdrawSettings {
  /**
   * Emitted when settings change
   */
  settingsChange: EventEmitter<UpdrawSettingsCustomEvent<IUpdrawSettingsUpdrawSettingsConfig>>;
}


@ProxyCmp({
  defineCustomElementFn: defineUpdrawShapeFill,
  inputs: ['value']
})
@Component({
  selector: 'updraw-shape-fill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['value'],
  outputs: ['valueChange'],
})
export class UpdrawShapeFill {
  protected el: HTMLUpdrawShapeFillElement;
  @Output() valueChange = new EventEmitter<UpdrawShapeFillCustomEvent<IUpdrawShapeFillShapeFillType>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { UpdrawShapeFillCustomEvent } from '@updraw/editor/dist/components';
import type { ShapeFillType as IUpdrawShapeFillShapeFillType } from '@updraw/editor/dist/components';

export declare interface UpdrawShapeFill extends Components.UpdrawShapeFill {

  valueChange: EventEmitter<UpdrawShapeFillCustomEvent<IUpdrawShapeFillShapeFillType>>;
}


@ProxyCmp({
  defineCustomElementFn: defineUpdrawShareDialog,
  inputs: ['isPublic', 'terms', 'workspaceId'],
  methods: ['open', 'close']
})
@Component({
  selector: 'updraw-share-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['isPublic', 'terms', 'workspaceId'],
  outputs: ['toggleIsPublic', 'dialogClosed'],
})
export class UpdrawShareDialog {
  protected el: HTMLUpdrawShareDialogElement;
  @Output() toggleIsPublic = new EventEmitter<UpdrawShareDialogCustomEvent<boolean>>();
  @Output() dialogClosed = new EventEmitter<UpdrawShareDialogCustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { UpdrawShareDialogCustomEvent } from '@updraw/editor/dist/components';

export declare interface UpdrawShareDialog extends Components.UpdrawShareDialog {
  /**
   * Emitted when the user toggles the public sharing state.
   */
  toggleIsPublic: EventEmitter<UpdrawShareDialogCustomEvent<boolean>>;
  /**
   * Emitted when the dialog is closed.
   */
  dialogClosed: EventEmitter<UpdrawShareDialogCustomEvent<void>>;
}


@ProxyCmp({
  defineCustomElementFn: defineUpdrawSplitButton,
  inputs: ['buttonIcon', 'dropdownIcon', 'items', 'mainButtonDisabled', 'menuButtonDisabled'],
  methods: ['open', 'close', 'focusMenu']
})
@Component({
  selector: 'updraw-split-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['buttonIcon', 'dropdownIcon', 'items', 'mainButtonDisabled', 'menuButtonDisabled'],
  outputs: ['mainButtonClick', 'itemSelect', 'itemSave', 'itemCancel', 'itemToggleChildMenu', 'itemCloseChildMenu', 'menuOpen', 'menuClose'],
})
export class UpdrawSplitButton {
  protected el: HTMLUpdrawSplitButtonElement;
  @Output() mainButtonClick = new EventEmitter<UpdrawSplitButtonCustomEvent<void>>();
  @Output() itemSelect = new EventEmitter<UpdrawSplitButtonCustomEvent<IUpdrawSplitButtonIUpdrawMenuItemSelectEvent>>();
  @Output() itemSave = new EventEmitter<UpdrawSplitButtonCustomEvent<IUpdrawSplitButtonIUpdrawMenuItem>>();
  @Output() itemCancel = new EventEmitter<UpdrawSplitButtonCustomEvent<IUpdrawSplitButtonIUpdrawMenuItem>>();
  @Output() itemToggleChildMenu = new EventEmitter<UpdrawSplitButtonCustomEvent<IUpdrawSplitButtonIUpdrawMenuItemToggleChildMenuEvent>>();
  @Output() itemCloseChildMenu = new EventEmitter<UpdrawSplitButtonCustomEvent<IUpdrawSplitButtonIUpdrawMenuItem>>();
  @Output() menuOpen = new EventEmitter<UpdrawSplitButtonCustomEvent<void>>();
  @Output() menuClose = new EventEmitter<UpdrawSplitButtonCustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { UpdrawSplitButtonCustomEvent } from '@updraw/editor/dist/components';
import type { IUpdrawMenuItemSelectEvent as IUpdrawSplitButtonIUpdrawMenuItemSelectEvent } from '@updraw/editor/dist/components';
import type { IUpdrawMenuItem as IUpdrawSplitButtonIUpdrawMenuItem } from '@updraw/editor/dist/components';
import type { IUpdrawMenuItemToggleChildMenuEvent as IUpdrawSplitButtonIUpdrawMenuItemToggleChildMenuEvent } from '@updraw/editor/dist/components';

export declare interface UpdrawSplitButton extends Components.UpdrawSplitButton {

  mainButtonClick: EventEmitter<UpdrawSplitButtonCustomEvent<void>>;

  itemSelect: EventEmitter<UpdrawSplitButtonCustomEvent<IUpdrawSplitButtonIUpdrawMenuItemSelectEvent>>;

  itemSave: EventEmitter<UpdrawSplitButtonCustomEvent<IUpdrawSplitButtonIUpdrawMenuItem>>;

  itemCancel: EventEmitter<UpdrawSplitButtonCustomEvent<IUpdrawSplitButtonIUpdrawMenuItem>>;

  itemToggleChildMenu: EventEmitter<UpdrawSplitButtonCustomEvent<IUpdrawSplitButtonIUpdrawMenuItemToggleChildMenuEvent>>;

  itemCloseChildMenu: EventEmitter<UpdrawSplitButtonCustomEvent<IUpdrawSplitButtonIUpdrawMenuItem>>;

  menuOpen: EventEmitter<UpdrawSplitButtonCustomEvent<void>>;

  menuClose: EventEmitter<UpdrawSplitButtonCustomEvent<void>>;
}


@ProxyCmp({
  defineCustomElementFn: defineUpdrawStrokeSize,
  inputs: ['selectedSize', 'sizes']
})
@Component({
  selector: 'updraw-stroke-size',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['selectedSize', 'sizes'],
  outputs: ['sizeChange'],
})
export class UpdrawStrokeSize {
  protected el: HTMLUpdrawStrokeSizeElement;
  @Output() sizeChange = new EventEmitter<UpdrawStrokeSizeCustomEvent<number>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { UpdrawStrokeSizeCustomEvent } from '@updraw/editor/dist/components';

export declare interface UpdrawStrokeSize extends Components.UpdrawStrokeSize {

  sizeChange: EventEmitter<UpdrawStrokeSizeCustomEvent<number>>;
}


