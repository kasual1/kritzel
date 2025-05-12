import { newE2EPage } from '@stencil/core/testing';

describe('kritzel-stroke-size', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<kritzel-stroke-size></kritzel-stroke-size>');

    const element = await page.find('kritzel-stroke-size');
    expect(element).toHaveClass('hydrated');
  });
});
