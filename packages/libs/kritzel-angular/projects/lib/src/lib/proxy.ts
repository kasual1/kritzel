/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, NgZone } from '@angular/core';

import { ProxyCmp, proxyOutputs } from './angular-component-lib/utils';

import { Components } from 'kritzel-stencil';


@ProxyCmp({
  inputs: ['colors', 'isExpanded', 'selectedColor']
})
@Component({
  selector: 'kritzel-color-palette',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['colors', 'isExpanded', 'selectedColor'],
})
export class KritzelColorPalette {
  protected el: HTMLKritzelColorPaletteElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['colorChange']);
  }
}


export declare interface KritzelColorPalette extends Components.KritzelColorPalette {

  colorChange: EventEmitter<CustomEvent<string>>;
}


@ProxyCmp({
  inputs: ['items']
})
@Component({
  selector: 'kritzel-context-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['items'],
})
export class KritzelContextMenu {
  protected el: HTMLKritzelContextMenuElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['actionSelected']);
  }
}


import type { ContextMenuItem as IKritzelContextMenuContextMenuItem } from 'kritzel-stencil';

export declare interface KritzelContextMenu extends Components.KritzelContextMenu {

  actionSelected: EventEmitter<CustomEvent<IKritzelContextMenuContextMenuItem>>;
}


@ProxyCmp({
  inputs: ['activeControl', 'controls']
})
@Component({
  selector: 'kritzel-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeControl', 'controls'],
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
  selector: 'kritzel-cursor-trail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: [],
})
export class KritzelCursorTrail {
  protected el: HTMLKritzelCursorTrailElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelCursorTrail extends Components.KritzelCursorTrail {}


@ProxyCmp({
  inputs: ['controls', 'customSvgIcons']
})
@Component({
  selector: 'kritzel-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['controls', 'customSvgIcons'],
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
  inputs: ['activeTool', 'globalContextMenuItems', 'objectContextMenuItems'],
  methods: ['registerTool', 'changeActiveTool', 'changeColor', 'changeStrokeSize', 'disable', 'enable', 'delete', 'copy', 'paste', 'moveToTop', 'moveToBottom', 'selectAllInViewport', 'undo', 'redo']
})
@Component({
  selector: 'kritzel-engine',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeTool', 'globalContextMenuItems', 'objectContextMenuItems'],
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
  inputs: ['fontOptions']
})
@Component({
  selector: 'kritzel-font-family',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['fontOptions'],
})
export class KritzelFontFamily {
  protected el: HTMLKritzelFontFamilyElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelFontFamily extends Components.KritzelFontFamily {}


@ProxyCmp({
  inputs: ['selectedSize', 'sizes']
})
@Component({
  selector: 'kritzel-font-size',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['selectedSize', 'sizes'],
})
export class KritzelFontSize {
  protected el: HTMLKritzelFontSizeElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['sizeChange']);
  }
}


export declare interface KritzelFontSize extends Components.KritzelFontSize {

  sizeChange: EventEmitter<CustomEvent<number>>;
}


@ProxyCmp({
  inputs: ['label', 'name', 'size']
})
@Component({
  selector: 'kritzel-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['label', 'name', 'size'],
})
export class KritzelIcon {
  protected el: HTMLKritzelIconElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelIcon extends Components.KritzelIcon {}


@ProxyCmp({
  inputs: ['selectedSize', 'sizes']
})
@Component({
  selector: 'kritzel-stroke-size',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['selectedSize', 'sizes'],
})
export class KritzelStrokeSize {
  protected el: HTMLKritzelStrokeSizeElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['sizeChange']);
  }
}


export declare interface KritzelStrokeSize extends Components.KritzelStrokeSize {

  sizeChange: EventEmitter<CustomEvent<number>>;
}


