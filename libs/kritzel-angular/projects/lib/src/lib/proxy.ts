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
import { defineCustomElement as defineKritzelExport } from 'kritzel-stencil/dist/components/kritzel-export.js';
import { defineCustomElement as defineKritzelInput } from 'kritzel-stencil/dist/components/kritzel-input.js';
import { defineCustomElement as defineKritzelLineEndings } from 'kritzel-stencil/dist/components/kritzel-line-endings.js';
import { defineCustomElement as defineKritzelLoginDialog } from 'kritzel-stencil/dist/components/kritzel-login-dialog.js';
import { defineCustomElement as defineKritzelMasterDetail } from 'kritzel-stencil/dist/components/kritzel-master-detail.js';
import { defineCustomElement as defineKritzelNumericInput } from 'kritzel-stencil/dist/components/kritzel-numeric-input.js';
import { defineCustomElement as defineKritzelOpacitySlider } from 'kritzel-stencil/dist/components/kritzel-opacity-slider.js';
import { defineCustomElement as defineKritzelPillTabs } from 'kritzel-stencil/dist/components/kritzel-pill-tabs.js';
import { defineCustomElement as defineKritzelSettings } from 'kritzel-stencil/dist/components/kritzel-settings.js';
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
  @Output() backToContent = new EventEmitter<CustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelBackToContent extends Components.KritzelBackToContent {
  /**
   * Emitted when the button is clicked
   */
  backToContent: EventEmitter<CustomEvent<void>>;
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
  @Output() buttonClick = new EventEmitter<CustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelButton extends Components.KritzelButton {
  /**
   * Emitted when the button is clicked
   */
  buttonClick: EventEmitter<CustomEvent<void>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelCurrentUserDialog,
  inputs: ['user'],
  methods: ['open', 'close']
})
@Component({
  selector: 'kritzel-current-user-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['user'],
})
export class KritzelCurrentUserDialog {
  protected el: HTMLKritzelCurrentUserDialogElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelCurrentUserDialog extends Components.KritzelCurrentUserDialog {}


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
  @Output() dialogOpen = new EventEmitter<CustomEvent<void>>();
  @Output() dialogClose = new EventEmitter<CustomEvent<IKritzelDialogIKritzelDialogCloseEvent>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { IKritzelDialogCloseEvent as IKritzelDialogIKritzelDialogCloseEvent } from 'kritzel-stencil/dist/components';

export declare interface KritzelDialog extends Components.KritzelDialog {
  /**
   * Emitted when the dialog opens
   */
  dialogOpen: EventEmitter<CustomEvent<void>>;
  /**
   * Emitted when the dialog closes
   */
  dialogClose: EventEmitter<CustomEvent<IKritzelDialogIKritzelDialogCloseEvent>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelEditor,
  inputs: ['activeUsers', 'activeWorkspaceId', 'assetStorageConfig', 'controls', 'cursorTarget', 'customSvgIcons', 'debugInfo', 'editorId', 'globalContextMenuItems', 'isControlsVisible', 'isLoading', 'isMoreMenuVisible', 'isUtilityPanelVisible', 'isWorkspaceManagerVisible', 'lockDrawingScale', 'loginConfig', 'objectContextMenuItems', 'scaleMax', 'scaleMin', 'syncConfig', 'theme', 'themes', 'user', 'viewportBoundaryBottom', 'viewportBoundaryLeft', 'viewportBoundaryRight', 'viewportBoundaryTop', 'wheelEnabled'],
  methods: ['getObjectById', 'addObject', 'updateObject', 'removeObject', 'getSelectedObjects', 'selectObjects', 'selectAllObjectsInViewport', 'clearSelection', 'centerObjectInViewport', 'backToContent', 'centerAllObjects', 'setViewport', 'panTo', 'zoomTo', 'getViewport', 'screenToWorld', 'worldToScreen', 'createWorkspace', 'updateWorkspace', 'deleteWorkspace', 'getWorkspaces', 'getActiveWorkspace', 'loadSharedWorkspace', 'reinitSync', 'registerTool', 'changeActiveTool', 'changeActiveToolByName', 'disable', 'enable', 'copy', 'cut', 'paste', 'delete', 'bringForward', 'sendBackward', 'bringToFront', 'sendToBack', 'alignObjects', 'group', 'ungroup', 'undo', 'redo', 'getScreenshot', 'exportViewportAsPng', 'exportViewportAsSvg', 'exportSelectedObjectsAsPng', 'exportSelectedObjectsAsSvg', 'downloadAsJson', 'importFromFile', 'loadObjectsFromJson', 'getObjectsTotalCount', 'getAllObjects', 'findObjects', 'getCopiedObjects', 'getObjectsInViewport', 'hideContextMenu', 'triggerSelectionChange', 'getDisplayableShortcuts', 'openLoginDialog', 'setLoginLoading']
})
@Component({
  selector: 'kritzel-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeUsers', 'activeWorkspaceId', 'assetStorageConfig', 'controls', 'cursorTarget', 'customSvgIcons', 'debugInfo', 'editorId', 'globalContextMenuItems', 'isControlsVisible', 'isLoading', 'isMoreMenuVisible', 'isUtilityPanelVisible', 'isWorkspaceManagerVisible', 'lockDrawingScale', 'loginConfig', 'objectContextMenuItems', 'scaleMax', 'scaleMin', 'syncConfig', 'theme', 'themes', 'user', 'viewportBoundaryBottom', 'viewportBoundaryLeft', 'viewportBoundaryRight', 'viewportBoundaryTop', 'wheelEnabled'],
  outputs: ['isReady', 'activeWorkspaceChange', 'objectsChange', 'objectsAdded', 'objectsRemoved', 'objectsUpdated', 'undoStateChange', 'themeChange', 'viewportChange', 'logout', 'login', 'isPublicChange', 'awarenessChange'],
})
export class KritzelEditor {
  protected el: HTMLKritzelEditorElement;
  @Output() isReady = new EventEmitter<CustomEvent<IKritzelEditorEditorIsReadyEvent>>();
  @Output() activeWorkspaceChange = new EventEmitter<CustomEvent<IKritzelEditorActiveWorkspaceChangeEvent>>();
  @Output() objectsChange = new EventEmitter<CustomEvent<IKritzelEditorKritzelBaseObject[]>>();
  @Output() objectsAdded = new EventEmitter<CustomEvent<IKritzelEditorObjectsAddedEvent>>();
  @Output() objectsRemoved = new EventEmitter<CustomEvent<IKritzelEditorObjectsRemovedEvent>>();
  @Output() objectsUpdated = new EventEmitter<CustomEvent<IKritzelEditorObjectsUpdatedEvent>>();
  @Output() undoStateChange = new EventEmitter<CustomEvent<IKritzelEditorKritzelUndoState>>();
  @Output() themeChange = new EventEmitter<CustomEvent<IKritzelEditorThemeName>>();
  @Output() viewportChange = new EventEmitter<CustomEvent<IKritzelEditorKritzelViewportState>>();
  @Output() logout = new EventEmitter<CustomEvent<void>>();
  @Output() login = new EventEmitter<CustomEvent<IKritzelEditorLoginEvent>>();
  @Output() isPublicChange = new EventEmitter<CustomEvent<IKritzelEditorIKritzelIsPublicChangedEvent>>();
  @Output() awarenessChange = new EventEmitter<CustomEvent<Map<number, Record<string, any>>>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { EditorIsReadyEvent as IKritzelEditorEditorIsReadyEvent } from 'kritzel-stencil/dist/components';
import type { ActiveWorkspaceChangeEvent as IKritzelEditorActiveWorkspaceChangeEvent } from 'kritzel-stencil/dist/components';
import type { KritzelBaseObject as IKritzelEditorKritzelBaseObject } from 'kritzel-stencil/dist/components';
import type { ObjectsAddedEvent as IKritzelEditorObjectsAddedEvent } from 'kritzel-stencil/dist/components';
import type { ObjectsRemovedEvent as IKritzelEditorObjectsRemovedEvent } from 'kritzel-stencil/dist/components';
import type { ObjectsUpdatedEvent as IKritzelEditorObjectsUpdatedEvent } from 'kritzel-stencil/dist/components';
import type { KritzelUndoState as IKritzelEditorKritzelUndoState } from 'kritzel-stencil/dist/components';
import type { ThemeName as IKritzelEditorThemeName } from 'kritzel-stencil/dist/components';
import type { KritzelViewportState as IKritzelEditorKritzelViewportState } from 'kritzel-stencil/dist/components';
import type { LoginEvent as IKritzelEditorLoginEvent } from 'kritzel-stencil/dist/components';
import type { IKritzelIsPublicChangedEvent as IKritzelEditorIKritzelIsPublicChangedEvent } from 'kritzel-stencil/dist/components';

export declare interface KritzelEditor extends Components.KritzelEditor {

