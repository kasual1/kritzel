import { KritzelCore } from '../core/core.class';

type BrowserPermissionHandler = () => Promise<PermissionState> | PermissionState;

/**
 * Manages browser permission checks and prompts for a core instance.
 *
 * Permission-specific prompt logic is routed through a handler registry so new
 * permissions can be added without changing the core control flow.
 */
export class KritzelBrowserPermissionManager {
  private readonly _isFirefox = /firefox|fxios/i.test(navigator.userAgent);
  private readonly _isSafari = /safari/i.test(navigator.userAgent) && !/chrome|chromium|crios|android|edg/i.test(navigator.userAgent);
  private readonly _requestHandlers = new Map<string, BrowserPermissionHandler>();

  /**
   * Creates a new KritzelBrowserPermissionManager instance.
   * @param core - The KritzelCore instance this manager belongs to
   */
  constructor(_core: KritzelCore) {
    this.registerRequestPermissionHandler('clipboard-read', async () => {
      // Firefox and Safari open native paste menus when the clipboard is read
      // proactively, so rely on the permission state instead of an eager read.
      if (this._isFirefox || this._isSafari) {
        return 'granted';
      }

      try {
        const status = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName });
        return status.state === 'denied' ? 'denied' : 'granted';
      } catch {
        return 'granted';
      }
    });
  }

  /**
   * Registers a custom request handler for a browser permission name.
   * Existing handlers are replaced, which makes the registry easy to extend.
   *
   * @param permissionName - The browser permission name to handle
   * @param handler - The request implementation for that permission
   */
  registerRequestPermissionHandler(permissionName: string, handler: BrowserPermissionHandler): void {
    this._requestHandlers.set(permissionName, handler);
  }

  /**
   * Checks the current state for a browser permission via the Permissions API.
   *
   * @param permissionName - The browser permission name to inspect
   */
  async checkPermission(permissionName: string): Promise<PermissionState> {
    const status = await navigator.permissions.query({ name: permissionName as PermissionName });
    return status.state;
  }

  /**
   * Requests a browser permission using the registered handler for the given
   * permission name, then falls back to a permission check when no handler is
   * registered.
   *
   * @param permissionName - The browser permission name to request
   */
  async requestPermission(permissionName: string): Promise<PermissionState> {
    const handler = this._requestHandlers.get(permissionName);
    if (handler) {
      return handler();
    }

    return this.checkPermission(permissionName);
  }
}