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
import { KritzelEngineState } from '../../../interfaces/engine-state.interface';
import { KritzelWorkspace } from '../../../classes/core/workspace.class';
import { KritzelKeyboardHelper } from '../../../helpers/keyboard.helper';
import { KritzelDevicesHelper } from '../../../helpers/devices.helper';
@Component({
  tag: 'kritzel-editor',
  styleUrl: 'kritzel-editor.css',
  shadow: false,
})
export class KritzelEditor {
  @Element() host!: HTMLElement;

  @Prop() scaleMax: number = ABSOLUTE_SCALE_MAX;
  @Prop() scaleMin: number = ABSOLUTE_SCALE_MIN;
  @Prop() controls: KritzelToolbarControl[] = [
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

  @Prop() globalContextMenuItems: ContextMenuItem[] = [
    {
      label: 'Paste',
      icon: 'paste',
      disabled: async () => (await this.engineRef.getCopiedObjects()).length === 0,
      action: menu => this.engineRef.paste(menu.x, menu.y),
    },
    { label: 'Select All', icon: 'select-all', action: () => this.selectAllObjectsInViewport() },
  ];

  @Prop() objectContextMenuItems: ContextMenuItem[] = [
    { label: 'Copy', icon: 'copy', action: () => this.engineRef.copy() },
    {
      label: 'Paste',
      icon: 'paste',
      disabled: async () => (await this.engineRef.getCopiedObjects()).length === 0,
      action: (menu, _) => this.engineRef.paste(menu.x, menu.y),
    },
    { label: 'Delete', icon: 'delete', action: () => this.engineRef.delete() },
    { label: 'Bring to Front', icon: 'bring-to-front', action: () => this.engineRef.bringToFront() },
    { label: 'Send to Back', icon: 'send-to-back', action: () => this.engineRef.sendToBack() },
  ];

  @Prop() customSvgIcons: Record<string, string> = {};
  @Prop() isControlsVisible: boolean = true;
  @Prop() isUtilityPanelVisible: boolean = true;

  @Event() isReady: EventEmitter<HTMLElement>;

  @State() isEngineReady: boolean = false;
  @State() isControlsReady: boolean = false;
  @State() isWorkspaceManagerReady: boolean = false;
  @State() workspaces: KritzelWorkspace[] = [];
  @State() activeWorkspace: KritzelWorkspace;
  @State() isVirtualKeyboardOpen: boolean = false;

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

  @Watch('workspaces')
  onWorkspacesChange(newWorkspaces: KritzelWorkspace[]) {
    if (this.activeWorkspace) {
      const updatedActiveWorkspace = newWorkspaces.find(ws => ws.id === this.activeWorkspace.id);
      if (updatedActiveWorkspace && updatedActiveWorkspace !== this.activeWorkspace) {
        this.activeWorkspace = updatedActiveWorkspace;
      }
    }
  }

  @Listen('dblclick', { passive: false })
  handleTouchStart(event: MouseEvent) {
    if (event.cancelable) {
      event.preventDefault();
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

  @Method()
  async createWorkspace(name: string, viewport?: { translateX: number; translateY: number; scale: number }): Promise<KritzelWorkspace | null> {
    const workspace = new KritzelWorkspace(`workspace-${Date.now()}`, name, viewport);
    return this.engineRef.createWorkspace(workspace);
  }

  @Method()
  async updateWorkspace(workspace: KritzelWorkspace): Promise<void> {
    return this.engineRef.updateWorkspace(workspace);
  }

  @Method()
  async deleteWorkspace(workspace: KritzelWorkspace): Promise<void> {
    return this.engineRef.deleteWorkspace(workspace);
  }

  @Method()
  async getWorkspaces(): Promise<KritzelWorkspace[]> {
    return this.engineRef.getWorkspaces();
  }

  @Method()
  async getActiveWorkspace(): Promise<KritzelWorkspace> {
    return this.engineRef.getActiveWorkspace();
  }

  engineRef!: HTMLKritzelEngineElement;
  controlsRef!: HTMLKritzelControlsElement;
  splitButtonRef!: HTMLKritzelSplitButtonElement;

  componentDidLoad() {
    this.registerCustomSvgIcons();
    this.listenForMobileKeyboard();
    this.setOsSpecificCssVariables();
  }

  async checkIsReady() {
    await customElements.whenDefined('kritzel-editor');
    await customElements.whenDefined('kritzel-workspace-manager');
    await customElements.whenDefined('kritzel-controls');
    await customElements.whenDefined('kritzel-engine');

    if (!this.isEngineReady || !this.isControlsReady || !this.isWorkspaceManagerReady) {
      return;
    }

    this.isReady.emit(this.host);
  }

  onEngineReady(event: CustomEvent<KritzelEngineState>) {
    this.isEngineReady = true;
    this.activeWorkspace = event.detail.activeWorkspace;
    this.workspaces = event.detail.workspaces;
  }

  private registerCustomSvgIcons() {
    for (const [name, svg] of Object.entries(this.customSvgIcons)) {
      KritzelIconRegistry.register(name, svg);
    }
  }

  private listenForMobileKeyboard() {
    KritzelKeyboardHelper.onKeyboardVisibleChanged(isOpen => {
      this.isVirtualKeyboardOpen = isOpen;
    });
  }

  private setOsSpecificCssVariables() {
    const os = KritzelDevicesHelper.detectOS();

    switch (os) {
      case 'iOS':
        // iOS specific adjustments
        this.host.style.setProperty('--kritzel-editor-workspace-manager-top', '14px');
        this.host.style.setProperty('--kritzel-editor-workspace-manager-left', '14px');
        this.host.style.setProperty('--kritzel-editor-controls-bottom', '14px');
        this.host.style.setProperty('--kritzel-editor-controls-transition', 'cubic-bezier(0.25, 0.1, 0.25, 1.0)');
        this.host.style.setProperty('--kritzel-editor-controls-transform', 'translateY(200%)');
        this.host.style.setProperty('--kritzel-editor-controls-transition-duration', '0.25s');
        break;

      case 'Android':
        // Android specific adjustments
        this.host.style.setProperty('--kritzel-editor-workspace-manager-top', '14px');
        this.host.style.setProperty('--kritzel-editor-workspace-manager-left', '14px');
        this.host.style.setProperty('--kritzel-editor-controls-bottom', '24px');
        break;

      default:
        // Default for Windows/Linux
        this.host.style.setProperty('--kritzel-editor-workspace-manager-top', '14px');
        this.host.style.setProperty('--kritzel-editor-workspace-manager-left', '14px');
        this.host.style.setProperty('--kritzel-editor-controls-bottom', '14px');
        break;
    }
  }

  render() {
    return (
      <Host>
        <kritzel-workspace-manager
          workspaces={this.workspaces}
          activeWorkspace={this.activeWorkspace}
          onWorkspaceChange={event => (this.activeWorkspace = event.detail)}
          onIsWorkspaceManagerReady={() => (this.isWorkspaceManagerReady = true)}
        ></kritzel-workspace-manager>

        <kritzel-engine
          ref={el => (this.engineRef = el)}
          workspace={this.activeWorkspace}
          scaleMax={this.scaleMax}
          scaleMin={this.scaleMin}
          globalContextMenuItems={this.globalContextMenuItems}
          objectContextMenuItems={this.objectContextMenuItems}
          onIsEngineReady={event => this.onEngineReady(event)}
          onWorkspacesChange={event => (this.workspaces = event.detail)}
        ></kritzel-engine>

        <kritzel-controls
          class={{ 'keyboard-open': this.isVirtualKeyboardOpen }}
          style={{ display: this.isControlsVisible ? 'flex' : 'none' }}
          ref={el => (this.controlsRef = el)}
          controls={this.controls}
          isUtilityPanelVisible={this.isUtilityPanelVisible}
          onIsControlsReady={() => (this.isControlsReady = true)}
        ></kritzel-controls>
      </Host>
    );
  }
}
