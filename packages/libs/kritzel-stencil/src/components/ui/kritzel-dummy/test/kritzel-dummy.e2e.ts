import { newE2EPage } from '@stencil/core/testing';

describe('kritzel-dummy', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<kritzel-dummy></kritzel-dummy>');

    const element = await page.find('kritzel-dummy');
    expect(element).toHaveClass('hydrated');
  });
});
