import { newSpecPage } from '@stencil/core/testing';
import { KritzelFont } from '../kritzel-font';

describe('kritzel-font', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [KritzelFont],
      html: `<kritzel-font></kritzel-font>`,
    });
    expect(page.root).toEqualHtml(`
      <kritzel-font>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </kritzel-font>
    `);
  });
});
