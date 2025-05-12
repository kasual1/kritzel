import { newE2EPage } from '@stencil/core/testing';

describe('kritzel-controls', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<kritzel-controls></kritzel-controls>');

    const element = await page.find('kritzel-controls');
    expect(element).toHaveClass('hydrated');
  });
});
