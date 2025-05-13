import { newSpecPage } from '@stencil/core/testing';
import { KritzelUtilityPanel } from '../kritzel-utility-panel';

describe('kritzel-utility-panel', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [KritzelUtilityPanel],
      html: `<kritzel-utility-panel></kritzel-utility-panel>`,
    });
    expect(page.root).toEqualHtml(`
      <kritzel-utility-panel>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </kritzel-utility-panel>
    `);
  });
});
