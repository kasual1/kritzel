/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from 'kritzel-stencil/dist/components';

import { defineCustomElement as defineKritzelEditor } from 'kritzel-stencil/dist/components/kritzel-editor.js';
import { defineCustomElement as defineKritzelMenu } from 'kritzel-stencil/dist/components/kritzel-menu.js';
import { defineCustomElement as defineKritzelSplitButton } from 'kritzel-stencil/dist/components/kritzel-split-button.js';
import { defineCustomElement as defineKritzelWorkspaceMenu } from 'kritzel-stencil/dist/components/kritzel-workspace-menu.js';
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
  inputs: ['items']
})
@Component({
  selector: 'kritzel-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['items'],
  outputs: ['itemSelect'],
})
export class KritzelMenu {
  protected el: HTMLKritzelMenuElement;
  @Output() itemSelect = new EventEmitter<CustomEvent<IKritzelMenuMenuItem>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { MenuItem as IKritzelMenuMenuItem } from 'kritzel-stencil/dist/components';

export declare interface KritzelMenu extends Components.KritzelMenu {

  itemSelect: EventEmitter<CustomEvent<IKritzelMenuMenuItem>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelSplitButton,
  inputs: ['buttonIcon', 'buttonText', 'disabled', 'dropdownIcon', 'options']
})
@Component({
  selector: 'kritzel-split-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['buttonIcon', 'buttonText', 'disabled', 'dropdownIcon', 'options'],
  outputs: ['buttonClick', 'optionSelect'],
})
export class KritzelSplitButton {
  protected el: HTMLKritzelSplitButtonElement;
  @Output() buttonClick = new EventEmitter<CustomEvent<void>>();
  @Output() optionSelect = new EventEmitter<CustomEvent<IKritzelSplitButtonSplitButtonOption>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { SplitButtonOption as IKritzelSplitButtonSplitButtonOption } from 'kritzel-stencil/dist/components';

export declare interface KritzelSplitButton extends Components.KritzelSplitButton {

  buttonClick: EventEmitter<CustomEvent<void>>;

  optionSelect: EventEmitter<CustomEvent<IKritzelSplitButtonSplitButtonOption>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelWorkspaceMenu,
  inputs: ['workspace']
})
@Component({
  selector: 'kritzel-workspace-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['workspace'],
  outputs: ['deleteWorkspace', 'renameWorkspace'],
})
export class KritzelWorkspaceMenu {
  protected el: HTMLKritzelWorkspaceMenuElement;
  @Output() deleteWorkspace = new EventEmitter<CustomEvent<IKritzelWorkspaceMenuKritzelWorkspace>>();
  @Output() renameWorkspace = new EventEmitter<CustomEvent<IKritzelWorkspaceMenuKritzelWorkspace>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelWorkspace as IKritzelWorkspaceMenuKritzelWorkspace } from 'kritzel-stencil/dist/components';

export declare interface KritzelWorkspaceMenu extends Components.KritzelWorkspaceMenu {

  deleteWorkspace: EventEmitter<CustomEvent<IKritzelWorkspaceMenuKritzelWorkspace>>;

  renameWorkspace: EventEmitter<CustomEvent<IKritzelWorkspaceMenuKritzelWorkspace>>;
}


