/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, NgZone } from '@angular/core';

import { ProxyCmp, proxyOutputs } from './angular-component-lib/utils';

import { Components } from 'kritzel-stencil';


@ProxyCmp({
  inputs: ['brushOptions', 'type']
})
@Component({
  selector: 'kritzel-brush-style',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['brushOptions', 'type'],
})
export class KritzelBrushStyle {
  protected el: HTMLKritzelBrushStyleElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['typeChange']);
  }
}


export declare interface KritzelBrushStyle extends Components.KritzelBrushStyle {

  typeChange: EventEmitter<CustomEvent<'pen' | 'highlighter'>>;
}


@ProxyCmp({
  inputs: ['size', 'value']
})
@Component({
  selector: 'kritzel-color',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['size', 'value'],
})
export class KritzelColor {
  protected el: HTMLKritzelColorElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelColor extends Components.KritzelColor {}


@ProxyCmp({
  inputs: ['colors', 'isExpanded', 'isOpaque', 'selectedColor']
})
@Component({
  selector: 'kritzel-color-palette',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['colors', 'isExpanded', 'isOpaque', 'selectedColor'],
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
    proxyOutputs(this, this.el, ['actionSelected', 'close']);
  }
}


import type { ContextMenuItem as IKritzelContextMenuContextMenuItem } from 'kritzel-stencil';

export declare interface KritzelContextMenu extends Components.KritzelContextMenu {

  actionSelected: EventEmitter<CustomEvent<IKritzelContextMenuContextMenuItem>>;

  close: EventEmitter<CustomEvent<void>>;
}


@ProxyCmp({
  inputs: ['isExpanded', 'tool']
})
@Component({
  selector: 'kritzel-control-brush-config',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['isExpanded', 'tool'],
})
export class KritzelControlBrushConfig {
  protected el: HTMLKritzelControlBrushConfigElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['toolChange']);
  }
}


import type { KritzelBrushTool as IKritzelControlBrushConfigKritzelBrushTool } from 'kritzel-stencil';

export declare interface KritzelControlBrushConfig extends Components.KritzelControlBrushConfig {

  toolChange: EventEmitter<CustomEvent<IKritzelControlBrushConfigKritzelBrushTool>>;
}


@ProxyCmp({
  inputs: ['isExpanded', 'tool']
})
@Component({
  selector: 'kritzel-control-text-config',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['isExpanded', 'tool'],
})
export class KritzelControlTextConfig {
  protected el: HTMLKritzelControlTextConfigElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['toolChange']);
  }
}


import type { KritzelTextTool as IKritzelControlTextConfigKritzelTextTool } from 'kritzel-stencil';

export declare interface KritzelControlTextConfig extends Components.KritzelControlTextConfig {

  toolChange: EventEmitter<CustomEvent<IKritzelControlTextConfigKritzelTextTool>>;
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
    proxyOutputs(this, this.el, ['controlsReady']);
  }
}


export declare interface KritzelControls extends Components.KritzelControls {

  controlsReady: EventEmitter<CustomEvent<void>>;
}


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
  inputs: ['options', 'selectStyles', 'value', 'width']
})
@Component({
  selector: 'kritzel-dropdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['options', 'selectStyles', 'value', 'width'],
})
export class KritzelDropdown {
  protected el: HTMLKritzelDropdownElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['valueChanged']);
  }
}


export declare interface KritzelDropdown extends Components.KritzelDropdown {

  valueChanged: EventEmitter<CustomEvent<string>>;
}


@ProxyCmp({
})
@Component({
  selector: 'kritzel-dummy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: [],
})
export class KritzelDummy {
  protected el: HTMLKritzelDummyElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelDummy extends Components.KritzelDummy {}


@ProxyCmp({
  inputs: ['controls', 'customSvgIcons', 'hideControls']
})
@Component({
  selector: 'kritzel-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['controls', 'customSvgIcons', 'hideControls'],
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
  methods: ['registerTool', 'changeActiveTool', 'setFocus', 'disable', 'enable', 'delete', 'copy', 'paste', 'moveToTop', 'moveToBottom', 'selectAllInViewport', 'undo', 'redo', 'hideContextMenu']
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
    proxyOutputs(this, this.el, ['engineReady', 'activeToolChange']);
  }
}


import type { KritzelBaseTool as IKritzelEngineKritzelBaseTool } from 'kritzel-stencil';

export declare interface KritzelEngine extends Components.KritzelEngine {

  engineReady: EventEmitter<CustomEvent<void>>;

  activeToolChange: EventEmitter<CustomEvent<IKritzelEngineKritzelBaseTool>>;
}


@ProxyCmp({
  inputs: ['color', 'fontFamily', 'size']
})
@Component({
  selector: 'kritzel-font',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['color', 'fontFamily', 'size'],
})
export class KritzelFont {
  protected el: HTMLKritzelFontElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelFont extends Components.KritzelFont {}


@ProxyCmp({
  inputs: ['fontOptions', 'selectedFontFamily']
})
@Component({
  selector: 'kritzel-font-family',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['fontOptions', 'selectedFontFamily'],
})
export class KritzelFontFamily {
  protected el: HTMLKritzelFontFamilyElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['fontFamilyChange']);
  }
}


export declare interface KritzelFontFamily extends Components.KritzelFontFamily {

  fontFamilyChange: EventEmitter<CustomEvent<string>>;
}


@ProxyCmp({
  inputs: ['fontFamily', 'selectedSize', 'sizes']
})
@Component({
  selector: 'kritzel-font-size',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['fontFamily', 'selectedSize', 'sizes'],
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


@ProxyCmp({
  inputs: ['anchorElement', 'arrowSize', 'isVisible', 'offsetY']
})
@Component({
  selector: 'kritzel-tooltip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['anchorElement', 'arrowSize', 'isVisible', 'offsetY'],
})
export class KritzelTooltip {
  protected el: HTMLKritzelTooltipElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface KritzelTooltip extends Components.KritzelTooltip {}


@ProxyCmp({
})
@Component({
  selector: 'kritzel-utility-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: [],
})
export class KritzelUtilityPanel {
  protected el: HTMLKritzelUtilityPanelElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['undo', 'redo', 'delete']);
  }
}


export declare interface KritzelUtilityPanel extends Components.KritzelUtilityPanel {

  undo: EventEmitter<CustomEvent<void>>;

  redo: EventEmitter<CustomEvent<void>>;

  delete: EventEmitter<CustomEvent<void>>;
}


