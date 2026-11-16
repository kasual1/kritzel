import { UpmadeCore } from '../core/core.class';
import { PasteIntent } from '../managers/clipboard.types';
import { UpmadePasteIntentProvider, UpmadePasteIntentProviderContext } from '../../interfaces/paste-intent-provider.interface';

export class UpmadePasteIntentProviderRegistry {
  private readonly _providers: UpmadePasteIntentProvider[] = [];

  constructor(private readonly _core: UpmadeCore) {}

  register(provider: UpmadePasteIntentProvider): void {
    this._providers.push(provider);
  }

  async resolve(event?: ClipboardEvent): Promise<PasteIntent> {
    const context: UpmadePasteIntentProviderContext = {
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
