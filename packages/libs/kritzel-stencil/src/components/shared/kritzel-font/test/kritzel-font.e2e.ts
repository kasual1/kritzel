import { newE2EPage } from '@stencil/core/testing';

describe('kritzel-font', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<kritzel-font></kritzel-font>');

    const element = await page.find('kritzel-font');
    expect(element).toHaveClass('hydrated');
  });
});
