import { newE2EPage, E2EPage, E2EElement } from '@stencil/core/testing';

describe('kritzel-editor', () => {
  let page: E2EPage;
  let element: E2EElement;

  beforeEach(async () => {
    page = await newE2EPage();
    await page.setContent('<kritzel-editor></kritzel-editor>');
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
      await newPage.setContent('<kritzel-editor></kritzel-editor>');

      const editor = await newPage.find('kritzel-editor');
      expect(editor).not.toBeNull();

      expect(editor).toHaveClass('hydrated');
    });
  });
});
