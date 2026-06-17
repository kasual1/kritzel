import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { KritzelLicenseManager } from './license.manager';
import { KritzelCore } from '../core/core.class';
import { KRITZEL_LICENSE_TOKEN_PREFIX } from '../../constants/license.constants';

jest.mock('../core/core.class');

/**
 * The manager verifies real Ed25519 signatures against the public key embedded
 * in license.constants. To exercise that path we sign tokens in the test with
 * the matching master private key checked into the repo (scripts/license/keys),
 * mirroring scripts/license/token.js. This keeps the spec a true end-to-end
 * check of the verification path rather than a mock of it.
 */
const PRIVATE_KEY_PATH = path.join(__dirname, '..', '..', '..', '..', '..', 'scripts', 'license', 'keys', 'private.pem');
const privateKey = crypto.createPrivateKey(fs.readFileSync(PRIVATE_KEY_PATH, 'utf-8'));

/** Signs a claims payload into a KRTZL1 token the manager will accept. */
function signToken(payload: Record<string, unknown>): string {
  const payloadSegment = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const signature = crypto.sign(null, Buffer.from(payloadSegment, 'utf-8'), privateKey);
  return KRITZEL_LICENSE_TOKEN_PREFIX + payloadSegment + '.' + signature.toString('base64url');
}

/** A structurally valid, signed, perpetual token. */
function validToken(overrides: Record<string, unknown> = {}): string {
  return signToken({ sub: 'Acme Corp', plan: 'team', iat: Math.floor(Date.now() / 1000), ...overrides });
}

/**
 * Waits for the manager's async signature verification to settle. WebCrypto's
 * importKey/verify resolve on the macrotask queue (not just microtasks), so we
 * poll the licensed state across real timer ticks until it reaches `expected`
 * or we time out. Requires real timers to be active.
 */
async function waitForLicensed(manager: KritzelLicenseManager, expected: boolean): Promise<void> {
  for (let i = 0; i < 50; i++) {
    if (manager.isLicensed === expected) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 5));
  }
}

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

    it('should remain unlicensed for a structurally malformed key', () => {
      // No KRTZL1 prefix -> rejected by the synchronous pre-check.
      expect(manager.validate('valid-key')).toBe(false);
      expect(manager.isLicensed).toBe(false);
    });

    it('should become licensed once a validly signed token verifies', async () => {
      // Synchronously the state is still the default (unlicensed) until the
      // async signature verification settles.
      expect(manager.validate(validToken())).toBe(false);

      await waitForLicensed(manager, true);

      expect(manager.isLicensed).toBe(true);
    });

    it('should remain unlicensed for a token signed by a different key', async () => {
      // Tamper with the payload after signing so the signature no longer matches.
      const token = validToken();
      const [prefixAndPayload, signature] = [token.slice(0, token.lastIndexOf('.')), token.slice(token.lastIndexOf('.') + 1)];
      const forged = prefixAndPayload.slice(0, -1) + (prefixAndPayload.endsWith('A') ? 'B' : 'A') + '.' + signature;

      manager.validate(forged);
      // Give the async verification time to run; it must never flip to licensed.
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(manager.isLicensed).toBe(false);
    });

    it('should remain unlicensed for an expired token without running crypto', () => {
      // exp in the past -> the synchronous pre-check rejects it outright.
      expect(manager.validate(validToken({ exp: Math.floor(Date.now() / 1000) - 60 }))).toBe(false);
      expect(manager.isLicensed).toBe(false);
    });

    it('should rerender only when the licensed state changes', async () => {
      const token = validToken();

      manager.validate(token);
      await waitForLicensed(manager, true);
      expect(mockCore.rerender).toHaveBeenCalledTimes(1);

      // Same verified token -> licensed without re-running crypto, no rerender.
      manager.validate(token);
      await waitForLicensed(manager, true);
      expect(mockCore.rerender).toHaveBeenCalledTimes(1);

      // State flips back to unlicensed (synchronous rejection) -> one more rerender.
      manager.validate(undefined);
      expect(mockCore.rerender).toHaveBeenCalledTimes(2);
    });

    it('should fail open (licensed) when the internal pre-check throws an unexpected error', () => {
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

    it('should re-validate the last key on each scheduled tick', async () => {
      const token = validToken();
      manager.validate(token);
      // Let the initial verification settle and cache the verified token.
      jest.useRealTimers();
      await waitForLicensed(manager, true);
      jest.useFakeTimers();
      expect(manager.isLicensed).toBe(true);

      manager.startPeriodicValidation();

      // Force the license to flip without going through validate() so we can
      // observe the periodic tick restoring it.
      (manager as any)._isLicensed = false;

      jest.advanceTimersByTime(60_000);

      // The tick re-validates the cached verified token synchronously (no crypto
      // re-run), so the licensed state is restored immediately.
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
