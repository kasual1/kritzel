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
  inputs: ['isDisabled', 'isEditing', 'isSelected', 'item']
})
@Component({
  selector: 'kritzel-menu-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['isDisabled', 'isEditing', 'isSelected', 'item'],
  outputs: ['save', 'cancel'],
})
export class KritzelMenuItem {
  protected el: HTMLKritzelMenuItemElement;
  @Output() save = new EventEmitter<CustomEvent<IKritzelMenuItemKritzelMenuItemNew>>();
  @Output() cancel = new EventEmitter<CustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelMenuItemNew as IKritzelMenuItemKritzelMenuItemNew } from 'kritzel-stencil/dist/components';

export declare interface KritzelMenuItem extends Components.KritzelMenuItem {

  save: EventEmitter<CustomEvent<IKritzelMenuItemKritzelMenuItemNew>>;

  cancel: EventEmitter<CustomEvent<void>>;
}


