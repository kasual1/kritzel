import { newSpecPage } from '@stencil/core/testing';
import { MyTitle } from '../my-title';

describe('my-title', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [MyTitle],
      html: `<my-title></my-title>`,
    });
    expect(page.root).toEqualHtml(`
      <my-title>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </my-title>
    `);
  });
});
