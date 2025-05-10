import { newSpecPage } from '@stencil/core/testing';
import { KritzelBrushStyle } from '../kritzel-brush-style';

describe('kritzel-brush-style', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [KritzelBrushStyle],
      html: `<kritzel-brush-style></kritzel-brush-style>`,
    });
    expect(page.root).toEqualHtml(`
      <kritzel-brush-style>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </kritzel-brush-style>
    `);
  });
});
