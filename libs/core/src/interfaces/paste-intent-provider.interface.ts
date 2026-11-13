import { UpdrawCore } from '../classes/core/core.class';
import { PasteIntent } from '../classes/managers/clipboard.types';

export interface UpdrawPasteIntentProviderContext {
  core: UpdrawCore;
  event?: ClipboardEvent;
}

export interface UpdrawPasteIntentProvider {
  canHandle(context: UpdrawPasteIntentProviderContext): boolean;
  getPasteIntent(context: UpdrawPasteIntentProviderContext): Promise<PasteIntent>;
}
