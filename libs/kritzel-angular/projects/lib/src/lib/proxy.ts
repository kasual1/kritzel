/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from 'kritzel-stencil/dist/components';

import { defineCustomElement as defineKritzelEditor } from 'kritzel-stencil/dist/components/kritzel-editor.js';
import { defineCustomElement as defineKritzelMenu } from 'kritzel-stencil/dist/components/kritzel-menu.js';
import { defineCustomElement as defineKritzelPortal } from 'kritzel-stencil/dist/components/kritzel-portal.js';
import { defineCustomElement as defineKritzelSplitButton } from 'kritzel-stencil/dist/components/kritzel-split-button.js';
import { defineCustomElement as defineKritzelWorkspaceManager } from 'kritzel-stencil/dist/components/kritzel-workspace-manager.js';
@ProxyCmp({
  defineCustomElementFn: defineKritzelEditor,
  inputs: ['controls', 'customSvgIcons', 'globalContextMenuItems', 'isControlsVisible', 'isUtilityPanelVisible', 'objectContextMenuItems', 'scaleMax', 'scaleMin'],
  methods: ['getObjectById', 'addObject', 'updateObject', 'removeObject', 'getSelectedObjects', 'selectObjects', 'selectAllObjectsInViewport', 'clearSelection', 'centerObjectInViewport']
})
@Component({
  selector: 'kritzel-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['controls', 'customSvgIcons', 'globalContextMenuItems', 'isControlsVisible', 'isUtilityPanelVisible', 'objectContextMenuItems', 'scaleMax', 'scaleMin'],
  outputs: ['isReady'],
})
export class KritzelEditor {
  protected el: HTMLKritzelEditorElement;
  @Output() isReady = new EventEmitter<CustomEvent<HTMLElement>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelEditor extends Components.KritzelEditor {

  isReady: EventEmitter<CustomEvent<HTMLElement>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelMenu,
  inputs: ['activeItemIndex', 'editingIndex', 'items', 'parent', 'parentIndex']
})
@Component({
  selector: 'kritzel-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeItemIndex', 'editingIndex', 'items', 'parent', 'parentIndex'],
})
export class KritzelMenu {
  protected el: HTMLKritzelMenuElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelMenu extends Components.KritzelMenu {}


@ProxyCmp({
  defineCustomElementFn: defineKritzelPortal,
  inputs: ['anchor', 'offsetX', 'offsetY']
})
@Component({
  selector: 'kritzel-portal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['anchor', 'offsetX', 'offsetY'],
  outputs: ['close'],
})
export class KritzelPortal {
  protected el: HTMLKritzelPortalElement;
  @Output() close = new EventEmitter<CustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelPortal extends Components.KritzelPortal {

  close: EventEmitter<CustomEvent<void>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelSplitButton,
  inputs: ['activeItemIndex', 'buttonIcon', 'buttonText', 'disabled', 'dropdownIcon', 'editingIndex', 'options'],
  methods: ['openMenu', 'closeMenu', 'setEditingIndex']
})
@Component({
  selector: 'kritzel-split-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeItemIndex', 'buttonIcon', 'buttonText', 'disabled', 'dropdownIcon', 'editingIndex', 'options'],
  outputs: ['buttonClick', 'optionSelect', 'menuOpened', 'menuClosed'],
})
export class KritzelSplitButton {
  protected el: HTMLKritzelSplitButtonElement;
  @Output() buttonClick = new EventEmitter<CustomEvent<void>>();
  @Output() optionSelect = new EventEmitter<CustomEvent<IKritzelSplitButtonMenuItem>>();
  @Output() menuOpened = new EventEmitter<CustomEvent<void>>();
  @Output() menuClosed = new EventEmitter<CustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { MenuItem as IKritzelSplitButtonMenuItem } from 'kritzel-stencil/dist/components';

export declare interface KritzelSplitButton extends Components.KritzelSplitButton {

  buttonClick: EventEmitter<CustomEvent<void>>;

  optionSelect: EventEmitter<CustomEvent<IKritzelSplitButtonMenuItem>>;

  menuOpened: EventEmitter<CustomEvent<void>>;

  menuClosed: EventEmitter<CustomEvent<void>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelWorkspaceManager,
  inputs: ['activeWorkspace', 'workspaces']
})
@Component({
  selector: 'kritzel-workspace-manager',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeWorkspace', 'workspaces'],
  outputs: ['isWorkspaceManagerReady', 'workspaceChange'],
})
export class KritzelWorkspaceManager {
  protected el: HTMLKritzelWorkspaceManagerElement;
  @Output() isWorkspaceManagerReady = new EventEmitter<CustomEvent<void>>();
  @Output() workspaceChange = new EventEmitter<CustomEvent<IKritzelWorkspaceManagerKritzelWorkspace>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelWorkspace as IKritzelWorkspaceManagerKritzelWorkspace } from 'kritzel-stencil/dist/components';

export declare interface KritzelWorkspaceManager extends Components.KritzelWorkspaceManager {

  isWorkspaceManagerReady: EventEmitter<CustomEvent<void>>;

  workspaceChange: EventEmitter<CustomEvent<IKritzelWorkspaceManagerKritzelWorkspace>>;
}


