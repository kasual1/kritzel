import { newSpecPage } from '@stencil/core/testing';
import { MyList } from '../my-list';

describe('my-list', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [MyList],
      html: `<my-list></my-list>`,
    });
    expect(page.root).toEqualHtml(`
      <my-list>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </my-list>
    `);
  });
});
