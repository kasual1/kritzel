import { newE2EPage } from '@stencil/core/testing';

describe('my-title', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<my-title></my-title>');

    const element = await page.find('my-title');
    expect(element).toHaveClass('hydrated');
  });
});
