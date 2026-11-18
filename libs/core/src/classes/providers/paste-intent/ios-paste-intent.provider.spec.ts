import { UpmadeIosPasteIntentProvider } from './ios-paste-intent.provider';
import { UpmadeDevicesHelper } from '../../../helpers/devices.helper';

jest.mock('../../../helpers/devices.helper', () => ({
  UpmadeDevicesHelper: {
    isIOS: jest.fn(),
  },
}));

describe('UpmadeIosPasteIntentProvider', () => {
  let provider: UpmadeIosPasteIntentProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new UpmadeIosPasteIntentProvider();
  });

  it('handles iOS eventless paste context', () => {
    (UpmadeDevicesHelper.isIOS as jest.Mock).mockReturnValue(true);

    const canHandle = provider.canHandle({ core: {} as any });

    expect(canHandle).toBe(true);
  });

  it('does not handle when a native clipboard event is present', () => {
    (UpmadeDevicesHelper.isIOS as jest.Mock).mockReturnValue(true);

    const canHandle = provider.canHandle({
      core: {} as any,
      event: { clipboardData: {} } as any,
    });

    expect(canHandle).toBe(false);
  });

  it('returns the in-memory session payload when available', async () => {
    const payload = { version: 1, objects: [{ id: 'x', __class__: 'UpmadeShape' }] };
    const core = { clipboardManager: { sessionClipboardPayload: payload } } as any;

    const intent = await provider.getPasteIntent({ core });

    expect(intent).toEqual({ type: 'upmade_objects', payload });
  });

  it('returns unknown when the session buffer is empty', async () => {
    const core = { clipboardManager: { sessionClipboardPayload: null } } as any;

    const intent = await provider.getPasteIntent({ core });

    expect(intent).toEqual({ type: 'unknown' });
  });
});