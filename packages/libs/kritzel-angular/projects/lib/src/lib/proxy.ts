/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, NgZone } from '@angular/core';

import { ProxyCmp, proxyOutputs } from './angular-component-lib/utils';

import { Components } from 'kritzel-stencil';


@ProxyCmp({
  inputs: ['controls', 'selectedControl']
})
@Component({
  selector: 'kritzel-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['controls', 'selectedControl'],
})
export class KritzelControls {
  protected el: HTMLKritzelControlsElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelControls extends Components.KritzelControls {}


@ProxyCmp({
})
@Component({
  selector: 'kritzel-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: [],
})
export class KritzelEditor {
  protected el: HTMLKritzelEditorElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelEditor extends Components.KritzelEditor {}


@ProxyCmp({
  inputs: ['activeTool'],
  methods: ['registerTool', 'changeActiveTool']
})
@Component({
  selector: 'kritzel-engine',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeTool'],
})
export class KritzelEngine {
  protected el: HTMLKritzelEngineElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['activeToolChange']);
  }
}


import type { KritzelTool as IKritzelEngineKritzelTool } from 'kritzel-stencil';

export declare interface KritzelEngine extends Components.KritzelEngine {

  activeToolChange: EventEmitter<CustomEvent<IKritzelEngineKritzelTool>>;
}


@ProxyCmp({
  inputs: ['label', 'name']
})
@Component({
  selector: 'kritzel-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['label', 'name'],
})
export class KritzelIcon {
  protected el: HTMLKritzelIconElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelIcon extends Components.KritzelIcon {}


