import { newSpecPage } from '@stencil/core/testing';
import { KritzelFontFamily } from '../kritzel-font-family';

describe('kritzel-font-family', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [KritzelFontFamily],
      html: `<kritzel-font-family></kritzel-font-family>`,
    });
    expect(page.root).toEqualHtml(`
      <kritzel-font-family>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </kritzel-font-family>
    `);
  });
});
