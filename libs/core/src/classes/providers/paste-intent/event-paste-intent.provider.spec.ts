import { UpmadeEventPasteIntentProvider } from './event-paste-intent.provider';

const payload = { version: 1, objects: [{ id: 'x', __class__: 'UpmadeShape' }] };

/** A paste event whose clipboard holds `text` as plain text. */
const pasteEvent = (text: string): ClipboardEvent =>
  ({ clipboardData: { files: [], types: ['text/plain'], getData: () => text } }) as unknown as ClipboardEvent;

describe('UpmadeEventPasteIntentProvider', () => {
  const provider = new UpmadeEventPasteIntentProvider();

  // Payloads copied by Updraw and Kritzel editors keep their prefix, so they must still paste as objects.
  it.each(['upmade', 'updraw', 'kritzel'])('reads object payloads copied under the %s name', async brand => {
    const intent = await provider.getPasteIntent({ core: {} as any, event: pasteEvent(`${brand}-clipboard/v1:${JSON.stringify(payload)}`) });

    expect(intent).toEqual({ type: 'upmade_objects', payload });
  });

  it('treats other text as plain text', async () => {
    const intent = await provider.getPasteIntent({ core: {} as any, event: pasteEvent('other-clipboard/v1:{}') });

    expect(intent).toEqual({ type: 'plain_text', text: 'other-clipboard/v1:{}' });
  });
});
