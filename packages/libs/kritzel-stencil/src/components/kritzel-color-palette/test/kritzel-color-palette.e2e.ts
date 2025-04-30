import { newE2EPage } from '@stencil/core/testing';

describe('kritzel-color-palette', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<kritzel-color-palette></kritzel-color-palette>');

    const element = await page.find('kritzel-color-palette');
    expect(element).toHaveClass('hydrated');
  });
});
