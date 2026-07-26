import { KritzelFontRegistry } from './font-registry.class';

describe('KritzelFontRegistry', () => {
  const registeredKeys: string[] = [];

  const register = (key: string, registration: string | { family: string; label?: string; cssFontFamily?: string }) => {
    KritzelFontRegistry.register(key, registration);
    if (!registeredKeys.includes(key)) {
      registeredKeys.push(key);
    }
  };

  afterEach(() => {
    jest.restoreAllMocks();

    for (const key of registeredKeys) {
      KritzelFontRegistry.unregister(key);
    }

    registeredKeys.length = 0;
  });

  it('registers and retrieves a font', () => {
    register('editor-roboto', {
      family: 'Roboto',
      label: 'Roboto',
      cssFontFamily: "'Roboto', sans-serif",
    });

    expect(KritzelFontRegistry.has('editor-roboto')).toBe(true);
    expect(KritzelFontRegistry.get('editor-roboto')).toEqual({
      key: 'editor-roboto',
      family: 'Roboto',
      label: 'Roboto',
      cssFontFamily: "'Roboto', sans-serif",
      source: undefined,
    });
  });

  it('registers multiple fonts', () => {
    KritzelFontRegistry.registerFonts({
      'editor-inter': {
        family: 'Inter',
        cssFontFamily: "'Inter', sans-serif",
      },
      'editor-lora': {
        family: 'Lora',
        cssFontFamily: "'Lora', serif",
      },
    });
    registeredKeys.push('editor-inter', 'editor-lora');

    expect(KritzelFontRegistry.has('editor-inter')).toBe(true);
    expect(KritzelFontRegistry.has('editor-lora')).toBe(true);
  });

  it('warns when overwriting an existing key', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation();

    register('editor-overwrite', 'Arial');
    KritzelFontRegistry.register('editor-overwrite', {
      family: 'Lora',
      cssFontFamily: "'Lora', serif",
    });

    expect(spy).toHaveBeenCalledWith('[FontRegistry] Font "editor-overwrite" is already registered. It will be overwritten.');
    expect(KritzelFontRegistry.get('editor-overwrite')?.family).toBe('Lora');
  });

  it('resolves css font-family by family value', () => {
    register('editor-space-grotesk', {
      family: 'Space Grotesk',
      cssFontFamily: "'Space Grotesk', sans-serif",
    });

    expect(KritzelFontRegistry.resolveCssFontFamily('Space Grotesk')).toBe("'Space Grotesk', sans-serif");
    expect(KritzelFontRegistry.resolveCssFontFamily('space grotesk')).toBe("'Space Grotesk', sans-serif");
  });

  it('resolves css font-family by key and falls back for unknown values', () => {
    register('editor-manrope', {
      family: 'Manrope',
      cssFontFamily: "'Manrope', sans-serif",
    });

    expect(KritzelFontRegistry.resolveCssFontFamily('editor-manrope')).toBe("'Manrope', sans-serif");
    expect(KritzelFontRegistry.resolveCssFontFamily('Unknown Font')).toBe('Unknown Font');
  });

  it('unregisters a font', () => {
    register('editor-remove', 'Arial');

    expect(KritzelFontRegistry.unregister('editor-remove')).toBe(true);
    expect(KritzelFontRegistry.has('editor-remove')).toBe(false);
    expect(KritzelFontRegistry.unregister('editor-remove')).toBe(false);
  });

  it('waits for registered font families to load', async () => {
    const originalFonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    const load = jest.fn().mockResolvedValue([]);
    const ready = Promise.resolve(undefined);

    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: {
        load,
        ready,
      },
    });

    try {
      await KritzelFontRegistry.waitForFonts({
        'editor-racing': {
          family: 'Racing Sans One',
          cssFontFamily: "'Racing Sans One', sans-serif",
        },
      });

      expect(load).toHaveBeenCalledWith('1em "Racing Sans One"');
    } finally {
      Object.defineProperty(document, 'fonts', {
        configurable: true,
        value: originalFonts,
      });
    }
  });
});
