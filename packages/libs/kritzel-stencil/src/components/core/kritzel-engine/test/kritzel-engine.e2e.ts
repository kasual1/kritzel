import { newE2EPage } from '@stencil/core/testing';

describe('kritzel-engine', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<kritzel-engine></kritzel-engine>');

    const element = await page.find('kritzel-engine');
    expect(element).toHaveClass('hydrated');
  });
});
