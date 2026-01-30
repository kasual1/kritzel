/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from 'kritzel-stencil/dist/components';

import { defineCustomElement as defineKritzelBackToContent } from 'kritzel-stencil/dist/components/kritzel-back-to-content.js';
import { defineCustomElement as defineKritzelDialog } from 'kritzel-stencil/dist/components/kritzel-dialog.js';
import { defineCustomElement as defineKritzelEditor } from 'kritzel-stencil/dist/components/kritzel-editor.js';
import { defineCustomElement as defineKritzelLineEndings } from 'kritzel-stencil/dist/components/kritzel-line-endings.js';
import { defineCustomElement as defineKritzelMasterDetail } from 'kritzel-stencil/dist/components/kritzel-master-detail.js';
import { defineCustomElement as defineKritzelMoreMenu } from 'kritzel-stencil/dist/components/kritzel-more-menu.js';
import { defineCustomElement as defineKritzelNumericInput } from 'kritzel-stencil/dist/components/kritzel-numeric-input.js';
import { defineCustomElement as defineKritzelOpacitySlider } from 'kritzel-stencil/dist/components/kritzel-opacity-slider.js';
import { defineCustomElement as defineKritzelSettings } from 'kritzel-stencil/dist/components/kritzel-settings.js';
import { defineCustomElement as defineKritzelShapeFill } from 'kritzel-stencil/dist/components/kritzel-shape-fill.js';
import { defineCustomElement as defineKritzelSlideToggle } from 'kritzel-stencil/dist/components/kritzel-slide-toggle.js';
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
  defineCustomElementFn: defineKritzelDialog,
  inputs: ['autoFocus', 'closable', 'closeOnBackdrop', 'closeOnEscape', 'dialogTitle', 'fullscreenOnMobile', 'isOpen', 'size', 'trapFocus'],
  methods: ['open', 'close', 'focusFirstElement']
})
@Component({
  selector: 'kritzel-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['autoFocus', 'closable', 'closeOnBackdrop', 'closeOnEscape', 'dialogTitle', 'fullscreenOnMobile', 'isOpen', 'size', 'trapFocus'],
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
  inputs: ['controls', 'customSvgIcons', 'globalContextMenuItems', 'isControlsVisible', 'isUtilityPanelVisible', 'lockDrawingScale', 'objectContextMenuItems', 'scaleMax', 'scaleMin', 'syncConfig'],
  methods: ['getObjectById', 'addObject', 'updateObject', 'removeObject', 'getSelectedObjects', 'selectObjects', 'selectAllObjectsInViewport', 'clearSelection', 'centerObjectInViewport', 'backToContent', 'createWorkspace', 'updateWorkspace', 'deleteWorkspace', 'getWorkspaces', 'getActiveWorkspace']
})
@Component({
  selector: 'kritzel-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['controls', 'customSvgIcons', 'globalContextMenuItems', 'isControlsVisible', 'isUtilityPanelVisible', 'lockDrawingScale', 'objectContextMenuItems', 'scaleMax', 'scaleMin', 'syncConfig'],
  outputs: ['isReady', 'objectsChange', 'undoStateChange'],
})
export class KritzelEditor {
  protected el: HTMLKritzelEditorElement;
  @Output() isReady = new EventEmitter<CustomEvent<HTMLElement>>();
  @Output() objectsChange = new EventEmitter<CustomEvent<IKritzelEditorKritzelBaseObject[]>>();
  @Output() undoStateChange = new EventEmitter<CustomEvent<IKritzelEditorKritzelUndoState>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelBaseObject as IKritzelEditorKritzelBaseObject } from 'kritzel-stencil/dist/components';
import type { KritzelUndoState as IKritzelEditorKritzelUndoState } from 'kritzel-stencil/dist/components';

export declare interface KritzelEditor extends Components.KritzelEditor {

  isReady: EventEmitter<CustomEvent<HTMLElement>>;

  objectsChange: EventEmitter<CustomEvent<IKritzelEditorKritzelBaseObject[]>>;

  undoStateChange: EventEmitter<CustomEvent<IKritzelEditorKritzelUndoState>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelLineEndings,
  inputs: ['strokeColor', 'styles', 'value']
})
@Component({
  selector: 'kritzel-line-endings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['strokeColor', 'styles', 'value'],
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
  defineCustomElementFn: defineKritzelMoreMenu,
  inputs: ['icon', 'iconSize', 'items', 'offsetY']
})
@Component({
  selector: 'kritzel-more-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['icon', 'iconSize', 'items', 'offsetY'],
  outputs: ['itemSelect'],
})
export class KritzelMoreMenu {
  protected el: HTMLKritzelMoreMenuElement;
  @Output() itemSelect = new EventEmitter<CustomEvent<{ item: IKritzelMoreMenuIKritzelMenuItem; parent: IKritzelMoreMenuIKritzelMenuItem }>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { IKritzelMenuItem as IKritzelMoreMenuIKritzelMenuItem } from 'kritzel-stencil/dist/components';

export declare interface KritzelMoreMenu extends Components.KritzelMoreMenu {
  /**
   * Emitted when a menu item is selected
   */
  itemSelect: EventEmitter<CustomEvent<{ item: IKritzelMoreMenuIKritzelMenuItem; parent: IKritzelMoreMenuIKritzelMenuItem }>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelNumericInput,
  inputs: ['label', 'max', 'min', 'step', 'value']
})
@Component({
  selector: 'kritzel-numeric-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['label', 'max', 'min', 'step', 'value'],
  outputs: ['valueChange'],
})
export class KritzelNumericInput {
  protected el: HTMLKritzelNumericInputElement;
  @Output() valueChange = new EventEmitter<CustomEvent<number>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelNumericInput extends Components.KritzelNumericInput {
  /**
   * Emitted when the value changes (after normalization)
   */
  valueChange: EventEmitter<CustomEvent<number>>;
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
  defineCustomElementFn: defineKritzelSettings
})
@Component({
  selector: 'kritzel-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: [],
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
  @Output() valueChange = new EventEmitter<CustomEvent<IKritzelShapeFillShapeFillType>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { ShapeFillType as IKritzelShapeFillShapeFillType } from 'kritzel-stencil/dist/components';

export declare interface KritzelShapeFill extends Components.KritzelShapeFill {

  valueChange: EventEmitter<CustomEvent<IKritzelShapeFillShapeFillType>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelSlideToggle,
  inputs: ['checked', 'disabled', 'label']
})
@Component({
  selector: 'kritzel-slide-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['checked', 'disabled', 'label'],
  outputs: ['checkedChange'],
})
export class KritzelSlideToggle {
  protected el: HTMLKritzelSlideToggleElement;
  @Output() checkedChange = new EventEmitter<CustomEvent<boolean>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelSlideToggle extends Components.KritzelSlideToggle {
  /**
   * Emitted when the toggle state changes
   */
  checkedChange: EventEmitter<CustomEvent<boolean>>;
}


