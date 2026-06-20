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
    Object.defineProperty(navigator, 'permissions', {
      value: {
        query: jest.fn().mockResolvedValue({ state: 'granted' }),
      },
      configurable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        readText: jest.fn().mockResolvedValue(''),
      },
      configurable: true,
    });

    await expect(manager.requestPermission('clipboard-read')).resolves.toBe('granted');
    expect(navigator.clipboard.readText).toHaveBeenCalledTimes(1);
  });

  it('allows custom request handlers for future permissions', async () => {
    manager.registerRequestPermissionHandler('notifications', async () => 'granted' as const);

    await expect(manager.requestPermission('notifications')).resolves.toBe('granted');
  });
});