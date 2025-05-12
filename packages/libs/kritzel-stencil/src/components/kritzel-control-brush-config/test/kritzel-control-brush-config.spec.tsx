import { newSpecPage } from '@stencil/core/testing';
import { KritzelControlBrushConfig } from '../kritzel-control-brush-config';

describe('kritzel-control-brush-config', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [KritzelControlBrushConfig],
      html: `<kritzel-control-brush-config></kritzel-control-brush-config>`,
    });
    expect(page.root).toEqualHtml(`
      <kritzel-control-brush-config>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </kritzel-control-brush-config>
    `);
  });
});
