import { newE2EPage, E2EPage, E2EElement } from '@stencil/core/testing';
import { KeyInput } from 'puppeteer';

const DEFAULT_HTML_TEMPLATE = `
  <style>
    html,
    body,
    #root,
    .app {
      width: 100dvw;
      height: 100dvh;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
  </style>
  <kritzel-editor></kritzel-editor>
`;

/**
 * Page Object Model component for kritzel-controls.
 * Encapsulates all interactions with the toolbar controls.
 */
export class KritzelControlsComponent {
  constructor(private page: E2EPage) {}

  /**
   * Get the kritzel-controls element
   */
  async getElement(): Promise<E2EElement> {
    return this.page.find('kritzel-editor >>> kritzel-controls');
  }

  /**
   * Get all regular tool buttons (not split buttons)
   */
  async getToolButtons(): Promise<E2EElement[]> {
    const controls = await this.getElement();
    return controls.findAll('pierce/.kritzel-control');
  }

  /**
   * Get the split button control (e.g., shape tool)
   */
  async getSplitButton(): Promise<E2EElement | null> {
    const controls = await this.getElement();
    return controls.find('pierce/.kritzel-control-split');
  }

  /**
   * Select a tool by its index in the toolbar
   * @param index - Zero-based index of the tool
   */
  async selectToolByIndex(index: number): Promise<void> {
    const buttons = await this.getToolButtons();
    await buttons[index].click();
    await this.page.waitForChanges();
  }

  /**
   * Select a tool by its name (matches aria-label or title)
   * @param name - The tool name to select
   */
  async selectToolByName(name: string): Promise<void> {
    const controls = await this.getElement();
    const button = await controls.find(`pierce/.kritzel-control[title="${name}"]`);
    if (button) {
      await button.click();
      await this.page.waitForChanges();
    }
  }

  /**
   * Select a split button tool (main button click)
   */
  async selectSplitButtonTool(): Promise<void> {
    const splitButton = await this.getSplitButton();
    if (splitButton) {
      const mainButton = await splitButton.find('.kritzel-control-main');
      await mainButton.click();
      await this.page.waitForChanges();
    }
  }

  /**
   * Open the split button dropdown menu
   */
  async openSplitButtonDropdown(): Promise<void> {
    const splitButton = await this.getSplitButton();
    if (splitButton) {
      const dropdownTrigger = await splitButton.find('.kritzel-control-dropdown');
      await dropdownTrigger.click();
      await this.page.waitForChanges();
    }
  }

  /**
   * Get all sub-menu items from an open split button dropdown
   */
  async getSubMenuItems(): Promise<E2EElement[]> {
    const controls = await this.getElement();
    return controls.findAll('pierce/.kritzel-submenu-item');
  }

  /**
   * Select a sub-option from the split button dropdown by index
   * @param index - Zero-based index of the sub-option
   */
  async selectSubOptionByIndex(index: number): Promise<void> {
    const subMenuItems = await this.getSubMenuItems();
    await subMenuItems[index].click();
    await this.page.waitForChanges();
  }

  /**
   * Check if a tool is currently selected by index
   * @param index - Zero-based index of the tool
   */
  async isToolSelected(index: number): Promise<boolean> {
    const buttons = await this.getToolButtons();
    const button = buttons[index];
    const classes = await button.getAttribute('class');
    return classes?.includes('selected') ?? false;
  }

  /**
   * Check if the split button tool is selected
   */
  async isSplitButtonSelected(): Promise<boolean> {
    const splitButton = await this.getSplitButton();
    if (!splitButton) return false;
    const classes = await splitButton.getAttribute('class');
    return classes?.includes('selected') ?? false;
  }

  /**
   * Get the config container element
   */
  async getConfigContainer(): Promise<E2EElement | null> {
    const controls = await this.getElement();
    return controls.find('pierce/.kritzel-config-container');
  }

  /**
   * Check if the config container is visible
   */
  async isConfigVisible(): Promise<boolean> {
    const configContainer = await this.getConfigContainer();
    if (!configContainer) return false;
    const classes = await configContainer.getAttribute('class');
    return classes?.includes('visible') ?? false;
  }

