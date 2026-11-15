import { UpmadeCore } from '../classes/core/core.class';
import { PasteIntent } from '../classes/managers/clipboard.types';

export interface UpmadePasteIntentProviderContext {
  core: UpmadeCore;
  event?: ClipboardEvent;
}

export interface UpmadePasteIntentProvider {
  canHandle(context: UpmadePasteIntentProviderContext): boolean;
  getPasteIntent(context: UpmadePasteIntentProviderContext): Promise<PasteIntent>;
}
