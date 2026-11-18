import { GUEST_STORAGE_KEY } from './auth-storage';
import { migrateLegacyStorageKeys } from './legacy-storage';

/** Minimal in-memory Storage, so the tests don't depend on the test environment's localStorage. */
function createStorage(entries: Record<string, string>): Storage {
  const map = new Map(Object.entries(entries));
  return {
    get length() {
      return map.size;
    },
    key: (index: number) => [...map.keys()][index] ?? null,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, String(value)),
    removeItem: (key: string) => void map.delete(key),
    clear: () => map.clear(),
  };
}

function entries(storage: Storage): Record<string, string> {
  const result: Record<string, string> = {};
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index)!;
    result[key] = storage.getItem(key)!;
  }
  return result;
}

describe('migrateLegacyStorageKeys', () => {
  const updrawGuest = JSON.stringify({ id: 'updraw-guest', displayName: 'Guest', isGuest: true });
  const kritzelGuest = JSON.stringify({ id: 'kritzel-guest', displayName: 'Guest', isGuest: true });

  it('carries the guest user over to the key the app reads', () => {
    const storage = createStorage({ updraw_guest_user: updrawGuest });

    migrateLegacyStorageKeys(storage);

    expect(GUEST_STORAGE_KEY).toBe('upmade_guest_user');
    expect(storage.getItem(GUEST_STORAGE_KEY)).toBe(updrawGuest);
    // Legacy keys are kept.
    expect(storage.getItem('updraw_guest_user')).toBe(updrawGuest);
  });

  it('prefers the Updraw value over the Kritzel one', () => {
    const storage = createStorage({
      kritzel_guest_user: kritzelGuest,
      updraw_guest_user: updrawGuest,
      kritzel_public_config: '{"assetBaseUrl":"https://old.example"}',
    });

    migrateLegacyStorageKeys(storage);

    expect(storage.getItem('upmade_guest_user')).toBe(updrawGuest);
    expect(storage.getItem('upmade_public_config')).toBe('{"assetBaseUrl":"https://old.example"}');
  });

  it('falls back to the Kritzel value and copies the Welcome markers', () => {
    const storage = createStorage({
      kritzel_guest_user: kritzelGuest,
      'kritzel_welcome_initialized:user-1': 'true',
      'updraw_welcome_initialized:user-2': 'true',
    });

    migrateLegacyStorageKeys(storage);

    expect(storage.getItem('upmade_guest_user')).toBe(kritzelGuest);
    expect(storage.getItem('upmade_welcome_initialized:user-1')).toBe('true');
    expect(storage.getItem('upmade_welcome_initialized:user-2')).toBe('true');
  });

  it('never overwrites an existing Upmade value and ignores other keys', () => {
    const current = JSON.stringify({ id: 'upmade-guest', displayName: 'Guest', isGuest: true });
    const storage = createStorage({
      upmade_guest_user: current,
      updraw_guest_user: updrawGuest,
      updraw_user: '{"id":"signed-in"}',
      'updraw-settings': '{}',
      other_key: 'x',
    });

    migrateLegacyStorageKeys(storage);

    expect(entries(storage)).toEqual({
      upmade_guest_user: current,
      updraw_guest_user: updrawGuest,
      updraw_user: '{"id":"signed-in"}',
      'updraw-settings': '{}',
      other_key: 'x',
    });
  });

  it('does not throw when storage is unavailable', () => {
    const storage = createStorage({ updraw_guest_user: updrawGuest });
    storage.setItem = () => {
      throw new Error('QuotaExceededError');
    };

    expect(() => migrateLegacyStorageKeys(storage)).not.toThrow();
  });
});