  /**
   * Click on the config trigger to open the tool config tooltip
   */
  async openToolConfig(): Promise<void> {
    const controls = await this.getElement();
    const configTrigger = await controls.find('pierce/.kritzel-config');
    if (configTrigger) {
      await configTrigger.click();
      await this.page.waitForChanges();
    }
  }

  /**
   * Get the utility panel element
   */
  async getUtilityPanel(): Promise<E2EElement | null> {
    const controls = await this.getElement();
    return controls.find('pierce/kritzel-utility-panel');
  }

  /**
   * Click the undo button in the utility panel
   */
  async undo(): Promise<void> {
    const utilityPanel = await this.getUtilityPanel();
    if (utilityPanel) {
      const undoButton = await utilityPanel.find('pierce/button[title="Undo"]');
      if (undoButton) {
        await undoButton.click();
        await this.page.waitForChanges();
      }
    }
  }

  /**
   * Click the redo button in the utility panel
   */
  async redo(): Promise<void> {
    const utilityPanel = await this.getUtilityPanel();
    if (utilityPanel) {
      const redoButton = await utilityPanel.find('pierce/button[title="Redo"]');
      if (redoButton) {
        await redoButton.click();
        await this.page.waitForChanges();
      }
    }
  }

  /**
   * Click the delete button in the utility panel
   */
  async delete(): Promise<void> {
    const utilityPanel = await this.getUtilityPanel();
    if (utilityPanel) {
      const deleteButton = await utilityPanel.find('pierce/button[title="Delete"]');
      if (deleteButton) {
        await deleteButton.click();
        await this.page.waitForChanges();
      }
    }
  }
}

/**
 * Page Object Model component for kritzel-workspace-manager.
 * Encapsulates all interactions with the workspace manager.
 */
/**
 * Page Object Model component for kritzel-workspace-manager.
 * Encapsulates all interactions with the workspace manager.
 */
export class KritzelWorkspaceManagerComponent {
  constructor(private page: E2EPage) {}

  /**
   * Get the kritzel-workspace-manager element
   */
  async getElement(): Promise<E2EElement> {
    return this.page.find('kritzel-editor >>> kritzel-workspace-manager');
  }

  /**
   * Get the split button element
   */
  async getSplitButton(): Promise<E2EElement | null> {
    const workspaceManager = await this.getElement();
    return workspaceManager.find('pierce/kritzel-split-button');
  }

  /**
   * Get the portal element containing the menu (rendered on document.body)
   */
  async getPortal(): Promise<E2EElement | null> {
    return this.page.find('[id^="portal-"]');
  }

  /**
   * Get the menu element from the portal
   */
  async getMenu(): Promise<E2EElement | null> {
    const portal = await this.getPortal();
    if (!portal) return null;
    return portal.find('pierce/kritzel-menu');
  }

  /**
   * Click the add workspace button (main button of split button)
   */
  async clickAddWorkspace(): Promise<void> {
    const workspaceManager = await this.getElement();
    const mainButton = await workspaceManager.find('pierce/.split-main-button');
    if (mainButton) {
      await mainButton.click();
      await this.page.waitForChanges();
    }
  }

  /**
   * Open the workspace dropdown menu
   */
  async openWorkspaceMenu(): Promise<void> {
    const workspaceManager = await this.getElement();
    const menuButton = await workspaceManager.find('pierce/.split-menu-button');
    if (menuButton) {
      await menuButton.click();
      await this.page.waitForChanges();
    }
  }

  /**
   * Close the workspace dropdown menu
   */
  async closeWorkspaceMenu(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.page.waitForChanges();
  }

  /**
   * Get all workspace menu items from the portal
   */
  async getWorkspaceMenuItems(): Promise<E2EElement[]> {
    const portal = await this.getPortal();
    if (!portal) return [];
    return portal.findAll('pierce/kritzel-menu-item');
  }

