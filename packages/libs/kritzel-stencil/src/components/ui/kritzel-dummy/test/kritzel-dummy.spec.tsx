import { newSpecPage } from '@stencil/core/testing';
import { KritzelDummy } from '../kritzel-dummy';

describe('kritzel-dummy', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [KritzelDummy],
      html: `<kritzel-dummy></kritzel-dummy>`,
    });
    expect(page.root).toEqualHtml(`
      <kritzel-dummy>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </kritzel-dummy>
    `);
  });
});
