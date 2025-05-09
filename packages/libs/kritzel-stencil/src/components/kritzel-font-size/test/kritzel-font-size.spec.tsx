import { newSpecPage } from '@stencil/core/testing';
import { KritzelFontSize } from '../kritzel-font-size';

describe('kritzel-font-size', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [KritzelFontSize],
      html: `<kritzel-font-size></kritzel-font-size>`,
    });
    expect(page.root).toEqualHtml(`
      <kritzel-font-size>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </kritzel-font-size>
    `);
  });
});
