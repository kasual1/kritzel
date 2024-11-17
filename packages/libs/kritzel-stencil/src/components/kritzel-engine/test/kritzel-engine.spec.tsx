import { newSpecPage } from '@stencil/core/testing';
import { KritzelEngine } from '../kritzel-engine';

describe('kritzel-engine', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [KritzelEngine],
      html: `<kritzel-engine></kritzel-engine>`,
    });
    expect(page.root).toEqualHtml(`
      <kritzel-engine>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </kritzel-engine>
    `);
  });
});
