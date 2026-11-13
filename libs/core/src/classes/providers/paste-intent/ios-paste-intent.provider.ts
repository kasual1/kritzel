import { UpdrawDevicesHelper } from '../../../helpers/devices.helper';
import { PasteIntent } from '../../managers/clipboard.types';
import { UpdrawPasteIntentProvider, UpdrawPasteIntentProviderContext } from '../../../interfaces/paste-intent-provider.interface';

export class UpdrawIosPasteIntentProvider implements UpdrawPasteIntentProvider {
  canHandle(context: UpdrawPasteIntentProviderContext): boolean {
    return !context.event?.clipboardData && UpdrawDevicesHelper.isIOS();
  }

  async getPasteIntent(context: UpdrawPasteIntentProviderContext): Promise<PasteIntent> {
    // On iOS Safari, eventless programmatic clipboard reads are commonly unavailable
    // (e.g. the context-menu paste calls engine.paste() without a native ClipboardEvent).
    // Fall back to the in-memory session buffer so internal object copy/paste still works.
    const payload = context.core.clipboardManager.sessionClipboardPayload;
    if (payload) {
      return { type: 'updraw_objects', payload };
    }

    return { type: 'unknown' };
  }
}
