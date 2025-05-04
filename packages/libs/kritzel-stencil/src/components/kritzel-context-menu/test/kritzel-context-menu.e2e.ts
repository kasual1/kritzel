import { newE2EPage } from '@stencil/core/testing';

describe('kritzel-context-menu', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<kritzel-context-menu></kritzel-context-menu>');

    const element = await page.find('kritzel-context-menu');
    expect(element).toHaveClass('hydrated');
  });
});
