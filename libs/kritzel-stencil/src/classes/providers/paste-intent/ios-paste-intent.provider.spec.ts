import { KritzelIosPasteIntentProvider } from './ios-paste-intent.provider';
import { KritzelDevicesHelper } from '../../../helpers/devices.helper';

jest.mock('../../../helpers/devices.helper', () => ({
  KritzelDevicesHelper: {
    isIOS: jest.fn(),
  },
}));

describe('KritzelIosPasteIntentProvider', () => {
  let provider: KritzelIosPasteIntentProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new KritzelIosPasteIntentProvider();
  });

  it('handles iOS eventless paste context', () => {
    (KritzelDevicesHelper.isIOS as jest.Mock).mockReturnValue(true);

    const canHandle = provider.canHandle({ core: {} as any });

    expect(canHandle).toBe(true);
  });

  it('does not handle when a native clipboard event is present', () => {
    (KritzelDevicesHelper.isIOS as jest.Mock).mockReturnValue(true);

    const canHandle = provider.canHandle({
      core: {} as any,
      event: { clipboardData: {} } as any,
    });

    expect(canHandle).toBe(false);
  });

  it('returns the in-memory session payload when available', async () => {
    const payload = { version: 1, objects: [{ id: 'x', __class__: 'KritzelShape' }] };
    const core = { clipboardManager: { sessionClipboardPayload: payload } } as any;

    const intent = await provider.getPasteIntent({ core });

    expect(intent).toEqual({ type: 'kritzel_objects', payload });
  });

  it('returns unknown when the session buffer is empty', async () => {
    const core = { clipboardManager: { sessionClipboardPayload: null } } as any;

    const intent = await provider.getPasteIntent({ core });

    expect(intent).toEqual({ type: 'unknown' });
  });
});