import { newSpecPage } from '@stencil/core/testing';
import { KritzelColor } from '../kritzel-color';

describe('kritzel-color', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [KritzelColor],
      html: `<kritzel-color></kritzel-color>`,
    });
    expect(page.root).toEqualHtml(`
      <kritzel-color>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </kritzel-color>
    `);
  });
});
