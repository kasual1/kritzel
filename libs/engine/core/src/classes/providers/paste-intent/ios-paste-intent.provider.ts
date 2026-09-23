import { KritzelDevicesHelper } from '../../../helpers/devices.helper';
import { PasteIntent } from '../../managers/clipboard.types';
import { KritzelPasteIntentProvider, KritzelPasteIntentProviderContext } from '../../../interfaces/paste-intent-provider.interface';

export class KritzelIosPasteIntentProvider implements KritzelPasteIntentProvider {
  canHandle(context: KritzelPasteIntentProviderContext): boolean {
    return !context.event?.clipboardData && KritzelDevicesHelper.isIOS();
  }

  async getPasteIntent(context: KritzelPasteIntentProviderContext): Promise<PasteIntent> {
    // On iOS Safari, eventless programmatic clipboard reads are commonly unavailable
    // (e.g. the context-menu paste calls engine.paste() without a native ClipboardEvent).
    // Fall back to the in-memory session buffer so internal object copy/paste still works.
    const payload = context.core.clipboardManager.sessionClipboardPayload;
    if (payload) {
      return { type: 'kritzel_objects', payload };
    }

    return { type: 'unknown' };
  }
}
