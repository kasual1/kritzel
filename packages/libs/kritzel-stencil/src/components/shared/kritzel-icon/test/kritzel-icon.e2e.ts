import { newE2EPage } from '@stencil/core/testing';

describe('kritzel-icon', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<kritzel-icon></kritzel-icon>');

    const element = await page.find('kritzel-icon');
    expect(element).toHaveClass('hydrated');
  });
});
