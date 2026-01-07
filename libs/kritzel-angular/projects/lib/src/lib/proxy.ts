/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from 'kritzel-stencil/dist/components';

import { defineCustomElement as defineKritzelControlLineConfig } from 'kritzel-stencil/dist/components/kritzel-control-line-config.js';
import { defineCustomElement as defineKritzelControlShapeConfig } from 'kritzel-stencil/dist/components/kritzel-control-shape-config.js';
import { defineCustomElement as defineKritzelEditor } from 'kritzel-stencil/dist/components/kritzel-editor.js';
import { defineCustomElement as defineKritzelLineEndings } from 'kritzel-stencil/dist/components/kritzel-line-endings.js';
import { defineCustomElement as defineKritzelShapeFill } from 'kritzel-stencil/dist/components/kritzel-shape-fill.js';
@ProxyCmp({
  defineCustomElementFn: defineKritzelControlLineConfig,
  inputs: ['isExpanded', 'tool']
})
@Component({
  selector: 'kritzel-control-line-config',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['isExpanded', 'tool'],
  outputs: ['toolChange'],
})
export class KritzelControlLineConfig {
  protected el: HTMLKritzelControlLineConfigElement;
  @Output() toolChange = new EventEmitter<CustomEvent<IKritzelControlLineConfigKritzelLineTool>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelLineTool as IKritzelControlLineConfigKritzelLineTool } from 'kritzel-stencil/dist/components';

export declare interface KritzelControlLineConfig extends Components.KritzelControlLineConfig {

  toolChange: EventEmitter<CustomEvent<IKritzelControlLineConfigKritzelLineTool>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelControlShapeConfig,
  inputs: ['isExpanded', 'tool']
})
@Component({
  selector: 'kritzel-control-shape-config',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['isExpanded', 'tool'],
  outputs: ['toolChange'],
})
export class KritzelControlShapeConfig {
  protected el: HTMLKritzelControlShapeConfigElement;
  @Output() toolChange = new EventEmitter<CustomEvent<IKritzelControlShapeConfigKritzelShapeTool>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { KritzelShapeTool as IKritzelControlShapeConfigKritzelShapeTool } from 'kritzel-stencil/dist/components';

export declare interface KritzelControlShapeConfig extends Components.KritzelControlShapeConfig {

  toolChange: EventEmitter<CustomEvent<IKritzelControlShapeConfigKritzelShapeTool>>;
}


@ProxyCmp({
  defineCustomElementFn: defineKritzelEditor,
  inputs: ['controls', 'customSvgIcons', 'globalContextMenuItems', 'isControlsVisible', 'isUtilityPanelVisible', 'objectContextMenuItems', 'scaleMax', 'scaleMin', 'syncConfig'],
  methods: ['getObjectById', 'addObject', 'updateObject', 'removeObject', 'getSelectedObjects', 'selectObjects', 'selectAllObjectsInViewport', 'clearSelection', 'centerObjectInViewport', 'createWorkspace', 'updateWorkspace', 'deleteWorkspace', 'getWorkspaces', 'getActiveWorkspace']
})
@Component({
  selector: 'kritzel-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['controls', 'customSvgIcons', 'globalContextMenuItems', 'isControlsVisible', 'isUtilityPanelVisible', 'objectContextMenuItems', 'scaleMax', 'scaleMin', 'syncConfig'],
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


