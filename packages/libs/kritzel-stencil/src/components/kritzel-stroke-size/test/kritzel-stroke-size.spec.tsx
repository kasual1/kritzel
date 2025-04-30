import { newSpecPage } from '@stencil/core/testing';
import { KritzelStrokeSize } from '../kritzel-stroke-size';

describe('kritzel-stroke-size', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [KritzelStrokeSize],
      html: `<kritzel-stroke-size></kritzel-stroke-size>`,
    });
    expect(page.root).toEqualHtml(`
      <kritzel-stroke-size>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </kritzel-stroke-size>
    `);
  });
});
