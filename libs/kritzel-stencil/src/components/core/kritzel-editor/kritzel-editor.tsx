import { Component, Host, Listen, Prop, Element, h, Method, Event, State, EventEmitter, Watch } from '@stencil/core';
import { KritzelIconRegistry } from '../../../classes/registries/icon-registry.class';
import { KritzelToolbarControl } from '../../../interfaces/toolbar-control.interface';
import { KritzelBaseObject } from '../../../classes/objects/base-object.class';
import { KritzelSelectionTool } from '../../../classes/tools/selection-tool.class';
import { KritzelEraserTool } from '../../../classes/tools/eraser-tool.class';
import { KritzelImageTool } from '../../../classes/tools/image-tool.class';
import { KritzelBrushTool } from '../../../classes/tools/brush-tool.class';
import { KritzelTextTool } from '../../../classes/tools/text-tool.class';
import { ContextMenuItem } from '../../../interfaces/context-menu-item.interface';
import { DEFAULT_BRUSH_CONFIG } from '../../../configs/default-brush-tool.config';
import { DEFAULT_TEXT_CONFIG } from '../../../configs/default-text-tool.config';
import { ABSOLUTE_SCALE_MAX, ABSOLUTE_SCALE_MIN } from '../../../constants/engine.constants';
import { KritzelCustomElement } from '../../../classes/objects/custom-element.class';

@Component({
  tag: 'kritzel-editor',
  styleUrl: 'kritzel-editor.css',
  shadow: false,
})
export class KritzelEditor {
  @Prop()
  scaleMax: number = ABSOLUTE_SCALE_MAX;

  @Prop()
  scaleMin: number = ABSOLUTE_SCALE_MIN;

  @Prop()
  controls: KritzelToolbarControl[] = [
    {
      name: 'selection',
      type: 'tool',
      isDefault: true,
      tool: KritzelSelectionTool,
      icon: 'cursor',
    },
    {
      name: 'brush',
      type: 'tool',
      tool: KritzelBrushTool,
      icon: 'pen',
      config: DEFAULT_BRUSH_CONFIG,
    },
    {
      name: 'eraser',
      type: 'tool',
      tool: KritzelEraserTool,
      icon: 'eraser',
    },
    {
      name: 'text',
      type: 'tool',
      tool: KritzelTextTool,
      icon: 'type',
      config: DEFAULT_TEXT_CONFIG,
    },
    {
      name: 'image',
      type: 'tool',
      tool: KritzelImageTool,
      icon: 'image',
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'config',
      type: 'config',
    },
  ];

  @Prop()
  globalContextMenuItems: ContextMenuItem[] = [
    {
      label: 'Paste',
      icon: 'paste',
      disabled: async () => (await this.engineRef.getCopiedObjects()).length === 0,
      action: menu => this.engineRef.paste(menu.x, menu.y),
    },
    { label: 'Select All', icon: 'select-all', action: () => this.selectAllObjectsInViewport() },
  ];

  @Prop()
  objectContextMenuItems: ContextMenuItem[] = [
    {
      label: 'Edit',
      icon: 'pen',
      visible: (_, objects) => objects.length === 1 && objects[0].isEditable,
      action: (_, objects) => {
        if (objects.length === 1) {
          const object = objects[0];
          if (object.isEditable) {
            object.edit();
          }
        }
      },
    },
    { label: 'Copy', icon: 'copy', action: () => this.engineRef.copy() },
    {
      label: 'Paste',
      icon: 'paste',
      disabled: async () => (await this.engineRef.getCopiedObjects()).length === 0,
      action: (menu, _) => this.engineRef.paste(menu.x, menu.y),
    },
    { label: 'Delete', icon: 'delete', action: () => this.engineRef.delete() },
    { label: 'Bring to Front', icon: 'bring-to-front', action: () => this.engineRef.moveToTop() },
    { label: 'Send to Back', icon: 'send-to-back', action: () => this.engineRef.moveToBottom() },
  ];

  @Prop()
  customSvgIcons: Record<string, string> = {};

  @Prop()
  isControlsVisible: boolean = true;

  @Prop()
  isUtilityPanelVisible: boolean = true;

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

  @Method()
  async centerObjectInViewport(object: KritzelBaseObject) {
    return this.engineRef.centerObjectInViewport(object);
  }

  @Listen('dblclick', { passive: false })
  handleTouchStart(event: MouseEvent) {
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

    const video = document.createElement('video');
    video.src = 'https://www.w3schools.com/html/mov_bbb.mp4';
    video.controls = true;
    video.width = 320;
    video.height = 240;
    video.style.cursor = 'pointer';
    video.style.width = '320px';
    video.style.height = '240px';
    video.style.objectFit = 'fill';

    video.addEventListener('play', event => {
      console.log('Video started!', event);
    });

    const customElement = new KritzelCustomElement({
      element: video,
      translateX: 200,
      translateY: 200,
      height: 240,
      width: 320,
    });

    this.engineRef.addObject(customElement);

    const button = document.createElement('button');
    button.textContent = 'Custom Button';
    button.style.position = 'absolute';
    button.style.width = '150px';
    button.style.height = '50px';
    button.style.zIndex = '1000';
    button.onclick = () => {
      alert('Custom button clicked!');
    };

    const customButtonElement = new KritzelCustomElement({
      element: button,
      translateX: 10,
      translateY: 10,
      height: 50,
      width: 150,
    });

    this.engineRef.addObject(customButtonElement);

    const button2 = document.createElement('button');
    button2.textContent = 'Custom Button';
    button2.style.position = 'absolute';
    button2.style.width = '150px';
    button2.style.height = '50px';
    button2.style.zIndex = '1000';
    button2.onclick = () => {
      alert('Custom button clicked!');
    };

    const customButtonElement2 = new KritzelCustomElement({
      element: button2,
      translateX: 410,
      translateY: 10,
      height: 50,
      width: 150,
    });

    this.engineRef.addObject(customButtonElement2);
  }

  private registerCustomSvgIcons() {
    for (const [name, svg] of Object.entries(this.customSvgIcons)) {
      KritzelIconRegistry.register(name, svg);
    }
  }

  render() {
    return (
      <Host>
        <kritzel-engine
          ref={el => (this.engineRef = el)}
          onIsEngineReady={() => (this.isEngineReady = true)}
          scaleMax={this.scaleMax}
          scaleMin={this.scaleMin}
          globalContextMenuItems={this.globalContextMenuItems}
          objectContextMenuItems={this.objectContextMenuItems}
        ></kritzel-engine>

        <kritzel-controls
          ref={el => (this.controlsRef = el)}
          controls={this.controls}
          isUtilityPanelVisible={this.isUtilityPanelVisible}
          style={this.isControlsVisible ? { display: 'flex' } : { display: 'none' }}
          onIsControlsReady={() => (this.isControlsReady = true)}
        ></kritzel-controls>
      </Host>
    );
  }
}
