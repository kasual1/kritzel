import { Component, Host, Listen, Prop, Element, h, Method } from '@stencil/core';
import { KritzelIconRegistry } from '../../../classes/registries/icon-registry.class';
import { KritzelToolbarControl } from '../../../interfaces/toolbar-control.interface';
import { DEFAULT_KRITZEL_CONTROLS } from '../../../configs/default-toolbar-controls';
import { KritzelBaseObject } from '../../../classes/objects/base-object.class';
import { KritzelText } from '../../../classes/objects/text.class';

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

  @Element()
  host!: HTMLElement;

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

  componentWillLoad() {
    this.registerCustomSvgIcons();
  }

  private registerCustomSvgIcons() {
    for (const [name, svg] of Object.entries(this.customSvgIcons)) {
      KritzelIconRegistry.register(name, svg);
    }
  }

  onAddText() {
    const text = new KritzelText({
      value: 'Hello Kritzel!',
      translateX: 0,
      translateY: 0,
      fontSize: 24,
      fontFamily: 'Arial',
      fontColor: '#000000',
      height: 200,
      width: 200,
    });

    this.engineRef.addObject(text).then(() => {
      this.engineRef.selectObjects([text]);
    });
  }



  render() {
    return (
      <Host>
        <button style={{position: 'absolute', top: '0', left: '0', zIndex: '100'}} onClick={() => this.onAddText()}>Add text</button>
        <kritzel-engine ref={el => (this.engineRef = el)}></kritzel-engine>
        <kritzel-controls ref={el => (this.controlsRef = el)} controls={this.controls} style={this.hideControls ? { display: 'none' } : { display: 'flex' }}></kritzel-controls>
      </Host>
    );
  }
}