  /**
   * Select a workspace by its index in the menu
   * @param index - Zero-based index of the workspace
   */
  async selectWorkspaceByIndex(index: number): Promise<void> {
    const items = await this.getWorkspaceMenuItems();
    if (items[index]) {
      await items[index].click();
      await this.page.waitForChanges();
    }
  }

  /**
   * Get the menu item text button for a workspace at index
   * @param index - Zero-based index of the workspace
   */
  async getWorkspaceTextButton(index: number): Promise<E2EElement | null> {
    const portal = await this.getPortal();
    if (!portal) return null;
    const textButtons = await portal.findAll('pierce/.menu-item-text-button');
    return textButtons[index] ?? null;
  }

  /**
   * Open the child menu (rename/delete options) for a workspace at index
   * @param index - Zero-based index of the workspace
   */
  async openWorkspaceChildMenu(index: number): Promise<void> {
    const portal = await this.getPortal();
    if (!portal) return;
    // The child menu toggle button has id="child-menu-toggle"
    const childMenuButtons = await portal.findAll('pierce/#child-menu-toggle');
    if (childMenuButtons[index]) {
      await childMenuButtons[index].click();
      await this.page.waitForChanges();
    }
  }

  /**
   * Click rename option for a workspace (child menu must be open)
   */
  async clickRename(): Promise<void> {
    // Child menu is in a nested portal
    const portals = await this.page.findAll('[id^="portal-"]');
    // Get the last portal (nested child menu portal)
    const childPortal = portals[portals.length - 1];
    if (!childPortal) return;

    const menuItems = await childPortal.findAll('pierce/kritzel-menu-item');
    for (const item of menuItems) {
      const text = await item.getProperty('textContent');
      if (text?.includes('Rename')) {
        await item.click();
        await this.page.waitForChanges();
        return;
      }
    }
  }

  /**
   * Click delete option for a workspace (child menu must be open)
   */
  async clickDelete(): Promise<void> {
    // Child menu is in a nested portal
    const portals = await this.page.findAll('[id^="portal-"]');
    // Get the last portal (nested child menu portal)
    const childPortal = portals[portals.length - 1];
    if (!childPortal) return;

    const menuItems = await childPortal.findAll('pierce/kritzel-menu-item');
    for (const item of menuItems) {
      const text = await item.getProperty('textContent');
      if (text?.includes('Delete')) {
        await item.click();
        await this.page.waitForChanges();
        return;
      }
    }
  }

  /**
   * Get the input field when editing a workspace name
   */
  async getEditInput(): Promise<E2EElement | null> {
    const portal = await this.getPortal();
    if (!portal) return null;
    // Find the editing menu item first
    const editingItem = await portal.find('pierce/kritzel-menu-item.editing');
    if (!editingItem) return null;
    return editingItem.find('pierce/input.edit-input');
  }

  /**
   * Type a new workspace name in the edit input
   * The input text is automatically selected when entering edit mode,
   * so typing will replace the existing text.
   * @param name - The new workspace name
   */
  async typeWorkspaceName(name: string): Promise<void> {
    const input = await this.getEditInput();
    if (input) {
      // Clear existing text first by selecting all with triple-click then typing
      await input.click({ clickCount: 3 });
      await input.type(name);
      await this.page.waitForChanges();
    }
  }

  /**
   * Save the workspace name edit (click the check icon button)
   */
  async saveWorkspaceName(): Promise<void> {
    const portal = await this.getPortal();
    if (!portal) return;
    // Find the editing menu item and get its action buttons inside
    // The menu item in edit mode has .editing class
    const editingItem = await portal.find('pierce/kritzel-menu-item.editing');
    if (!editingItem) return;

    // Find action buttons within the editing item
    // Save button is the second one (after cancel)
    const actionButtons = await editingItem.findAll('pierce/.action-button');
    // Save is the last action button (check icon)
    const saveButton = actionButtons[actionButtons.length - 1];
    if (saveButton) {
      await saveButton.click();
      await this.page.waitForChanges();
    }
  }

