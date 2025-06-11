import { newE2EPage } from '@stencil/core/testing';

describe('kritzel-tooltip', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<kritzel-tooltip></kritzel-tooltip>');

    const element = await page.find('kritzel-tooltip');
    expect(element).toHaveClass('hydrated');
  });
});
