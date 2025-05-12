import { newE2EPage } from '@stencil/core/testing';

describe('kritzel-dropdown', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<kritzel-dropdown></kritzel-dropdown>');

    const element = await page.find('kritzel-dropdown');
    expect(element).toHaveClass('hydrated');
  });
});