  isReady: EventEmitter<CustomEvent<IKritzelEditorEditorIsReadyEvent>>;

  activeWorkspaceChange: EventEmitter<CustomEvent<IKritzelEditorActiveWorkspaceChangeEvent>>;

  objectsChange: EventEmitter<CustomEvent<IKritzelEditorKritzelBaseObject[]>>;

  objectsAdded: EventEmitter<CustomEvent<IKritzelEditorObjectsAddedEvent>>;

  objectsRemoved: EventEmitter<CustomEvent<IKritzelEditorObjectsRemovedEvent>>;

  objectsUpdated: EventEmitter<CustomEvent<IKritzelEditorObjectsUpdatedEvent>>;

  undoStateChange: EventEmitter<CustomEvent<IKritzelEditorKritzelUndoState>>;

  themeChange: EventEmitter<CustomEvent<IKritzelEditorThemeName>>;

  viewportChange: EventEmitter<CustomEvent<IKritzelEditorKritzelViewportState>>;

  logout: EventEmitter<CustomEvent<void>>;

  login: EventEmitter<CustomEvent<IKritzelEditorLoginEvent>>;

  isPublicChange: EventEmitter<CustomEvent<IKritzelEditorIKritzelIsPublicChangedEvent>>;

  awarenessChange: EventEmitter<CustomEvent<Map<number, Record<string, any>>>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelExport,
  inputs: ['workspaceName'],
  methods: ['open']
})
@Component({
  selector: 'kritzel-export',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['workspaceName'],
  outputs: ['exportPng', 'exportSvg', 'exportJson'],
})
export class KritzelExport {
  protected el: HTMLKritzelExportElement;
  @Output() exportPng = new EventEmitter<CustomEvent<void>>();
  @Output() exportSvg = new EventEmitter<CustomEvent<void>>();
  @Output() exportJson = new EventEmitter<CustomEvent<string>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelExport extends Components.KritzelExport {

  exportPng: EventEmitter<CustomEvent<void>>;

  exportSvg: EventEmitter<CustomEvent<void>>;

  exportJson: EventEmitter<CustomEvent<string>>;
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
  @Output() valueChange = new EventEmitter<CustomEvent<string>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelInput extends Components.KritzelInput {
  /**
   * Emitted when the value changes
   */
  valueChange: EventEmitter<CustomEvent<string>>;
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
  @Output() valueChange = new EventEmitter<CustomEvent<IKritzelLineEndingsLineArrowConfig>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { LineArrowConfig as IKritzelLineEndingsLineArrowConfig } from 'kritzel-stencil/dist/components';

export declare interface KritzelLineEndings extends Components.KritzelLineEndings {

  valueChange: EventEmitter<CustomEvent<IKritzelLineEndingsLineArrowConfig>>;
}


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
  @Output() providerLogin = new EventEmitter<CustomEvent<IKritzelLoginDialogLoginEvent>>();
  @Output() dialogClosed = new EventEmitter<CustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { LoginEvent as IKritzelLoginDialogLoginEvent } from 'kritzel-stencil/dist/components';

export declare interface KritzelLoginDialog extends Components.KritzelLoginDialog {
  /**
   * Emitted when a provider button is clicked
   */
  providerLogin: EventEmitter<CustomEvent<IKritzelLoginDialogLoginEvent>>;
  /**
   * Emitted when the dialog is closed
   */
  dialogClosed: EventEmitter<CustomEvent<void>>;
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
  @Output() itemSelect = new EventEmitter<CustomEvent<IKritzelMasterDetailIKritzelMasterDetailSelectEvent>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { IKritzelMasterDetailSelectEvent as IKritzelMasterDetailIKritzelMasterDetailSelectEvent } from 'kritzel-stencil/dist/components';

export declare interface KritzelMasterDetail extends Components.KritzelMasterDetail {
  /**
   * Emitted when an item is selected
   */
  itemSelect: EventEmitter<CustomEvent<IKritzelMasterDetailIKritzelMasterDetailSelectEvent>>;
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
  @Output() valueChange = new EventEmitter<CustomEvent<number | undefined>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelNumericInput extends Components.KritzelNumericInput {
  /**
   * Emitted when the value changes (after normalization)
   */
  valueChange: EventEmitter<CustomEvent<number | undefined>>;
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
  @Output() valueChange = new EventEmitter<CustomEvent<number>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelOpacitySlider extends Components.KritzelOpacitySlider {

  valueChange: EventEmitter<CustomEvent<number>>;
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
  @Output() valueChange = new EventEmitter<CustomEvent<string>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelPillTabs extends Components.KritzelPillTabs {
  /**
   * Emitted when the selected tab changes
   */
  valueChange: EventEmitter<CustomEvent<string>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelSettings,
  inputs: ['availableThemes', 'settings', 'shortcuts'],
  methods: ['open']
})
@Component({
  selector: 'kritzel-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['availableThemes', 'settings', 'shortcuts'],
  outputs: ['settingsChange'],
})
export class KritzelSettings {
  protected el: HTMLKritzelSettingsElement;
  @Output() settingsChange = new EventEmitter<CustomEvent<IKritzelSettingsKritzelSettingsConfig>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelSettingsConfig as IKritzelSettingsKritzelSettingsConfig } from 'kritzel-stencil/dist/components';

export declare interface KritzelSettings extends Components.KritzelSettings {
  /**
   * Emitted when settings change
   */
  settingsChange: EventEmitter<CustomEvent<IKritzelSettingsKritzelSettingsConfig>>;
}


