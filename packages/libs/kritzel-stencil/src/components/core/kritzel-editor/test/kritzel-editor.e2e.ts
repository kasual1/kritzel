import { newE2EPage } from '@stencil/core/testing';

describe('kritzel-editor', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<kritzel-editor></kritzel-editor>');

    const element = await page.find('kritzel-editor');
    expect(element).toHaveClass('hydrated');
  });
});
