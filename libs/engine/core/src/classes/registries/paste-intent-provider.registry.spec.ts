import { KritzelPasteIntentProviderRegistry } from './paste-intent-provider.registry';
import { KritzelPasteIntentProvider } from '../../interfaces/paste-intent-provider.interface';

describe('KritzelPasteIntentProviderRegistry', () => {
  const mockCore = {} as any;

  const createProvider = (
    canHandle: boolean,
    intent: ReturnType<KritzelPasteIntentProvider['getPasteIntent']>,
  ): KritzelPasteIntentProvider => ({
    canHandle: jest.fn().mockReturnValue(canHandle),
    getPasteIntent: jest.fn().mockImplementation(() => intent),
  });

  it('returns the first non-unknown intent in registration order', async () => {
    const registry = new KritzelPasteIntentProviderRegistry(mockCore);

    const first = createProvider(true, Promise.resolve({ type: 'unknown' }));
    const second = createProvider(true, Promise.resolve({ type: 'plain_text', text: 'hello' }));
    const third = createProvider(true, Promise.resolve({ type: 'plain_text', text: 'later' }));

    registry.register(first);
    registry.register(second);
    registry.register(third);

    const intent = await registry.resolve();

    expect(intent).toEqual({ type: 'plain_text', text: 'hello' });
    expect(first.getPasteIntent).toHaveBeenCalledTimes(1);
    expect(second.getPasteIntent).toHaveBeenCalledTimes(1);
    expect(third.getPasteIntent).not.toHaveBeenCalled();
  });

  it('skips providers that cannot handle the current context', async () => {
    const registry = new KritzelPasteIntentProviderRegistry(mockCore);

    const skipped = createProvider(false, Promise.resolve({ type: 'plain_text', text: 'ignored' }));
    const used = createProvider(true, Promise.resolve({ type: 'unknown' }));

    registry.register(skipped);
    registry.register(used);

    const intent = await registry.resolve();

    expect(intent).toEqual({ type: 'unknown' });
    expect(skipped.getPasteIntent).not.toHaveBeenCalled();
    expect(used.getPasteIntent).toHaveBeenCalledTimes(1);
  });
});
