import { newE2EPage } from '@stencil/core/testing';

describe('kritzel-font-family', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<kritzel-font-family></kritzel-font-family>');

    const element = await page.find('kritzel-font-family');
    expect(element).toHaveClass('hydrated');
  });
});
