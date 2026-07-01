import { KritzelCore } from '../classes/core/core.class';
import { PasteIntent } from '../classes/managers/clipboard.types';

export interface KritzelPasteIntentProviderContext {
  core: KritzelCore;
  event?: ClipboardEvent;
}

export interface KritzelPasteIntentProvider {
  canHandle(context: KritzelPasteIntentProviderContext): boolean;
  getPasteIntent(context: KritzelPasteIntentProviderContext): Promise<PasteIntent>;
}
