import { newSpecPage } from '@stencil/core/testing';
import { KritzelControlTextConfig } from '../kritzel-control-text-config';

describe('kritzel-control-text-config', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [KritzelControlTextConfig],
      html: `<kritzel-control-text-config></kritzel-control-text-config>`,
    });
    expect(page.root).toEqualHtml(`
      <kritzel-control-text-config>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </kritzel-control-text-config>
    `);
  });
});
