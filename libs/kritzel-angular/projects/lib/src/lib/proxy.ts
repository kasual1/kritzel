/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from 'kritzel-stencil/dist/components';

import { defineCustomElement as defineKritzelEditor } from 'kritzel-stencil/dist/components/kritzel-editor.js';
import { defineCustomElement as defineKritzelMenuItem } from 'kritzel-stencil/dist/components/kritzel-menu-item.js';
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
  inputs: ['item', 'parent']
})
@Component({
  selector: 'kritzel-menu-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['item', 'parent'],
  outputs: ['itemSelect', 'itemSave', 'itemCancel', 'itemToggleChildMenu', 'itemCloseChildMenu'],
})
export class KritzelMenuItem {
  protected el: HTMLKritzelMenuItemElement;
  @Output() itemSelect = new EventEmitter<CustomEvent<{ item: IKritzelMenuItemIKritzelMenuItem; parent: IKritzelMenuItemIKritzelMenuItem }>>();
  @Output() itemSave = new EventEmitter<CustomEvent<[object Object]>>();
  @Output() itemCancel = new EventEmitter<CustomEvent<[object Object]>>();
  @Output() itemToggleChildMenu = new EventEmitter<CustomEvent<{ item: IKritzelMenuItemIKritzelMenuItem; childMenuAnchor: HTMLElement }>>();
  @Output() itemCloseChildMenu = new EventEmitter<CustomEvent<[object Object]>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { IKritzelMenuItem as IKritzelMenuItemIKritzelMenuItem } from 'kritzel-stencil/dist/components';

export declare interface KritzelMenuItem extends Components.KritzelMenuItem {

  itemSelect: EventEmitter<CustomEvent<{ item: IKritzelMenuItemIKritzelMenuItem; parent: IKritzelMenuItemIKritzelMenuItem }>>;

  itemSave: EventEmitter<CustomEvent<[object Object]>>;

  itemCancel: EventEmitter<CustomEvent<[object Object]>>;

  itemToggleChildMenu: EventEmitter<CustomEvent<{ item: IKritzelMenuItemIKritzelMenuItem; childMenuAnchor: HTMLElement }>>;

  itemCloseChildMenu: EventEmitter<CustomEvent<[object Object]>>;
}


