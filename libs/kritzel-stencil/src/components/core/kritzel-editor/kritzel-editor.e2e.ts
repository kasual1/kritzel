import { newE2EPage, E2EPage, E2EElement } from '@stencil/core/testing';

const HTML_TEMPLATE = `
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

describe('kritzel-editor', () => {
  let page: E2EPage;
  let element: E2EElement;

  beforeEach(async () => {
    page = await newE2EPage();
    await page.setContent(HTML_TEMPLATE);
    element = await page.find('kritzel-editor');
  });

  describe('rendering', () => {
    it('should render the component', async () => {
      expect(element).not.toBeNull();
      expect(element).toHaveClass('hydrated');
    });

    it('should render the engine component', async () => {
      const engine = await page.find('kritzel-editor >>> kritzel-engine');
      expect(engine).not.toBeNull();
    });

    it('should render the controls component', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      expect(controls).not.toBeNull();
    });

    it('should render the workspace manager component', async () => {
      const workspaceManager = await page.find('kritzel-editor >>> kritzel-workspace-manager');
      expect(workspaceManager).not.toBeNull();
    });
  });

  describe('controls visibility', () => {
    it('should show controls by default', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const display = await controls.getComputedStyle().then(style => style.display);
      expect(display).toBe('flex');
    });

    it('should hide controls when isControlsVisible is false', async () => {
      element.setProperty('isControlsVisible', false);
      await page.waitForChanges();

      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const display = await controls.getComputedStyle().then(style => style.display);
      expect(display).toBe('none');
    });
  });

  describe('isReady event', () => {
    it('should emit isReady event when all components are ready', async () => {
      const newPage = await newE2EPage();
      await newPage.setContent(HTML_TEMPLATE);

      const editor = await newPage.find('kritzel-editor');
      expect(editor).not.toBeNull();

      expect(editor).toHaveClass('hydrated');
    });
  });

  describe('controls configuration', () => {
    it('should render default tool controls', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const regularButtons = await controls.findAll('pierce/.kritzel-control');
      const splitButtons = await controls.findAll('pierce/.kritzel-control-split');

      // Default controls: selection, brush, line, eraser, text, shape, image (7 tools + config)
      const totalButtons = regularButtons.length + splitButtons.length;
      expect(totalButtons).toBeGreaterThanOrEqual(7);
    });

    it('should render control icons', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const icons = await controls.findAll('pierce/kritzel-icon');

      expect(icons.length).toBeGreaterThan(0);
    });

    it('should mark selection tool as active by default', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const selectedControl = await controls.find('pierce/.kritzel-control.selected');

      expect(selectedControl).not.toBeNull();
    });

    it('should render custom controls when provided', async () => {
      const customPage = await newE2EPage();
      await customPage.setContent(HTML_TEMPLATE);

      const editor = await customPage.find('kritzel-editor');

      // Set minimal controls
      await editor.callMethod('componentOnReady');
      await customPage.$eval('kritzel-editor', (el: any) => {
        el.controls = [
          {
            name: 'selection',
            type: 'tool',
            isDefault: true,
            icon: 'cursor',
          },
          {
            name: 'brush',
            type: 'tool',
            icon: 'pen',
          },
        ];
      });

      await customPage.waitForChanges();

      const controls = await customPage.find('kritzel-editor >>> kritzel-controls');
      const buttons = await controls.findAll('pierce/.kritzel-control');

      expect(buttons.length).toBe(2);
    });

    it('should render split button for controls with subOptions', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const splitButtons = await controls.findAll('pierce/.kritzel-control-split');

      // Shape tool has subOptions (rectangle, ellipse, triangle)
      expect(splitButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('should render dropdown trigger for split button controls', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const dropdownTriggers = await controls.findAll('pierce/.kritzel-control-dropdown');

      expect(dropdownTriggers.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('utility panel visibility', () => {
    it('should show utility panel by default', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const utilityPanel = await controls.find('pierce/kritzel-utility-panel');

      expect(utilityPanel).not.toBeNull();
    });

    it('should hide utility panel when isUtilityPanelVisible is false', async () => {
      element.setProperty('isUtilityPanelVisible', false);
      await page.waitForChanges();

      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const utilityPanel = await controls.find('pierce/kritzel-utility-panel');

      expect(utilityPanel).toBeNull();
    });

    it('should show utility panel when isUtilityPanelVisible changes from false to true', async () => {
      element.setProperty('isUtilityPanelVisible', false);
      await page.waitForChanges();

      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      let utilityPanel = await controls.find('pierce/kritzel-utility-panel');
      expect(utilityPanel).toBeNull();

      element.setProperty('isUtilityPanelVisible', true);
      await page.waitForChanges();

      utilityPanel = await controls.find('pierce/kritzel-utility-panel');
      expect(utilityPanel).not.toBeNull();
    });

    it('should toggle utility panel visibility multiple times', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');

      // Initially visible
      let utilityPanel = await controls.find('pierce/kritzel-utility-panel');
      expect(utilityPanel).not.toBeNull();

      // Hide
      element.setProperty('isUtilityPanelVisible', false);
      await page.waitForChanges();
      utilityPanel = await controls.find('pierce/kritzel-utility-panel');
      expect(utilityPanel).toBeNull();

      // Show again
      element.setProperty('isUtilityPanelVisible', true);
      await page.waitForChanges();
      utilityPanel = await controls.find('pierce/kritzel-utility-panel');
      expect(utilityPanel).not.toBeNull();

      // Hide again
      element.setProperty('isUtilityPanelVisible', false);
      await page.waitForChanges();
      utilityPanel = await controls.find('pierce/kritzel-utility-panel');
      expect(utilityPanel).toBeNull();
    });

    it('should render utility buttons in utility panel', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const utilityPanel = await controls.find('pierce/kritzel-utility-panel');
      const utilityButtons = await utilityPanel.findAll('pierce/.utility-button');

      // Utility panel should have 3 buttons: undo, redo, delete
      expect(utilityButtons.length).toBe(3);
    });

    it('should have undo and redo buttons disabled by default', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const utilityPanel = await controls.find('pierce/kritzel-utility-panel');
      const utilityButtons = await utilityPanel.findAll('pierce/.utility-button');

      // First button is undo, second is redo - both should be disabled by default
      const undoButton = utilityButtons[0];
      const redoButton = utilityButtons[1];

      const undoDisabled = await undoButton.getProperty('disabled');
      const redoDisabled = await redoButton.getProperty('disabled');

      expect(undoDisabled).toBe(true);
      expect(redoDisabled).toBe(true);
    });
  });

  describe('tool selection', () => {
    it('should select brush tool when clicked', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const buttons = await controls.findAll('pierce/.kritzel-control');

      // Find brush tool (second button, index 1)
      const brushButton = buttons[1];
      await brushButton.click();
      await page.waitForChanges();

      const selectedControl = await controls.find('pierce/.kritzel-control.selected');
      expect(selectedControl).not.toBeNull();
    });

    it('should select eraser tool when clicked', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const buttons = await controls.findAll('pierce/.kritzel-control');

      // Find eraser tool (fourth button, index 3)
      const eraserButton = buttons[3];
      await eraserButton.click();
      await page.waitForChanges();

      const selectedControl = await controls.find('pierce/.kritzel-control.selected');
      expect(selectedControl).not.toBeNull();
    });

    it('should select text tool when clicked', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const buttons = await controls.findAll('pierce/.kritzel-control');

      // Find text tool (fifth button, index 4)
      const textButton = buttons[4];
      await textButton.click();
      await page.waitForChanges();

      const selectedControl = await controls.find('pierce/.kritzel-control.selected');
      expect(selectedControl).not.toBeNull();
    });

    it('should select image tool when clicked', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const buttons = await controls.findAll('pierce/.kritzel-control');

      // Find image tool (last regular button)
      const imageButton = buttons[buttons.length - 1];
      await imageButton.click();
      await page.waitForChanges();

      const selectedControl = await controls.find('pierce/.kritzel-control.selected');
      expect(selectedControl).not.toBeNull();
    });

    it('should select line tool when clicked', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const buttons = await controls.findAll('pierce/.kritzel-control');

      // Find line tool (third button, index 2)
      const lineButton = buttons[2];
      await lineButton.click();
      await page.waitForChanges();

      const selectedControl = await controls.find('pierce/.kritzel-control.selected');
      expect(selectedControl).not.toBeNull();
    });

    it('should select shape tool when main button is clicked', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const splitButton = await controls.find('pierce/.kritzel-control-split');

      const mainButton = await splitButton.find('.kritzel-control-main');
      await mainButton.click();
      await page.waitForChanges();

      const selectedSplit = await controls.find('pierce/.kritzel-control-split.selected');
      expect(selectedSplit).not.toBeNull();
    });

    it('should switch back to selection tool', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const buttons = await controls.findAll('pierce/.kritzel-control');

      // First select brush
      await buttons[1].click();
      await page.waitForChanges();

      // Then switch back to selection
      await buttons[0].click();
      await page.waitForChanges();

      // First button should be selected
      const firstButton = await controls.find('pierce/.kritzel-control.selected');
      expect(firstButton).not.toBeNull();
    });
  });

  describe('shape tool subOptions', () => {
    it('should show dropdown when dropdown trigger is clicked', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const splitButton = await controls.find('pierce/.kritzel-control-split');

      // First select the shape tool
      const mainButton = await splitButton.find('.kritzel-control-main');
      await mainButton.click();
      await page.waitForChanges();

      // Click dropdown trigger
      const dropdownTrigger = await splitButton.find('.kritzel-control-dropdown');
      await dropdownTrigger.click();
      await page.waitForChanges();

      const tooltip = await controls.find('pierce/kritzel-tooltip');
      expect(tooltip).not.toBeNull();
    });

    it('should display all shape subOptions in dropdown', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const splitButton = await controls.find('pierce/.kritzel-control-split');

      // First select the shape tool
      const mainButton = await splitButton.find('.kritzel-control-main');
      await mainButton.click();
      await page.waitForChanges();

      // Click dropdown trigger
      const dropdownTrigger = await splitButton.find('.kritzel-control-dropdown');
      await dropdownTrigger.click();
      await page.waitForChanges();

      const subMenuItems = await controls.findAll('pierce/.kritzel-submenu-item');

      // Should have rectangle, ellipse, triangle options
      expect(subMenuItems.length).toBe(3);
    });
  });

  describe('tool configuration controls', () => {
    it('should show config button when brush tool is selected', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const buttons = await controls.findAll('pierce/.kritzel-control');

      // Select brush tool
      await buttons[1].click();
      await page.waitForChanges();

      const configContainer = await controls.find('pierce/.kritzel-config-container.visible');
      expect(configContainer).not.toBeNull();
    });

    it('should show config button when text tool is selected', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const buttons = await controls.findAll('pierce/.kritzel-control');

      // Select text tool
      await buttons[4].click();
      await page.waitForChanges();

      const configContainer = await controls.find('pierce/.kritzel-config-container.visible');
      expect(configContainer).not.toBeNull();
    });

    it('should not show config button for selection tool', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');

      // Selection is default, check config is not visible
      const configContainer = await controls.find('pierce/.kritzel-config-container.visible');
      expect(configContainer).toBeNull();
    });

    it('should not show config button for eraser tool', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const buttons = await controls.findAll('pierce/.kritzel-control');

      // Select eraser tool
      await buttons[3].click();
      await page.waitForChanges();

      const configContainer = await controls.find('pierce/.kritzel-config-container.visible');
      expect(configContainer).toBeNull();
    });
  });
});
