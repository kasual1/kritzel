/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from 'kritzel-stencil/dist/components';

import { defineCustomElement as defineKritzelEditor } from 'kritzel-stencil/dist/components/kritzel-editor.js';
import { defineCustomElement as defineKritzelMenuItem } from 'kritzel-stencil/dist/components/kritzel-menu-item.js';
import { defineCustomElement as defineKritzelMenuNew } from 'kritzel-stencil/dist/components/kritzel-menu-new.js';
import { defineCustomElement as defineKritzelPopup } from 'kritzel-stencil/dist/components/kritzel-popup.js';
import { defineCustomElement as defineKritzelPortalManager } from 'kritzel-stencil/dist/components/kritzel-portal-manager.js';
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
  defineCustomElementFn: defineKritzelMenuItem,
  inputs: ['isDisabled', 'isEditing', 'isSelected', 'item']
})
@Component({
  selector: 'kritzel-menu-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['isDisabled', 'isEditing', 'isSelected', 'item'],
  outputs: ['itemSelect', 'save', 'cancel'],
})
export class KritzelMenuItem {
  protected el: HTMLKritzelMenuItemElement;
  @Output() itemSelect = new EventEmitter<CustomEvent<IKritzelMenuItemKritzelMenuItemNew>>();
  @Output() save = new EventEmitter<CustomEvent<IKritzelMenuItemKritzelMenuItemNew>>();
  @Output() cancel = new EventEmitter<CustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelMenuItemNew as IKritzelMenuItemKritzelMenuItemNew } from 'kritzel-stencil/dist/components';

export declare interface KritzelMenuItem extends Components.KritzelMenuItem {

  itemSelect: EventEmitter<CustomEvent<IKritzelMenuItemKritzelMenuItemNew>>;

  save: EventEmitter<CustomEvent<IKritzelMenuItemKritzelMenuItemNew>>;

  cancel: EventEmitter<CustomEvent<void>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelMenuNew,
  inputs: ['items']
})
@Component({
  selector: 'kritzel-menu-new',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['items'],
  outputs: ['itemSelect'],
})
export class KritzelMenuNew {
  protected el: HTMLKritzelMenuNewElement;
  @Output() itemSelect = new EventEmitter<CustomEvent<IKritzelMenuNewKritzelMenuItemNew>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelMenuItemNew as IKritzelMenuNewKritzelMenuItemNew } from 'kritzel-stencil/dist/components';

export declare interface KritzelMenuNew extends Components.KritzelMenuNew {

  itemSelect: EventEmitter<CustomEvent<IKritzelMenuNewKritzelMenuItemNew>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelPopup,
  inputs: ['anchorId', 'animation', 'closeOnOutsideClick', 'isOpen', 'position'],
  methods: ['open', 'close']
})
@Component({
  selector: 'kritzel-popup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['anchorId', 'animation', 'closeOnOutsideClick', 'isOpen', 'position'],
})
export class KritzelPopup {
  protected el: HTMLKritzelPopupElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelPopup extends Components.KritzelPopup {}


@ProxyCmp({
  defineCustomElementFn: defineKritzelPortalManager
})
@Component({
  selector: 'kritzel-portal-manager',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: [],
})
export class KritzelPortalManager {
  protected el: HTMLKritzelPortalManagerElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelPortalManager extends Components.KritzelPortalManager {}


