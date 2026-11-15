import { UpmadeDevicesHelper } from '../../../helpers/devices.helper';
import { PasteIntent } from '../../managers/clipboard.types';
import { UpmadePasteIntentProvider, UpmadePasteIntentProviderContext } from '../../../interfaces/paste-intent-provider.interface';

export class UpmadeIosPasteIntentProvider implements UpmadePasteIntentProvider {
  canHandle(context: UpmadePasteIntentProviderContext): boolean {
    return !context.event?.clipboardData && UpmadeDevicesHelper.isIOS();
  }

  async getPasteIntent(context: UpmadePasteIntentProviderContext): Promise<PasteIntent> {
    // On iOS Safari, eventless programmatic clipboard reads are commonly unavailable
    // (e.g. the context-menu paste calls engine.paste() without a native ClipboardEvent).
    // Fall back to the in-memory session buffer so internal object copy/paste still works.
    const payload = context.core.clipboardManager.sessionClipboardPayload;
    if (payload) {
      return { type: 'upmade_objects', payload };
    }

    return { type: 'unknown' };
  }
}
