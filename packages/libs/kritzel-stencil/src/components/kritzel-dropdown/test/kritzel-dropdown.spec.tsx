import { newSpecPage } from '@stencil/core/testing';
import { KritzelDropdown } from '../kritzel-dropdown';

describe('kritzel-dropdown', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [KritzelDropdown],
      html: `<kritzel-dropdown></kritzel-dropdown>`,
    });
    expect(page.root).toEqualHtml(`
      <kritzel-dropdown>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </kritzel-dropdown>
    `);
  });
});
