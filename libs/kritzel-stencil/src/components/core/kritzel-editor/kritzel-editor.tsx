import { Component, Host, Listen, Prop, Element, h, Method, Event, State, EventEmitter, Watch } from '@stencil/core';
import { KritzelIconRegistry } from '../../../classes/registries/icon-registry.class';
import { KritzelToolbarControl } from '../../../interfaces/toolbar-control.interface';
import { DEFAULT_KRITZEL_CONTROLS } from '../../../configs/default-toolbar-controls';
import { KritzelBaseObject } from '../../../classes/objects/base-object.class';
@Component({
  tag: 'kritzel-editor',
  styleUrl: 'kritzel-editor.css',
  shadow: false,
})
export class KritzelEditor {
  @Prop()
  controls: KritzelToolbarControl[] = DEFAULT_KRITZEL_CONTROLS;

  @Prop()
  customSvgIcons: Record<string, string> = {};

  @Prop()
  hideControls: boolean = false;

  @Event()
  isReady: EventEmitter<HTMLElement>;

  @Element()
  host!: HTMLElement;

  @State()
  isEngineReady: boolean = false;

  @State()
  isControlsReady: boolean = false;

  @Watch('isEngineReady')
  onIsEngineReady(newValue: boolean) {
    if (newValue && this.isControlsReady) {
      this.checkIsReady();
    }
  }

  @Watch('isControlsReady')
  onIsControlsReady(newValue: boolean) {
    if (newValue && this.isEngineReady) {
      this.checkIsReady();
    }
  }

  @Method()
  async getObjectById<T extends KritzelBaseObject>(id: string): Promise<T | null> {
    return this.engineRef.getObjectById(id);
  }

  @Method()
  async addObject<T extends KritzelBaseObject>(object: T): Promise<T | null> {
    return this.engineRef.addObject(object);
  }

  @Method()
  async updateObject<T extends KritzelBaseObject>(object: T, updatedProperties: Partial<T>): Promise<T | null> {
    return this.engineRef.updateObject(object, updatedProperties);
  }

  @Method()
  async removeObject<T extends KritzelBaseObject>(object: T): Promise<T | null> {
    return this.engineRef.removeObject(object);
  }

  @Method()
  async getSelectedObjects(): Promise<KritzelBaseObject[]> {
    return this.engineRef.getSelectedObjects();
  }

  @Method()
  async selectObjects(objects: KritzelBaseObject[]) {
    return this.engineRef.selectObjects(objects);
  }

  @Method()
  async selectAllObjectsInViewport() {
    return this.engineRef.selectAllObjectsInViewport();
  }

  @Method()
  async clearSelection() {
    this.engineRef.clearSelection();
  }

  @Listen('dblclick', { passive: false })
  handleTouchStart(event: TouchEvent) {
    if (event.cancelable) {
      event.preventDefault();
    }
  }

  @Listen('keydown', { target: 'window' })
  handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.controlsRef?.closeTooltip();
    }
  }

  engineRef!: HTMLKritzelEngineElement;

  controlsRef!: HTMLKritzelControlsElement;

  componentDidLoad() {
    this.registerCustomSvgIcons();
  }

  async checkIsReady() {
    await customElements.whenDefined('kritzel-editor');
    await customElements.whenDefined('kritzel-controls');
    await customElements.whenDefined('kritzel-engine');

    if (!this.isEngineReady || !this.isControlsReady) {
      return;
    }

    this.isReady.emit(this.host);
  }

  private registerCustomSvgIcons() {
    for (const [name, svg] of Object.entries(this.customSvgIcons)) {
      KritzelIconRegistry.register(name, svg);
    }
  }

  render() {
    return (
      <Host>
        <kritzel-engine ref={el => (this.engineRef = el)} onIsEngineReady={() => (this.isEngineReady = true)}></kritzel-engine>
        <kritzel-controls
          ref={el => (this.controlsRef = el)}
          controls={this.controls}
          style={this.hideControls ? { display: 'none' } : { display: 'flex' }}
          onIsControlsReady={() => (this.isControlsReady = true)}
        ></kritzel-controls>
      </Host>
    );
  }
}
