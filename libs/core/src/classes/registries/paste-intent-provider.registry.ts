import { UpdrawCore } from '../core/core.class';
import { PasteIntent } from '../managers/clipboard.types';
import { UpdrawPasteIntentProvider, UpdrawPasteIntentProviderContext } from '../../interfaces/paste-intent-provider.interface';

export class UpdrawPasteIntentProviderRegistry {
  private readonly _providers: UpdrawPasteIntentProvider[] = [];

  constructor(private readonly _core: UpdrawCore) {}

  register(provider: UpdrawPasteIntentProvider): void {
    this._providers.push(provider);
  }

  async resolve(event?: ClipboardEvent): Promise<PasteIntent> {
    const context: UpdrawPasteIntentProviderContext = {
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
