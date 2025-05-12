import { newSpecPage } from '@stencil/core/testing';
import { KritzelIcon } from '../kritzel-icon';

describe('kritzel-icon', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [KritzelIcon],
      html: `<kritzel-icon></kritzel-icon>`,
    });
    expect(page.root).toEqualHtml(`
      <kritzel-icon>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </kritzel-icon>
    `);
  });
});