  /**
   * Cancel the workspace name edit (click the x icon button)
   */
  async cancelWorkspaceEdit(): Promise<void> {
    const portal = await this.getPortal();
    if (!portal) return;
    // Find the editing menu item
    const editingItem = await portal.find('pierce/kritzel-menu-item.editing');
    if (!editingItem) return;

    // Cancel button is the first action button (x icon)
    const actionButtons = await editingItem.findAll('pierce/.action-button');
    const cancelButton = actionButtons[0];
    if (cancelButton) {
      await cancelButton.click();
      await this.page.waitForChanges();
    }
  }

  /**
   * Check if the workspace menu is currently open
   */
  async isMenuOpen(): Promise<boolean> {
    const portal = await this.getPortal();
    return portal !== null;
  }

  /**
   * Get the count of workspaces in the menu
   */
  async getWorkspaceCount(): Promise<number> {
    const items = await this.getWorkspaceMenuItems();
    return items.length;
  }

  /**
   * Check if a workspace is selected by index
   * @param index - Zero-based index of the workspace
   */
  async isWorkspaceSelected(index: number): Promise<boolean> {
    const items = await this.getWorkspaceMenuItems();
    if (!items[index]) return false;
    const classes = await items[index].getAttribute('class');
    return classes?.includes('selected') ?? false;
  }
}

/**
 * Page Object Model component for kritzel-more-menu.
 * Encapsulates all interactions with the more menu dropdown.
 */
export class KritzelMoreMenuComponent {
  constructor(private page: E2EPage) {}

  /**
   * Get the kritzel-more-menu element
   */
  async getElement(): Promise<E2EElement> {
    return this.page.find('kritzel-editor >>> kritzel-more-menu');
  }

  /**
   * Get the more menu trigger button
   */
  async getMenuButton(): Promise<E2EElement | null> {
    const moreMenu = await this.getElement();
    return moreMenu.find('pierce/.more-menu-button');
  }

  /**
   * Open the more menu dropdown
   */
  async open(): Promise<void> {
    const button = await this.getMenuButton();
    if (button) {
      await button.click();
      await this.page.waitForChanges();
    }
  }

  /**
   * Close the more menu dropdown
   */
  async close(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.page.waitForChanges();
  }

  /**
   * Check if the menu is currently open
   */
  async isOpen(): Promise<boolean> {
    const moreMenu = await this.getElement();
    const menu = await moreMenu.find('pierce/kritzel-menu');
    return menu !== null;
  }

  /**
   * Get all menu items
   */
  async getMenuItems(): Promise<E2EElement[]> {
    const moreMenu = await this.getElement();
    return moreMenu.findAll('pierce/kritzel-menu-item');
  }

  /**
   * Click a menu item by its index
   * @param index - Zero-based index of the menu item
   */
  async clickMenuItemByIndex(index: number): Promise<void> {
    const items = await this.getMenuItems();
    if (items[index]) {
      await items[index].click();
      await this.page.waitForChanges();
    }
  }

  /**
   * Click the Export menu item
   */
  async clickExport(): Promise<void> {
    const moreMenu = await this.getElement();
    const items = await moreMenu.findAll('pierce/kritzel-menu-item');
    for (const item of items) {
      const text = await item.getProperty('textContent');
      if (text?.includes('Export')) {
        await item.click();
        await this.page.waitForChanges();
        return;
      }
    }
  }

  /**
   * Click the Settings menu item
   */
  async clickSettings(): Promise<void> {
    const moreMenu = await this.getElement();
    const items = await moreMenu.findAll('pierce/kritzel-menu-item');
    for (const item of items) {
      const text = await item.getProperty('textContent');
      if (text?.includes('Settings')) {
        await item.click();
        await this.page.waitForChanges();
        return;
      }
    }
  }

  /**
   * Get the menu item count
   */
  async getMenuItemCount(): Promise<number> {
    const items = await this.getMenuItems();
    return items.length;
  }
}

/** Default viewport dimensions for E2E tests */
const DEFAULT_VIEWPORT = { width: 800, height: 600 };

/**
 * Options for creating a KritzelEditorPage
 */
