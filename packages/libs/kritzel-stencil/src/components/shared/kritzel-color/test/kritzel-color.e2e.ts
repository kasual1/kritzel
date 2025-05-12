import { newE2EPage } from '@stencil/core/testing';

describe('kritzel-color', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<kritzel-color></kritzel-color>');

    const element = await page.find('kritzel-color');
    expect(element).toHaveClass('hydrated');
  });
});
