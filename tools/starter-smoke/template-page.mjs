import { expect } from '@playwright/test';

export class TemplatePage {
  constructor(page, component) {
    this.page = page;
    this.component = component;
    this.host = page.locator(`kritzel-${component}`);
    this.errors = [];
    page.on('pageerror', error => this.errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') this.errors.push(message.text());
    });
  }

  async open(url) {
    await this.page.goto(url);
    await expect(this.host).toBeVisible();
    await expect(this.page.locator('html')).toHaveAttribute('data-kritzel-ready', this.component);
    const bounds = await this.host.boundingBox();
    expect(bounds?.width).toBeGreaterThan(0);
    expect(bounds?.height).toBeGreaterThan(0);
  }

  async drawStroke() {
    await expect(this.page.locator('html')).toHaveAttribute('data-active-tool', 'brush');
    const engine = this.page.locator('kritzel-engine');
    await expect.poll(() => engine.evaluate(element => element.getObjectsTotalCount())).toBe(0);
    const bounds = await engine.boundingBox();
    if (!bounds) throw new Error('The generated engine has no visible bounds.');
    await this.page.mouse.move(bounds.x + 120, bounds.y + 120);
    await this.page.mouse.down();
    await this.page.mouse.move(bounds.x + 240, bounds.y + 180, { steps: 20 });
    await this.page.mouse.up();
    await expect.poll(() => engine.evaluate(element => element.getObjectsTotalCount())).toBeGreaterThan(0);
  }

  async expectNoErrors() {
    await expect(this.page.getByRole('alert')).toHaveCount(0);
    expect(this.errors).toEqual([]);
  }

  async expectInitializationFailure(url) {
    await this.page.goto(`${url}?fail-registration=1`);
    await expect(this.page.getByRole('alert')).toContainText('could not register the selection tool');
    await expect(this.page.locator('html')).toHaveAttribute('data-kritzel-ready', 'engine');
    expect(this.errors).toEqual([]);
  }
}
