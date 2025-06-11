import { newSpecPage } from '@stencil/core/testing';
import { KritzelTooltip } from '../kritzel-tooltip';

describe('kritzel-tooltip', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [KritzelTooltip],
      html: `<kritzel-tooltip></kritzel-tooltip>`,
    });
    expect(page.root).toEqualHtml(`
      <kritzel-tooltip>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </kritzel-tooltip>
    `);
  });
});
