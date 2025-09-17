/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from 'kritzel-stencil/dist/components';

import { defineCustomElement as defineKritzelEditor } from 'kritzel-stencil/dist/components/kritzel-editor.js';
import { defineCustomElement as defineKritzelMenuItem } from 'kritzel-stencil/dist/components/kritzel-menu-item.js';
import { defineCustomElement as defineKritzelMenuNew } from 'kritzel-stencil/dist/components/kritzel-menu-new.js';
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
  @Output() itemSelect = new EventEmitter<CustomEvent<{ item: IKritzelMenuItemKritzelMenuItemNew; parent: IKritzelMenuItemKritzelMenuItemNew }>>();
  @Output() itemSave = new EventEmitter<CustomEvent<IKritzelMenuItemKritzelMenuItemNew>>();
  @Output() itemCancel = new EventEmitter<CustomEvent<IKritzelMenuItemKritzelMenuItemNew>>();
  @Output() itemToggleChildMenu = new EventEmitter<CustomEvent<{ item: IKritzelMenuItemKritzelMenuItemNew; childMenuAnchor: HTMLElement }>>();
  @Output() itemCloseChildMenu = new EventEmitter<CustomEvent<IKritzelMenuItemKritzelMenuItemNew>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelMenuItemNew as IKritzelMenuItemKritzelMenuItemNew } from 'kritzel-stencil/dist/components';

export declare interface KritzelMenuItem extends Components.KritzelMenuItem {

  itemSelect: EventEmitter<CustomEvent<{ item: IKritzelMenuItemKritzelMenuItemNew; parent: IKritzelMenuItemKritzelMenuItemNew }>>;

  itemSave: EventEmitter<CustomEvent<IKritzelMenuItemKritzelMenuItemNew>>;

  itemCancel: EventEmitter<CustomEvent<IKritzelMenuItemKritzelMenuItemNew>>;

  itemToggleChildMenu: EventEmitter<CustomEvent<{ item: IKritzelMenuItemKritzelMenuItemNew; childMenuAnchor: HTMLElement }>>;

  itemCloseChildMenu: EventEmitter<CustomEvent<IKritzelMenuItemKritzelMenuItemNew>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelMenuNew,
  inputs: ['items', 'parent']
})
@Component({
  selector: 'kritzel-menu-new',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['items', 'parent'],
  outputs: ['itemSelect', 'itemSave', 'itemCancel', 'itemToggleChildMenu', 'itemCloseChildMenu', 'close'],
})
export class KritzelMenuNew {
  protected el: HTMLKritzelMenuNewElement;
  @Output() itemSelect = new EventEmitter<CustomEvent<{ item: IKritzelMenuNewKritzelMenuItemNew; parent: IKritzelMenuNewKritzelMenuItemNew }>>();
  @Output() itemSave = new EventEmitter<CustomEvent<IKritzelMenuNewKritzelMenuItemNew>>();
  @Output() itemCancel = new EventEmitter<CustomEvent<IKritzelMenuNewKritzelMenuItemNew>>();
  @Output() itemToggleChildMenu = new EventEmitter<CustomEvent<{ item: IKritzelMenuNewKritzelMenuItemNew; childMenuAnchor: HTMLElement }>>();
  @Output() itemCloseChildMenu = new EventEmitter<CustomEvent<IKritzelMenuNewKritzelMenuItemNew>>();
  @Output() close = new EventEmitter<CustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelMenuItemNew as IKritzelMenuNewKritzelMenuItemNew } from 'kritzel-stencil/dist/components';

export declare interface KritzelMenuNew extends Components.KritzelMenuNew {

  itemSelect: EventEmitter<CustomEvent<{ item: IKritzelMenuNewKritzelMenuItemNew; parent: IKritzelMenuNewKritzelMenuItemNew }>>;

  itemSave: EventEmitter<CustomEvent<IKritzelMenuNewKritzelMenuItemNew>>;

  itemCancel: EventEmitter<CustomEvent<IKritzelMenuNewKritzelMenuItemNew>>;

  itemToggleChildMenu: EventEmitter<CustomEvent<{ item: IKritzelMenuNewKritzelMenuItemNew; childMenuAnchor: HTMLElement }>>;

  itemCloseChildMenu: EventEmitter<CustomEvent<IKritzelMenuNewKritzelMenuItemNew>>;

  close: EventEmitter<CustomEvent<void>>;
}