export interface KritzelEditorPageOptions {
  /** Custom HTML template */
  htmlTemplate?: string;
  /** Viewport dimensions */
  viewport?: { width: number; height: number };
}

/**
 * Page Object Model for the kritzel-editor component.
 * Provides a high-level API for interacting with the editor in e2e tests.
 */
export class KritzelEditorPage {
  private _page: E2EPage;

  /** Controls toolbar component */
  readonly controls: KritzelControlsComponent;

  /** Workspace manager component */
  readonly workspaceManager: KritzelWorkspaceManagerComponent;

  /** More menu dropdown component */
  readonly moreMenu: KritzelMoreMenuComponent;

  private constructor(page: E2EPage) {
    this._page = page;
    this.controls = new KritzelControlsComponent(page);
    this.workspaceManager = new KritzelWorkspaceManagerComponent(page);
    this.moreMenu = new KritzelMoreMenuComponent(page);
  }

  /**
   * Create and initialize a new KritzelEditorPage
   * @param options - Optional configuration (htmlTemplate, viewport)
   */
  static async create(options: KritzelEditorPageOptions = {}): Promise<KritzelEditorPage> {
    const { htmlTemplate = DEFAULT_HTML_TEMPLATE, viewport = DEFAULT_VIEWPORT } = options;
    const page = await newE2EPage();
    await page.setViewport(viewport);
    await page.setContent(htmlTemplate);
    await page.waitForChanges();
    return new KritzelEditorPage(page);
  }

  /**
   * Get the underlying E2EPage instance for advanced operations
   */
  get page(): E2EPage {
    return this._page;
  }

  /**
   * Get the kritzel-editor element
   */
  async getEditorElement(): Promise<E2EElement> {
    return this._page.find('kritzel-editor');
  }

  /**
   * Get the kritzel-engine element
   */
  async getEngineElement(): Promise<E2EElement> {
    return this._page.find('kritzel-editor >>> kritzel-engine');
  }

  /**
   * Wait for changes to be applied
   */
  async waitForChanges(): Promise<void> {
    await this._page.waitForChanges();
  }

  /**
   * Set the viewport dimensions
   * @param width - Viewport width in pixels
   * @param height - Viewport height in pixels
   */
  async setViewport(width: number, height: number): Promise<void> {
    await this._page.setViewport({ width, height });
    await this._page.waitForChanges();
  }

  /**
   * Wait for the editor component to be ready
   */
  async waitForEditorReady(): Promise<void> {
    const editor = await this.getEditorElement();
    await editor.callMethod('componentOnReady');
    await this._page.waitForChanges();
  }

  /**
   * Take a screenshot and compare against baseline
   * @param description - Description for the screenshot
   */
  async compareScreenshot(description: string) {
    return this._page.compareScreenshot(description);
  }

  /**
   * Press a keyboard key
   * @param key - The key to press
   */
  async pressKey(key: KeyInput): Promise<void> {
    await this._page.keyboard.press(key);
    await this._page.waitForChanges();
  }

  /**
   * Type text using the keyboard
   * @param text - The text to type
   */
  async typeText(text: string): Promise<void> {
    await this._page.keyboard.type(text);
    await this._page.waitForChanges();
  }

  // ----- Engine interactions -----

  /**
   * Get the back-to-content button element
   */
  async getBackToContentButton(): Promise<E2EElement | null> {
    return this._page.find('kritzel-editor >>> kritzel-back-to-content');
  }

  /**
   * Check if the back-to-content button is visible
   */
  async isBackToContentVisible(): Promise<boolean> {
    const button = await this.getBackToContentButton();
    if (!button) return false;
    const visible = await button.getProperty('visible');
    return visible === true;
  }

  /**
   * Click the back-to-content button
   */
  async clickBackToContent(): Promise<void> {
    const button = await this.getBackToContentButton();
    if (button) {
      await button.click();
      await this._page.waitForChanges();
    }
  }

  // ----- Settings dialog interactions -----

  /**
   * Get the settings dialog element
   */
  async getSettingsElement(): Promise<E2EElement | null> {
    return this._page.find('kritzel-editor >>> kritzel-settings');
  }

