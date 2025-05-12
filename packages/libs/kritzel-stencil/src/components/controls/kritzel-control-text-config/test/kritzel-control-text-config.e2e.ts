import { newE2EPage } from '@stencil/core/testing';

describe('kritzel-control-text-config', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<kritzel-control-text-config></kritzel-control-text-config>');

    const element = await page.find('kritzel-control-text-config');
    expect(element).toHaveClass('hydrated');
  });
});
