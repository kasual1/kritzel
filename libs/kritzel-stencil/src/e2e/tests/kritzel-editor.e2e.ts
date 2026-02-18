import { KritzelEditorPage } from '../pages/editor.page';

describe('kritzel-editor', () => {
  describe('controls', () => {
    describe('tool selection', () => {
      let editor: KritzelEditorPage;

      beforeEach(async () => {
        editor = await KritzelEditorPage.create();
      });

      it('should match screenshot with selection tool active', async () => {
        const screenshot = await editor.compareScreenshot('selection tool active');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });

      it('should match screenshot with brush tool selected', async () => {
        await editor.controls.selectToolByIndex(1);

        const screenshot = await editor.compareScreenshot('brush tool selected');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });

      it('should match screenshot with line tool selected', async () => {
        await editor.controls.selectToolByIndex(2);

        const screenshot = await editor.compareScreenshot('line tool selected');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });

      it('should match screenshot with eraser tool selected', async () => {
        await editor.controls.selectToolByIndex(3);

        const screenshot = await editor.compareScreenshot('eraser tool selected');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });

      it('should match screenshot with text tool selected', async () => {
        await editor.controls.selectToolByIndex(4);

        const screenshot = await editor.compareScreenshot('text tool selected');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });

      it('should match screenshot with shape tool selected', async () => {
        await editor.controls.selectSplitButtonTool();

        const screenshot = await editor.compareScreenshot('shape tool selected');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });

      it('should match screenshot with image tool selected', async () => {
        const buttons = await editor.controls.getToolButtons();
        await editor.controls.selectToolByIndex(buttons.length - 1);

        const screenshot = await editor.compareScreenshot('image tool selected');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });
    });

    describe('shape tool sub-options', () => {
      let editor: KritzelEditorPage;

      beforeEach(async () => {
        editor = await KritzelEditorPage.create();
        await editor.controls.selectSplitButtonTool();
      });

      it('should match screenshot with rectangle shape selected (default)', async () => {
        const screenshot = await editor.compareScreenshot('shape rectangle selected');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });

      it('should match screenshot with circle shape selected', async () => {
        await editor.controls.openSplitButtonDropdown();
        await editor.controls.selectSubOptionByIndex(1);

        const screenshot = await editor.compareScreenshot('shape circle selected');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });

      it('should match screenshot with triangle shape selected', async () => {
        await editor.controls.openSplitButtonDropdown();
        await editor.controls.selectSubOptionByIndex(2);

        const screenshot = await editor.compareScreenshot('shape triangle selected');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });

      it('should match screenshot switching from circle back to rectangle', async () => {
        // Select circle
        await editor.controls.openSplitButtonDropdown();
        await editor.controls.selectSubOptionByIndex(1);

        // Switch back to rectangle
        await editor.controls.openSplitButtonDropdown();
        await editor.controls.selectSubOptionByIndex(0);

        const screenshot = await editor.compareScreenshot('shape switched back to rectangle');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });
    });

    describe('toolbar configuration', () => {
      it('should match screenshot with only selection tool configured', async () => {
        const editor = await KritzelEditorPage.create();
        await editor.waitForEditorReady();

        await editor.setControls([
          { name: 'selection', type: 'tool', isDefault: true, icon: 'cursor' },
        ]);

        const screenshot = await editor.compareScreenshot('toolbar with selection only');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });

      it('should match screenshot with selection and brush tools configured', async () => {
        const editor = await KritzelEditorPage.create();
        await editor.waitForEditorReady();

        await editor.setControls([
          { name: 'selection', type: 'tool', isDefault: true, icon: 'cursor' },
          { name: 'brush', type: 'tool', icon: 'pen' },
        ]);

        const screenshot = await editor.compareScreenshot('toolbar with selection and brush');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });

      it('should match screenshot with selection, brush and line tools configured', async () => {
        const editor = await KritzelEditorPage.create();
        await editor.waitForEditorReady();

        await editor.setControls([
          { name: 'selection', type: 'tool', isDefault: true, icon: 'cursor' },
          { name: 'brush', type: 'tool', icon: 'pen' },
          { name: 'line', type: 'tool', icon: 'arrow' },
        ]);

        const screenshot = await editor.compareScreenshot('toolbar with selection brush and line');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });

      it('should match screenshot with selection, brush, line and eraser tools configured', async () => {
        const editor = await KritzelEditorPage.create();
        await editor.waitForEditorReady();

        await editor.setControls([
          { name: 'selection', type: 'tool', isDefault: true, icon: 'cursor' },
          { name: 'brush', type: 'tool', icon: 'pen' },
          { name: 'line', type: 'tool', icon: 'arrow' },
          { name: 'eraser', type: 'tool', icon: 'eraser' },
        ]);

        const screenshot = await editor.compareScreenshot('toolbar with selection brush line and eraser');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });

      it('should match screenshot with selection, brush, line, eraser and text tools configured', async () => {
        const editor = await KritzelEditorPage.create();
        await editor.waitForEditorReady();

        await editor.setControls([
          { name: 'selection', type: 'tool', isDefault: true, icon: 'cursor' },
          { name: 'brush', type: 'tool', icon: 'pen' },
          { name: 'line', type: 'tool', icon: 'arrow' },
          { name: 'eraser', type: 'tool', icon: 'eraser' },
          { name: 'text', type: 'tool', icon: 'type' },
        ]);

        const screenshot = await editor.compareScreenshot('toolbar with selection brush line eraser and text');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });

      it('should match screenshot with selection, brush, line, eraser, text and shape tools configured', async () => {
        const editor = await KritzelEditorPage.create();
        await editor.waitForEditorReady();

        await editor.setControls([
          { name: 'selection', type: 'tool', isDefault: true, icon: 'cursor' },
          { name: 'brush', type: 'tool', icon: 'pen' },
          { name: 'line', type: 'tool', icon: 'arrow' },
          { name: 'eraser', type: 'tool', icon: 'eraser' },
          { name: 'text', type: 'tool', icon: 'type' },
          {
            name: 'shape',
            type: 'tool',
            icon: 'shape-rectangle',
            subOptions: [
              { name: 'rectangle', icon: 'shape-rectangle' },
              { name: 'ellipse', icon: 'shape-ellipse' },
              { name: 'triangle', icon: 'shape-triangle' },
            ],
          },
        ]);

        const screenshot = await editor.compareScreenshot('toolbar with selection brush line eraser text and shape');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });

      it('should match screenshot with all tools configured', async () => {
        const editor = await KritzelEditorPage.create();
        await editor.waitForEditorReady();

        await editor.setControls([
          { name: 'selection', type: 'tool', isDefault: true, icon: 'cursor' },
          { name: 'brush', type: 'tool', icon: 'pen' },
          { name: 'line', type: 'tool', icon: 'arrow' },
          { name: 'eraser', type: 'tool', icon: 'eraser' },
          { name: 'text', type: 'tool', icon: 'type' },
          {
            name: 'shape',
            type: 'tool',
            icon: 'shape-rectangle',
            subOptions: [
              { name: 'rectangle', icon: 'shape-rectangle' },
              { name: 'ellipse', icon: 'shape-ellipse' },
              { name: 'triangle', icon: 'shape-triangle' },
            ],
          },
          { name: 'image', type: 'tool', icon: 'image' },
        ]);

        const screenshot = await editor.compareScreenshot('toolbar with all tools configured');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });
    });
  });

  describe('workspace manager', () => {
    let editor: KritzelEditorPage;

    beforeEach(async () => {
      editor = await KritzelEditorPage.create();
    });

    describe('initial state', () => {
      it('should match screenshot with workspace manager visible', async () => {
        const screenshot = await editor.compareScreenshot('workspace manager initial state');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });
    });

    describe('workspace menu', () => {
      it('should match screenshot with workspace menu open', async () => {
        await editor.workspaceManager.openWorkspaceMenu();

        const screenshot = await editor.compareScreenshot('workspace menu open');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });

      it('should match screenshot after closing workspace menu', async () => {
        await editor.workspaceManager.openWorkspaceMenu();
        await editor.workspaceManager.closeWorkspaceMenu();

        const screenshot = await editor.compareScreenshot('workspace menu closed');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });
    });

    describe('adding workspaces', () => {
      it('should match screenshot with new workspace in edit mode', async () => {
        // Clicking add opens the menu and creates a new workspace in edit mode
        await editor.workspaceManager.clickAddWorkspace();

        const screenshot = await editor.compareScreenshot('new workspace edit mode');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });

      it('should match screenshot after saving a new workspace', async () => {
        await editor.workspaceManager.clickAddWorkspace();
        await editor.workspaceManager.typeWorkspaceName('My New Workspace');
        await editor.workspaceManager.saveWorkspaceName();

        const screenshot = await editor.compareScreenshot('workspace saved');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });

      it('should match screenshot with multiple workspaces in menu', async () => {
        // Add and save first workspace
        await editor.workspaceManager.clickAddWorkspace();
        await editor.workspaceManager.typeWorkspaceName('Workspace 1');
        await editor.workspaceManager.saveWorkspaceName();

        // Add and save second workspace
        await editor.workspaceManager.clickAddWorkspace();
        await editor.workspaceManager.typeWorkspaceName('Workspace 2');
        await editor.workspaceManager.saveWorkspaceName();

        // Open menu to show all workspaces
        await editor.workspaceManager.openWorkspaceMenu();

        const screenshot = await editor.compareScreenshot('multiple workspaces in menu');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });
    });

    describe('selecting workspaces', () => {
      it('should match screenshot after selecting a different workspace', async () => {
        // Add and save a new workspace
        await editor.workspaceManager.clickAddWorkspace();
        await editor.workspaceManager.typeWorkspaceName('Second Workspace');
        await editor.workspaceManager.saveWorkspaceName();

        // Open menu and select the first workspace (original)
        await editor.workspaceManager.openWorkspaceMenu();
        await editor.workspaceManager.selectWorkspaceByIndex(1);

        // Open menu again to show selection state
        await editor.workspaceManager.openWorkspaceMenu();

        const screenshot = await editor.compareScreenshot('workspace selected');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });
    });

    describe('workspace child menu', () => {
      it('should match screenshot with child menu open', async () => {
        await editor.workspaceManager.openWorkspaceMenu();
        await editor.workspaceManager.openWorkspaceChildMenu(0);

        const screenshot = await editor.compareScreenshot('workspace child menu open');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });
    });

    describe('renaming workspaces', () => {
      it('should match screenshot in edit mode', async () => {
        await editor.workspaceManager.openWorkspaceMenu();
        await editor.workspaceManager.openWorkspaceChildMenu(0);
        await editor.workspaceManager.clickRename();

        const screenshot = await editor.compareScreenshot('workspace rename mode');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });

      it('should match screenshot after renaming workspace', async () => {
        await editor.workspaceManager.openWorkspaceMenu();
        await editor.workspaceManager.openWorkspaceChildMenu(0);
        await editor.workspaceManager.clickRename();
        await editor.workspaceManager.typeWorkspaceName('My Custom Workspace');
        await editor.workspaceManager.saveWorkspaceName();
        await editor.workspaceManager.openWorkspaceMenu();

        const screenshot = await editor.compareScreenshot('workspace renamed');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });
    });

    describe('deleting workspaces', () => {
      it('should match screenshot after deleting a workspace', async () => {
        // Add and save first workspace
        await editor.workspaceManager.clickAddWorkspace();
        await editor.workspaceManager.typeWorkspaceName('Workspace to Keep');
        await editor.workspaceManager.saveWorkspaceName();

        // Add and save second workspace
        await editor.workspaceManager.clickAddWorkspace();
        await editor.workspaceManager.typeWorkspaceName('Workspace to Delete');
        await editor.workspaceManager.saveWorkspaceName();

        // Delete the first workspace (most recently added, shown at top)
        await editor.workspaceManager.openWorkspaceMenu();
        await editor.workspaceManager.openWorkspaceChildMenu(0);
        await editor.workspaceManager.clickDelete();

        // Open menu to show remaining workspaces
        await editor.workspaceManager.openWorkspaceMenu();

        const screenshot = await editor.compareScreenshot('workspace deleted');
        expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
      });
    });
  });
});