  /**
   * Open the settings dialog
   */
  async openSettings(): Promise<void> {
    await this.moreMenu.open();
    await this.moreMenu.clickSettings();
  }

  // ----- Export dialog interactions -----

  /**
   * Get the export dialog element
   */
  async getExportElement(): Promise<E2EElement | null> {
    return this._page.find('kritzel-editor >>> kritzel-export');
  }

  /**
   * Open the export dialog
   */
  async openExport(): Promise<void> {
    await this.moreMenu.open();
    await this.moreMenu.clickExport();
  }

  // ----- Editor property setters -----

  /**
   * Set the editor controls configuration
   * @param controls - Array of control configurations
   */
  async setControls(controls: unknown[]): Promise<void> {
    await this._page.$eval(
      'kritzel-editor',
      (el: HTMLElement & { controls: unknown[] }, ctrl) => {
        el.controls = ctrl;
      },
      controls
    );
    await this._page.waitForChanges();
  }

  /**
   * Set the controls visibility
   * @param visible - Whether controls should be visible
   */
  async setControlsVisible(visible: boolean): Promise<void> {
    await this._page.$eval(
      'kritzel-editor',
      (el: HTMLElement & { isControlsVisible: boolean }, v) => {
        el.isControlsVisible = v;
      },
      visible
    );
    await this._page.waitForChanges();
  }

  /**
   * Set the utility panel visibility
   * @param visible - Whether utility panel should be visible
   */
  async setUtilityPanelVisible(visible: boolean): Promise<void> {
    await this._page.$eval(
      'kritzel-editor',
      (el: HTMLElement & { isUtilityPanelVisible: boolean }, v) => {
        el.isUtilityPanelVisible = v;
      },
      visible
    );
    await this._page.waitForChanges();
  }

  // ----- Canvas interactions -----

  /**
   * Get the canvas bounding box coordinates
   */
  private async getCanvasRect(): Promise<{ x: number; y: number } | null> {
    const rect = await this._page.$eval('kritzel-editor', (editor: Element) => {
      const engine = editor.querySelector('kritzel-engine');
      if (!engine?.shadowRoot) return null;
      const canvas = engine.shadowRoot.querySelector('canvas');
      if (!canvas) return null;
      const r = canvas.getBoundingClientRect();
      return { x: r.x, y: r.y };
    }) as { x: number; y: number } | null;
    return rect;
  }

  /**
   * Click on the canvas at a specific position
   * @param x - X coordinate relative to canvas top-left
   * @param y - Y coordinate relative to canvas top-left
   */
  async clickCanvas(x: number, y: number): Promise<void> {
    const rect = await this.getCanvasRect();
    if (rect) {
      await this._page.mouse.click(rect.x + x, rect.y + y);
      await this._page.waitForChanges();
    }
  }

  /**
   * Drag on the canvas from one point to another
   * @param startX - Start X coordinate relative to canvas top-left
   * @param startY - Start Y coordinate relative to canvas top-left
   * @param endX - End X coordinate relative to canvas top-left
   * @param endY - End Y coordinate relative to canvas top-left
   */
  async dragOnCanvas(startX: number, startY: number, endX: number, endY: number): Promise<void> {
    const rect = await this.getCanvasRect();
    if (rect) {
      await this._page.mouse.move(rect.x + startX, rect.y + startY);
      await this._page.mouse.down();
      await this._page.mouse.move(rect.x + endX, rect.y + endY);
      await this._page.mouse.up();
      await this._page.waitForChanges();
    }
  }

  /**
   * Right-click on the canvas to open context menu
   * @param x - X coordinate relative to canvas top-left
   * @param y - Y coordinate relative to canvas top-left
   */
  async rightClickCanvas(x: number, y: number): Promise<void> {
    const rect = await this.getCanvasRect();
    if (rect) {
      await this._page.mouse.click(rect.x + x, rect.y + y, { button: 'right' });
      await this._page.waitForChanges();
    }
  }
}
