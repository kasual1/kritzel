import { newE2EPage } from '@stencil/core/testing';

describe('kritzel-utility-panel', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<kritzel-utility-panel></kritzel-utility-panel>');

    const element = await page.find('kritzel-utility-panel');
    expect(element).toHaveClass('hydrated');
  });
});
