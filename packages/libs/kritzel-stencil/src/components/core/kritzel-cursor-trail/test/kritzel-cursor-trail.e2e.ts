import { newE2EPage } from '@stencil/core/testing';

describe('kritzel-cursor-trail', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<kritzel-cursor-trail></kritzel-cursor-trail>');

    const element = await page.find('kritzel-cursor-trail');
    expect(element).toHaveClass('hydrated');
  });
});
