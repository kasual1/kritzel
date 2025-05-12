import { newE2EPage } from '@stencil/core/testing';

describe('kritzel-brush-style', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<kritzel-brush-style></kritzel-brush-style>');

    const element = await page.find('kritzel-brush-style');
    expect(element).toHaveClass('hydrated');
  });
});
