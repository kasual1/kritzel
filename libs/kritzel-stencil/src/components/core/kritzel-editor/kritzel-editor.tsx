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
import { KritzelWorkspace } from '../../../classes/workspace.class';
import { KritzelMenuItemNew } from '../../../interfaces/menu-item-new.interface';
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
      tool: KritzelSelectionTool,
      icon: 'cursor',
    },
    {
      name: 'brush',
      type: 'tool',
      tool: KritzelBrushTool,
      icon: 'pen',
      isDefault: true,
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
    { label: 'Bring to Front', icon: 'bring-to-front', action: () => this.engineRef.bringToFront() },
    { label: 'Send to Back', icon: 'send-to-back', action: () => this.engineRef.sendToBack() },
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

  @State()
  isWorkspaceManagerReady: boolean = false;

  @State()
  workspaces: KritzelWorkspace[] = [];

  @State()
  activeWorkspace: KritzelWorkspace;

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

  engineRef!: HTMLKritzelEngineElement;

  controlsRef!: HTMLKritzelControlsElement;

  splitButtonRef!: HTMLKritzelSplitButtonElement;

  componentDidLoad() {
    this.registerCustomSvgIcons();
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

  @State()
  childMenuAnchor: HTMLElement = null;

  @State()
  menuItems: KritzelMenuItemNew[] = [
    {
      id: 'test-2',
      label: 'Test 2',
      select: item => this.handleItemSelect(item.id),
      save: item => this.handleItemUpdate(item, { isEditing: false }),
      cancel: item => this.handleItemUpdate(item, { ...item.unchangedState, isEditing: false, unchangedState: null }),
      toggleChildMenu: (item, childMenuAnchor) => {
        const isChildMenuOpen = !item.isChildMenuOpen;
        if (!isChildMenuOpen) {
          childMenuAnchor = null;
        }
        this.handleItemUpdate(item, { isChildMenuOpen: !item.isChildMenuOpen, childMenuAnchor });
      },
      closeChildMenu: item => {
        this.handleItemUpdate(item, { isChildMenuOpen: false, childMenuAnchor: null });
      },
      isChildMenuOpen: false,
      isSelectable: false,
      children: [
        {
          id: 'edit-test-2',
          label: 'Edit',
          isSelectable: false,
          select: (_item, parent) => {
            if (parent) {
              this.handleItemUpdate(parent, { isEditing: true, isChildMenuOpen: false, childMenuAnchor: null, unchangedState: { label: parent.label } });
            }
          },
        },
        {
          id: 'delete-test-2',
          label: 'Delete',
          isSelectable: false,
          select: (_item, parent) => {
            if (parent) {
              this.handleItemUpdate(parent, { isChildMenuOpen: false, childMenuAnchor: null });

              requestAnimationFrame(() => {
                this.handleItemDelete(parent);
              });

              this.childMenuAnchor = null;
            }
          },
        },
      ],
    },
    { id: 'test-1', label: 'Test 1', isSelected: true, select: item => this.handleItemSelect(item.id) },
    {
      id: 'test-3',
      label: 'Test 3',
      select: item => this.handleItemSelect(item.id),
      save: item => this.handleItemUpdate(item, { isEditing: false }),
      cancel: item => this.handleItemUpdate(item, { isEditing: false }),
      children: [
        {
          id: 'edit-test-3',
          label: 'Edit',
          isSelectable: false,
          select: (_item, parent) => {
            if (parent) {
              this.handleItemUpdate(parent, { isEditing: true });
            }
          },
        },
        { id: 'delete-test-3', label: 'Delete', isSelectable: false },
      ],
    },
    { id: 'test-4', label: 'Test 4', isDisabled: true, select: item => this.handleItemSelect(item.id) },
  ];

  private handleItemSelect(selectedItemId: string) {
    const updateSelection = (items: KritzelMenuItemNew[]): KritzelMenuItemNew[] => {
      return items.map(item => {
        const wasSelected = item.isSelected;
        const isNowSelected = item.id === selectedItemId;

        // Recursively update children first
        let newChildren: KritzelMenuItemNew[] | undefined;
        if (item.children) {
          newChildren = updateSelection(item.children);
        }

        // Determine if the item or its children have changed
        const childrenChanged = newChildren && newChildren !== item.children;
        const selectionChanged = wasSelected !== isNowSelected;

        if (!selectionChanged && !childrenChanged) {
          return item; // No change, return original item
        }

        // Create a new item with the updated state
        const newItem = { ...item, isSelected: isNowSelected };
        if (newChildren) {
          newItem.children = newChildren;
        }
        return newItem;
      });
    };

    this.menuItems = updateSelection(this.menuItems);
  }

  private handleItemAdd = () => {
    this.splitButtonRef.open();
    this.menuItems = [{ ...this.newItem }, ...this.menuItems];
  };

  private handleItemUpdate = (itemToUpdate: KritzelMenuItemNew, newProps: Partial<KritzelMenuItemNew>) => {
    const update = (items: KritzelMenuItemNew[]): KritzelMenuItemNew[] => {
      return items.map(item => {
        if (item === itemToUpdate) {
          return { ...item, ...newProps };
        }
        if (item.children) {
          return { ...item, children: update(item.children) };
        }
        return item;
      });
    };

    this.menuItems = update(this.menuItems);
  };

  private handleItemDelete = (itemToDelete: KritzelMenuItemNew) => {
    const remove = (items: KritzelMenuItemNew[]): KritzelMenuItemNew[] => {
      return items
        .map(item => {
          if (item.children) {
            return { ...item, children: remove(item.children) };
          }
          return item;
        })
        .filter(item => item.id !== itemToDelete.id);
    };

    this.menuItems = remove(this.menuItems);
  };

  private newItem: KritzelMenuItemNew = {
    id: 'new',
    label: 'New Item',
    isEditing: true,
    select: item => this.handleItemSelect(item.id),
    save: item => {
      if (item.id === 'new') {
        item.id = `item-${Date.now()}`;
      }

      this.handleItemUpdate(item, { isEditing: false });
      this.handleItemSelect(item.id);
    },
    cancel: item => this.handleItemDelete(item),
    toggleChildMenu: (item, childMenuAnchor) => {
      const isChildMenuOpen = !item.isChildMenuOpen;
      if (!isChildMenuOpen) {
        childMenuAnchor = null;
      }
      this.handleItemUpdate(item, { isChildMenuOpen: !item.isChildMenuOpen, childMenuAnchor });
    },
    closeChildMenu: item => {
      this.handleItemUpdate(item, { isChildMenuOpen: false, childMenuAnchor: null });
    },
    isChildMenuOpen: false,
    isSelectable: false,
    children: [
      {
        id: 'edit-test-2',
        label: 'Edit',
        isSelectable: false,
        select: (_item, parent) => {
          if (parent) {
            this.handleItemUpdate(parent, { isEditing: true, isChildMenuOpen: false, childMenuAnchor: null, unchangedState: { label: parent.label } });
          }
        },
      },
      {
        id: 'delete-test-2',
        label: 'Delete',
        isSelectable: false,
        select: (_item, parent) => {
          if (parent) {
            this.handleItemUpdate(parent, { isChildMenuOpen: false, childMenuAnchor: null });

            requestAnimationFrame(() => {
              this.handleItemDelete(parent);
            });

            this.childMenuAnchor = null;
          }
        },
      },
    ],
  };

  private handleMenuClose = () => {
    this.menuItems.forEach(item => {
      if (item.isEditing) {
        item.cancel(item);
      }
    });
  };

  render() {
    return (
      <Host>
        <kritzel-split-button
          ref={el => (this.splitButtonRef = el)}
          items={this.menuItems}
          onButtonClick={this.handleItemAdd}
          onClose={this.handleMenuClose}
        ></kritzel-split-button>

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
