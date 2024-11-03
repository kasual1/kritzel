import { newE2EPage } from '@stencil/core/testing';

describe('my-list', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<my-list></my-list>');

    const element = await page.find('my-list');
    expect(element).toHaveClass('hydrated');
  });
});
