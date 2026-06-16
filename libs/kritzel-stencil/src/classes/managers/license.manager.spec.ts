import { KritzelLicenseManager } from './license.manager';
import { KritzelCore } from '../core/core.class';

jest.mock('../core/core.class');

describe('KritzelLicenseManager', () => {
  let manager: KritzelLicenseManager;
  let mockCore: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCore = {
      rerender: jest.fn(),
    } as unknown as jest.Mocked<KritzelCore>;

    manager = new KritzelLicenseManager(mockCore);
  });

  afterEach(() => {
    manager.destroy();
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should be unlicensed before any validation', () => {
      expect(manager.isLicensed).toBe(false);
    });
  });

  describe('validate', () => {
    it('should remain unlicensed when no key is provided', () => {
      expect(manager.validate(undefined)).toBe(false);
      expect(manager.isLicensed).toBe(false);
    });

    it('should remain unlicensed for an empty or whitespace-only key', () => {
      expect(manager.validate('')).toBe(false);
      expect(manager.validate('   ')).toBe(false);
      expect(manager.isLicensed).toBe(false);
    });

    it('should become licensed for a non-empty key', () => {
      expect(manager.validate('valid-key')).toBe(true);
      expect(manager.isLicensed).toBe(true);
    });

    it('should rerender only when the licensed state changes', () => {
      manager.validate('valid-key');
      expect(mockCore.rerender).toHaveBeenCalledTimes(1);

      // Same outcome -> no additional rerender.
      manager.validate('another-valid-key');
      expect(mockCore.rerender).toHaveBeenCalledTimes(1);

      // State flips back to unlicensed -> one more rerender.
      manager.validate(undefined);
      expect(mockCore.rerender).toHaveBeenCalledTimes(2);
    });

    it('should fail open (licensed) when the internal check throws an unexpected error', () => {
      const explodingKey = {
        trim() {
          throw new Error('boom');
        },
      } as unknown as string;

      expect(manager.validate(explodingKey)).toBe(true);
      expect(manager.isLicensed).toBe(true);
    });
  });

  describe('periodic validation', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should re-validate the last key on each scheduled tick', () => {
      manager.validate('valid-key');
      manager.startPeriodicValidation();

      // Force the license to flip without going through validate() so we can
      // observe the periodic tick restoring it.
      (manager as any)._isLicensed = false;

      jest.advanceTimersByTime(60_000);

      expect(manager.isLicensed).toBe(true);
    });

    it('should schedule ticks within the 30s-60s window', () => {
      const timeoutSpy = jest.spyOn(global, 'setTimeout');

      manager.startPeriodicValidation();

      const delay = timeoutSpy.mock.calls[0][1] as number;
      expect(delay).toBeGreaterThanOrEqual(30_000);
      expect(delay).toBeLessThanOrEqual(60_000);

      timeoutSpy.mockRestore();
    });

    it('should reschedule itself after each tick', () => {
      const timeoutSpy = jest.spyOn(global, 'setTimeout');

      manager.startPeriodicValidation();
      expect(timeoutSpy).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(60_000);
      expect(timeoutSpy).toHaveBeenCalledTimes(2);

      timeoutSpy.mockRestore();
    });

    it('should be idempotent and not leak timers when started twice', () => {
      const clearSpy = jest.spyOn(global, 'clearTimeout');

      manager.startPeriodicValidation();
      manager.startPeriodicValidation();

      expect(clearSpy).toHaveBeenCalledTimes(1);

      clearSpy.mockRestore();
    });
  });

  describe('stopPeriodicValidation / destroy', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should stop scheduling further ticks once stopped', () => {
      const timeoutSpy = jest.spyOn(global, 'setTimeout');

      manager.startPeriodicValidation();
      manager.stopPeriodicValidation();

      jest.advanceTimersByTime(120_000);

      // Only the initial schedule occurred; no reschedules after stopping.
      expect(timeoutSpy).toHaveBeenCalledTimes(1);

      timeoutSpy.mockRestore();
    });

    it('destroy should stop periodic validation', () => {
      const timeoutSpy = jest.spyOn(global, 'setTimeout');

      manager.startPeriodicValidation();
      manager.destroy();

      jest.advanceTimersByTime(120_000);

      expect(timeoutSpy).toHaveBeenCalledTimes(1);

      timeoutSpy.mockRestore();
    });
  });
});
