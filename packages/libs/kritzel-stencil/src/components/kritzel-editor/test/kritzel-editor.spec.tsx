import { newSpecPage } from '@stencil/core/testing';
import { KritzelEditor } from '../kritzel-editor';

describe('kritzel-editor', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [KritzelEditor],
      html: `<kritzel-editor></kritzel-editor>`,
    });
    expect(page.root).toEqualHtml(`
      <kritzel-editor>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </kritzel-editor>
    `);
  });
});
