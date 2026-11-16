import { UpmadeFontRegistry } from './font-registry.class';

describe('UpmadeFontRegistry', () => {
  const registeredKeys: string[] = [];

  const register = (key: string, registration: string | { family: string; label?: string; cssFontFamily?: string }) => {
    UpmadeFontRegistry.register(key, registration);
    if (!registeredKeys.includes(key)) {
      registeredKeys.push(key);
    }
  };

  afterEach(() => {
    jest.restoreAllMocks();

    for (const key of registeredKeys) {
      UpmadeFontRegistry.unregister(key);
    }

    registeredKeys.length = 0;
  });

  it('registers and retrieves a font', () => {
    register('editor-roboto', {
      family: 'Roboto',
      label: 'Roboto',
      cssFontFamily: "'Roboto', sans-serif",
    });

    expect(UpmadeFontRegistry.has('editor-roboto')).toBe(true);
    expect(UpmadeFontRegistry.get('editor-roboto')).toEqual({
      key: 'editor-roboto',
      family: 'Roboto',
      label: 'Roboto',
      cssFontFamily: "'Roboto', sans-serif",
      source: undefined,
    });
  });

  it('registers multiple fonts', () => {
    UpmadeFontRegistry.registerFonts({
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

    expect(UpmadeFontRegistry.has('editor-inter')).toBe(true);
    expect(UpmadeFontRegistry.has('editor-lora')).toBe(true);
  });

  it('warns when overwriting an existing key', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation();

    register('editor-overwrite', 'Arial');
    UpmadeFontRegistry.register('editor-overwrite', {
      family: 'Lora',
      cssFontFamily: "'Lora', serif",
    });

    expect(spy).toHaveBeenCalledWith('[FontRegistry] Font "editor-overwrite" is already registered. It will be overwritten.');
    expect(UpmadeFontRegistry.get('editor-overwrite')?.family).toBe('Lora');
  });

  it('resolves css font-family by family value', () => {
    register('editor-space-grotesk', {
      family: 'Space Grotesk',
      cssFontFamily: "'Space Grotesk', sans-serif",
    });

    expect(UpmadeFontRegistry.resolveCssFontFamily('Space Grotesk')).toBe("'Space Grotesk', sans-serif");
    expect(UpmadeFontRegistry.resolveCssFontFamily('space grotesk')).toBe("'Space Grotesk', sans-serif");
  });

  it('resolves css font-family by key and falls back for unknown values', () => {
    register('editor-manrope', {
      family: 'Manrope',
      cssFontFamily: "'Manrope', sans-serif",
    });

    expect(UpmadeFontRegistry.resolveCssFontFamily('editor-manrope')).toBe("'Manrope', sans-serif");
    expect(UpmadeFontRegistry.resolveCssFontFamily('Unknown Font')).toBe('Unknown Font');
  });

  it('unregisters a font', () => {
    register('editor-remove', 'Arial');

    expect(UpmadeFontRegistry.unregister('editor-remove')).toBe(true);
    expect(UpmadeFontRegistry.has('editor-remove')).toBe(false);
    expect(UpmadeFontRegistry.unregister('editor-remove')).toBe(false);
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
      await UpmadeFontRegistry.waitForFonts({
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
