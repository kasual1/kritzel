import { UpdrawIosPasteIntentProvider } from './ios-paste-intent.provider';
import { UpdrawDevicesHelper } from '../../../helpers/devices.helper';

jest.mock('../../../helpers/devices.helper', () => ({
  UpdrawDevicesHelper: {
    isIOS: jest.fn(),
  },
}));

describe('UpdrawIosPasteIntentProvider', () => {
  let provider: UpdrawIosPasteIntentProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new UpdrawIosPasteIntentProvider();
  });

  it('handles iOS eventless paste context', () => {
    (UpdrawDevicesHelper.isIOS as jest.Mock).mockReturnValue(true);

    const canHandle = provider.canHandle({ core: {} as any });

    expect(canHandle).toBe(true);
  });

  it('does not handle when a native clipboard event is present', () => {
    (UpdrawDevicesHelper.isIOS as jest.Mock).mockReturnValue(true);

    const canHandle = provider.canHandle({
      core: {} as any,
      event: { clipboardData: {} } as any,
    });

    expect(canHandle).toBe(false);
  });

  it('returns the in-memory session payload when available', async () => {
    const payload = { version: 1, objects: [{ id: 'x', __class__: 'UpdrawShape' }] };
    const core = { clipboardManager: { sessionClipboardPayload: payload } } as any;

    const intent = await provider.getPasteIntent({ core });

    expect(intent).toEqual({ type: 'updraw_objects', payload });
  });

  it('returns unknown when the session buffer is empty', async () => {
    const core = { clipboardManager: { sessionClipboardPayload: null } } as any;

    const intent = await provider.getPasteIntent({ core });

    expect(intent).toEqual({ type: 'unknown' });
  });
});