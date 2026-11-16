import { UpmadeNavigatorPasteIntentProvider } from './navigator-paste-intent.provider';

const payload = { version: 1, objects: [{ id: 'x', __class__: 'UpmadeShape' }] };

const core = {
  permissionManager: {
    checkPermission: jest.fn().mockResolvedValue('granted'),
    requestPermission: jest.fn().mockResolvedValue('granted'),
  },
} as any;

/** Puts `text` on the async clipboard, readable only through `read()` or only through `readText()`. */
const setClipboardText = (text: string, { withRead }: { withRead: boolean }): void => {
  const item = { types: ['text/plain'], getType: async () => new Blob([text], { type: 'text/plain' }) };
  Object.defineProperty(navigator, 'clipboard', {
    value: withRead ? { read: jest.fn().mockResolvedValue([item]) } : { readText: jest.fn().mockResolvedValue(text) },
    configurable: true,
  });
};

describe('UpmadeNavigatorPasteIntentProvider', () => {
  const provider = new UpmadeNavigatorPasteIntentProvider();

  // Payloads copied by Updraw and Kritzel editors keep their prefix, so they must still paste as objects.
  describe.each(['upmade', 'updraw', 'kritzel'])('object payloads copied under the %s name', brand => {
    it.each([true, false])('are read (clipboard.read available: %s)', async withRead => {
      setClipboardText(`${brand}-clipboard/v1:${JSON.stringify(payload)}`, { withRead });

      const intent = await provider.getPasteIntent({ core });

      expect(intent).toEqual({ type: 'upmade_objects', payload });
    });
  });

  it('treats other text as plain text', async () => {
    setClipboardText('hello', { withRead: false });

    expect(await provider.getPasteIntent({ core })).toEqual({ type: 'plain_text', text: 'hello' });
  });
});
