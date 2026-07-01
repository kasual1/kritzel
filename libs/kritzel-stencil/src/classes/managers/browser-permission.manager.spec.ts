import { KritzelBrowserPermissionManager } from './browser-permission.manager';

describe('KritzelBrowserPermissionManager', () => {
  let manager: KritzelBrowserPermissionManager;

  beforeEach(() => {
    manager = new KritzelBrowserPermissionManager({} as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Object.defineProperty(navigator, 'permissions', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  });

  it('checks permission state through the Permissions API', async () => {
    Object.defineProperty(navigator, 'permissions', {
      value: {
        query: jest.fn().mockResolvedValue({ state: 'granted' }),
      },
      configurable: true,
    });

    await expect(manager.checkPermission('clipboard-read')).resolves.toBe('granted');
  });

  it('requests clipboard-read permission through the built-in handler', async () => {
    const query = jest.fn().mockResolvedValue({ state: 'prompt' });
    Object.defineProperty(navigator, 'permissions', {
      value: { query },
      configurable: true,
    });
    const readText = jest.fn();
    Object.defineProperty(navigator, 'clipboard', {
      value: { readText },
      configurable: true,
    });

    // A non-denied state resolves to granted without eagerly reading the
    // clipboard, so the actual paste read is the one that triggers the prompt.
    await expect(manager.requestPermission('clipboard-read')).resolves.toBe('granted');
    expect(query).toHaveBeenCalledWith({ name: 'clipboard-read' });
    expect(readText).not.toHaveBeenCalled();
  });

  it('resolves clipboard-read to denied when the Permissions API reports denied', async () => {
    Object.defineProperty(navigator, 'permissions', {
      value: {
        query: jest.fn().mockResolvedValue({ state: 'denied' }),
      },
      configurable: true,
    });

    await expect(manager.requestPermission('clipboard-read')).resolves.toBe('denied');
  });

  it('allows custom request handlers for future permissions', async () => {
    manager.registerRequestPermissionHandler('notifications', async () => 'granted' as const);

    await expect(manager.requestPermission('notifications')).resolves.toBe('granted');
  });
});