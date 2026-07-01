import { KritzelClipboardPayload, CLIPBOARD_PAYLOAD_PREFIX, PasteIntent } from '../../managers/clipboard.types';
import { KritzelPasteIntentProvider, KritzelPasteIntentProviderContext } from '../../../interfaces/paste-intent-provider.interface';

export class KritzelEventPasteIntentProvider implements KritzelPasteIntentProvider {
  canHandle(context: KritzelPasteIntentProviderContext): boolean {
    return !!context.event?.clipboardData;
  }

  async getPasteIntent(context: KritzelPasteIntentProviderContext): Promise<PasteIntent> {
    const data = context.event?.clipboardData;
    if (!data) {
      return { type: 'unknown' };
    }

    const imageFiles = Array.from(data.files ?? []).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      return { type: 'image_files', files: imageFiles };
    }

    if (data.types.includes('text/plain')) {
      const textIntent = this.determineTextPasteIntent(data.getData('text/plain'));
      if (textIntent) {
        return textIntent;
      }
    }

    return { type: 'unknown' };
  }

  private parseClipboardPayload(text: string | null | undefined): KritzelClipboardPayload | null {
    if (!text || !text.startsWith(CLIPBOARD_PAYLOAD_PREFIX)) {
      return null;
    }

    try {
      const parsed = JSON.parse(text.slice(CLIPBOARD_PAYLOAD_PREFIX.length)) as KritzelClipboardPayload;
      if (parsed?.version !== 1 || !Array.isArray(parsed.objects)) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  private determineTextPasteIntent(text: string | null | undefined): PasteIntent | null {
    const payload = this.parseClipboardPayload(text);
    if (payload) {
      return { type: 'kritzel_objects', payload };
    }

    if (text && text.trim().length > 0) {
      return { type: 'plain_text', text };
    }

    return null;
  }
}
