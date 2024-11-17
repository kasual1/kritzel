import { newSpecPage } from '@stencil/core/testing';
import { KritzelControls } from '../kritzel-controls';

describe('kritzel-controls', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [KritzelControls],
      html: `<kritzel-controls></kritzel-controls>`,
    });
    expect(page.root).toEqualHtml(`
      <kritzel-controls>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </kritzel-controls>
    `);
  });
});
