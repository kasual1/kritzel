import { newE2EPage } from '@stencil/core/testing';

describe('kritzel-control-brush-config', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<kritzel-control-brush-config></kritzel-control-brush-config>');

    const element = await page.find('kritzel-control-brush-config');
    expect(element).toHaveClass('hydrated');
  });
});
