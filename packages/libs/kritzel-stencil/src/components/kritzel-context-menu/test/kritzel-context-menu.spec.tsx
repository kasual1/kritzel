import { newSpecPage } from '@stencil/core/testing';
import { KritzelContextMenu } from '../kritzel-context-menu';

describe('kritzel-context-menu', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [KritzelContextMenu],
      html: `<kritzel-context-menu></kritzel-context-menu>`,
    });
    expect(page.root).toEqualHtml(`
      <kritzel-context-menu>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </kritzel-context-menu>
    `);
  });
});
