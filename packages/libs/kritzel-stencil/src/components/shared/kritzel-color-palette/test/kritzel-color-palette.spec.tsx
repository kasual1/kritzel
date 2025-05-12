import { newSpecPage } from '@stencil/core/testing';
import { KritzelColorPalette } from '../kritzel-color-palette';

describe('kritzel-color-palette', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [KritzelColorPalette],
      html: `<kritzel-color-palette></kritzel-color-palette>`,
    });
    expect(page.root).toEqualHtml(`
      <kritzel-color-palette>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </kritzel-color-palette>
    `);
  });
});
