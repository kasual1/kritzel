import { newE2EPage, E2EPage } from '@stencil/core/testing';

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

describe('kritzel-editor screenshot tests', () => {
  describe('tool selection', () => {
    let page: E2EPage;

    beforeEach(async () => {
      page = await newE2EPage();
      await page.setContent(HTML_TEMPLATE);
      await page.waitForChanges();
    });

    it('should match screenshot with selection tool active', async () => {
      const screenshot = await page.compareScreenshot('selection tool active');
      expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
    });

    it('should match screenshot with brush tool selected', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const buttons = await controls.findAll('pierce/.kritzel-control');

      await buttons[1].click();
      await page.waitForChanges();

      const screenshot = await page.compareScreenshot('brush tool selected');
      expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
    });

    it('should match screenshot with line tool selected', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const buttons = await controls.findAll('pierce/.kritzel-control');

      await buttons[2].click();
      await page.waitForChanges();

      const screenshot = await page.compareScreenshot('line tool selected');
      expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
    });

    it('should match screenshot with eraser tool selected', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const buttons = await controls.findAll('pierce/.kritzel-control');

      await buttons[3].click();
      await page.waitForChanges();

      const screenshot = await page.compareScreenshot('eraser tool selected');
      expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
    });

    it('should match screenshot with text tool selected', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const buttons = await controls.findAll('pierce/.kritzel-control');

      await buttons[4].click();
      await page.waitForChanges();

      const screenshot = await page.compareScreenshot('text tool selected');
      expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
    });

    it('should match screenshot with shape tool selected', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const splitButton = await controls.find('pierce/.kritzel-control-split');
      const mainButton = await splitButton.find('.kritzel-control-main');

      await mainButton.click();
      await page.waitForChanges();

      const screenshot = await page.compareScreenshot('shape tool selected');
      expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
    });

    it('should match screenshot with image tool selected', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const buttons = await controls.findAll('pierce/.kritzel-control');

      await buttons[buttons.length - 1].click();
      await page.waitForChanges();

      const screenshot = await page.compareScreenshot('image tool selected');
      expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
    });
  });

  describe('shape tool sub-options', () => {
    let page: E2EPage;

    beforeEach(async () => {
      page = await newE2EPage();
      await page.setContent(HTML_TEMPLATE);
      await page.waitForChanges();

      // Select shape tool first
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const splitButton = await controls.find('pierce/.kritzel-control-split');
      const mainButton = await splitButton.find('.kritzel-control-main');
      await mainButton.click();
      await page.waitForChanges();
    });

    it('should match screenshot with rectangle shape selected (default)', async () => {
      const screenshot = await page.compareScreenshot('shape rectangle selected');
      expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
    });

    it('should match screenshot with circle shape selected', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const splitButton = await controls.find('pierce/.kritzel-control-split');

      // Open dropdown
      const dropdownTrigger = await splitButton.find('.kritzel-control-dropdown');
      await dropdownTrigger.click();
      await page.waitForChanges();

      // Select circle (second option)
      const subMenuItems = await controls.findAll('pierce/.kritzel-submenu-item');
      await subMenuItems[1].click();
      await page.waitForChanges();

      const screenshot = await page.compareScreenshot('shape circle selected');
      expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
    });

    it('should match screenshot with triangle shape selected', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const splitButton = await controls.find('pierce/.kritzel-control-split');

      // Open dropdown
      const dropdownTrigger = await splitButton.find('.kritzel-control-dropdown');
      await dropdownTrigger.click();
      await page.waitForChanges();

      // Select triangle (third option)
      const subMenuItems = await controls.findAll('pierce/.kritzel-submenu-item');
      await subMenuItems[2].click();
      await page.waitForChanges();

      const screenshot = await page.compareScreenshot('shape triangle selected');
      expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
    });

    it('should match screenshot switching from circle back to rectangle', async () => {
      const controls = await page.find('kritzel-editor >>> kritzel-controls');
      const splitButton = await controls.find('pierce/.kritzel-control-split');

      // Open dropdown and select circle
      let dropdownTrigger = await splitButton.find('.kritzel-control-dropdown');
      await dropdownTrigger.click();
      await page.waitForChanges();

      let subMenuItems = await controls.findAll('pierce/.kritzel-submenu-item');
      await subMenuItems[1].click();
      await page.waitForChanges();

      // Open dropdown again and select rectangle
      dropdownTrigger = await splitButton.find('.kritzel-control-dropdown');
      await dropdownTrigger.click();
      await page.waitForChanges();

      subMenuItems = await controls.findAll('pierce/.kritzel-submenu-item');
      await subMenuItems[0].click();
      await page.waitForChanges();

      const screenshot = await page.compareScreenshot('shape switched back to rectangle');
      expect(screenshot).toMatchScreenshot({ allowableMismatchedPixels: 100 });
    });
  });
});