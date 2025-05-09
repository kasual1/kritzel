import { newE2EPage } from '@stencil/core/testing';

describe('kritzel-font-size', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<kritzel-font-size></kritzel-font-size>');

    const element = await page.find('kritzel-font-size');
    expect(element).toHaveClass('hydrated');
  });
});
