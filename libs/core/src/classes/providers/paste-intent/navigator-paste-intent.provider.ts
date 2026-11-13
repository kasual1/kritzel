import { UpdrawClipboardPayload, getClipboardPayloadJson, PasteIntent } from '../../managers/clipboard.types';
import { UpdrawPasteIntentProvider, UpdrawPasteIntentProviderContext } from '../../../interfaces/paste-intent-provider.interface';

type BrowserClipboardItems = ClipboardItem[];

export class UpdrawNavigatorPasteIntentProvider implements UpdrawPasteIntentProvider {
  canHandle(context: UpdrawPasteIntentProviderContext): boolean {
    return !context.event?.clipboardData && typeof navigator !== 'undefined' && !!navigator.clipboard;
  }

  async getPasteIntent(context: UpdrawPasteIntentProviderContext): Promise<PasteIntent> {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return { type: 'unknown' };
    }

    const { clipboard } = navigator;

    const permissionState = await context.core.permissionManager.checkPermission('clipboard-read');
    if (permissionState !== 'granted') {
      const requestedState = await context.core.permissionManager.requestPermission('clipboard-read');
      if (requestedState !== 'granted') {
        return { type: 'unknown' };
      }
    }

    if (clipboard.read) {
      try {
        const items = await clipboard.read();
        const { imageFiles, text } = await this.processClipboardItems(items);

        if (imageFiles.length > 0) {
          return { type: 'image_files', files: imageFiles };
        }

        if (text !== null) {
          const textIntent = this.determineTextPasteIntent(text);
          if (textIntent) {
            return textIntent;
          }
        }
      } catch {
        // Fall back to readText below when read() is denied or unavailable at runtime.
      }
    }

    if (clipboard.readText) {
      const textIntent = this.determineTextPasteIntent(await clipboard.readText());
      if (textIntent) {
        return textIntent;
      }
    }

    return { type: 'unknown' };
  }

  private async processClipboardItems(items: BrowserClipboardItems): Promise<{ imageFiles: File[]; text: string | null }> {
    const imageFiles: File[] = [];
    let text: string | null = null;

    await Promise.all(
      items.map(async item => {
        const imageType = item.types.find(type => type.startsWith('image/'));

        if (imageType) {
          const blob = await item.getType(imageType);
          imageFiles.push(new File([blob], 'pasted-image', { type: imageType }));
          return;
        }

        if (text === null && item.types.includes('text/plain')) {
          const blob = await item.getType('text/plain');
          text = await blob.text();
        }
      }),
    );

    return { imageFiles, text };
  }

  private parseClipboardPayload(text: string | null | undefined): UpdrawClipboardPayload | null {
    const json = getClipboardPayloadJson(text);
    if (json === null) {
      return null;
    }

    try {
      const parsed = JSON.parse(json) as UpdrawClipboardPayload;
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
      return { type: 'updraw_objects', payload };
    }

    if (text && text.trim().length > 0) {
      return { type: 'plain_text', text };
    }

    return null;
  }
}
