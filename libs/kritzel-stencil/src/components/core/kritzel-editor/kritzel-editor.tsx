import { Component, Host, Listen, Prop, Element, h } from '@stencil/core';
import { KritzelIconRegistry } from '../../../classes/icon-registry.class';
import { KritzelToolbarControl } from '../../../interfaces/toolbar-control.interface';
import { DEFAULT_KRITZEL_CONTROLS } from '../../../configs/default-toolbar-controls';
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

  engineRef!: HTMLKritzelEngineElement;

  @Listen('dblclick', { passive: false })
  handleTouchStart(event: TouchEvent) {
    if (event.cancelable) {
      event.preventDefault();
    }
  }

  componentWillLoad() {
    this.registerCustomSvgIcons();
  }

  text: KritzelText | null = null;

  addTextObject() {
    const obj = new KritzelText({
      translateX: 100,
      translateY: 100,
      width: 200,
      height: 50,
      value: 'New Text',
      fontSize: 16,
      fontFamily: 'Arial',
      fontColor: '#000000',
      scale: 1,
    });

    this.engineRef.addObject<KritzelText>(obj).then((text) => this.text = text);
  }

  getTextObject() {
    this.engineRef.getObjectById<KritzelText>(this.text?.id || '').then((object) => {
      console.log('Retrieved Text Object:', object);
    });
  }

  updateTextObject() {
    const updatedText =  {
      value: 'Updated Text',
      translateX: 150,
      translateY: 150,
      rotation: Math.PI / 2
    };

    this.engineRef.updateObject<KritzelText>(this.text, updatedText)
      .then((text) => {
      this.text = text;
      console.log('Updated Text Object:', text);
    });
  }

  removeTextObject() {
    this.engineRef.removeObject<KritzelText>(this.text).then((text) => {
      console.log('Text Object removed', text);
      this.text = null;
    });
  }

  private registerCustomSvgIcons() {
    for (const [name, svg] of Object.entries(this.customSvgIcons)) {
      KritzelIconRegistry.register(name, svg);
    }
  }

  render() {
    return (
      <Host>
        <div class="button-panel" style={{ position: 'absolute', top: '0', left: '0', zIndex: '10', display: 'flex', flexDirection: 'row' }}>
          <button onClick={() => this.addTextObject()}>Add Text</button>
          <button onClick={() => this.getTextObject()}>Get Text</button>
          <button onClick={() => this.updateTextObject()}>Update Text</button>
          <button onClick={() => this.removeTextObject()}>Remove Text</button>
          <button onClick={() => this.engineRef.selectObjects([this.text])}>Select Text</button>
          <button onClick={() => this.engineRef.selectAllObjectsInViewport()}>Select All</button>
          <button onClick={() => this.engineRef.clearSelection()}>Clear Selection</button>
        </div>

        <kritzel-engine ref={el => (this.engineRef = el)}></kritzel-engine>
        <kritzel-controls controls={this.controls} style={this.hideControls ? { display: 'none' } : { display: 'flex' }}></kritzel-controls>
      </Host>
    );
  }
}
