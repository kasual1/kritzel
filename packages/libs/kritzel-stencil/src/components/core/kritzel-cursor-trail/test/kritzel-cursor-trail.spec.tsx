import { newSpecPage } from '@stencil/core/testing';
import { KritzelCursorTrail } from '../kritzel-cursor-trail';

describe('kritzel-cursor-trail', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [KritzelCursorTrail],
      html: `<kritzel-cursor-trail></kritzel-cursor-trail>`,
    });
    expect(page.root).toEqualHtml(`
      <kritzel-cursor-trail>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </kritzel-cursor-trail>
    `);
  });
});
