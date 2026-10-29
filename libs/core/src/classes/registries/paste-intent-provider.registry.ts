import { KritzelCore } from '../core/core.class';
import { PasteIntent } from '../managers/clipboard.types';
import { KritzelPasteIntentProvider, KritzelPasteIntentProviderContext } from '../../interfaces/paste-intent-provider.interface';

export class KritzelPasteIntentProviderRegistry {
  private readonly _providers: KritzelPasteIntentProvider[] = [];

  constructor(private readonly _core: KritzelCore) {}

  register(provider: KritzelPasteIntentProvider): void {
    this._providers.push(provider);
  }

  async resolve(event?: ClipboardEvent): Promise<PasteIntent> {
    const context: KritzelPasteIntentProviderContext = {
      core: this._core,
      event,
    };

    for (const provider of this._providers) {
      if (!provider.canHandle(context)) {
        continue;
      }

      const intent = await provider.getPasteIntent(context);
      if (intent.type !== 'unknown') {
        return intent;
      }
    }

    return { type: 'unknown' };
  }
}
