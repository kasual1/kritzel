import { newSpecPage } from '@stencil/core/testing';
import { KritzelExport } from './kritzel-export';

describe('kritzel-export', () => {
  it('renders the export button in the dialog footer', async () => {
    const page = await newSpecPage({
      components: [KritzelExport],
      html: '<kritzel-export></kritzel-export>',
    });

    await page.rootInstance.open();
    await page.waitForChanges();

    const dialog = page.root?.shadowRoot?.querySelector('kritzel-dialog');
    const footer = dialog?.querySelector('[slot="footer"]');
    const button = footer?.querySelector('.export-primary-button');

    expect(button?.textContent?.trim()).toBe('Export');
    expect(page.root?.shadowRoot?.querySelector('.export-content .export-primary-button')).toBeNull();
  });
});
