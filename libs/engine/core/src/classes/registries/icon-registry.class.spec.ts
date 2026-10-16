import { KritzelIconRegistry } from './icon-registry.class';

describe('KritzelIconRegistry', () => {
  describe('shared bundle state', () => {
    it('shares registered icons and notifications between module instances', () => {
      let otherRegistry: typeof KritzelIconRegistry;
      jest.isolateModules(() => {
        otherRegistry = (require('./icon-registry.class') as typeof import('./icon-registry.class')).KritzelIconRegistry;
      });

      const listener = jest.fn();
      const unsubscribe = KritzelIconRegistry.subscribe(listener);
      try {
        expect(otherRegistry).not.toBe(KritzelIconRegistry);
        otherRegistry.register('cross-bundle-icon', '<svg/>');
        expect(KritzelIconRegistry.get('cross-bundle-icon')).toBe('<svg/>');
        expect(listener).toHaveBeenCalledWith('cross-bundle-icon');

        unsubscribe();
        listener.mockClear();
        otherRegistry.register('cross-bundle-unsubscribed-icon', '<svg/>');
        expect(listener).not.toHaveBeenCalled();
      } finally {
        unsubscribe();
      }
    });

    it('does not overwrite customized built-in icons when another bundle loads', () => {
      const original = KritzelIconRegistry.get('cursor')!;
      const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        KritzelIconRegistry.register('cursor', '<svg id="custom-cursor"/>');
        jest.isolateModules(() => {
          const { KritzelIconRegistry: otherRegistry } = require('./icon-registry.class') as typeof import('./icon-registry.class');
          expect(otherRegistry.get('cursor')).toBe('<svg id="custom-cursor"/>');
        });
      } finally {
        KritzelIconRegistry.register('cursor', original);
        warning.mockRestore();
      }
    });
  });

  describe('built-in icons', () => {
    it('registers the chat submit and loading icons', () => {
      expect(KritzelIconRegistry.get('arrowUp')).toContain('<path d="m5 12 7-7 7 7"/>');
      expect(KritzelIconRegistry.get('square')).toContain('<rect width="18" height="18" x="3" y="3" rx="2"/>');
      for (const name of ['arrowUp', 'square']) {
        expect(KritzelIconRegistry.get(name)).toContain('stroke-width="1.25"');
      }
    });

    it('should have registered default icons on import', () => {
      expect(KritzelIconRegistry.has('cursor')).toBe(true);
      expect(KritzelIconRegistry.has('pen')).toBe(true);
      expect(KritzelIconRegistry.has('eraser')).toBe(true);
      expect(KritzelIconRegistry.has('pointer')).toBe(true);
      expect(KritzelIconRegistry.has('mousePointer')).toBe(true);
    });

    it('should return SVG content for registered built-in icons', () => {
      const svg = KritzelIconRegistry.get('cursor');

      expect(svg).toBeDefined();
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    });
  });

  describe('register', () => {
    it('should register a new icon', () => {
      KritzelIconRegistry.register('test-icon', '<svg>test</svg>');

      expect(KritzelIconRegistry.has('test-icon')).toBe(true);
      expect(KritzelIconRegistry.get('test-icon')).toBe('<svg>test</svg>');
    });

    it('should overwrite an existing icon and warn', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation();

      KritzelIconRegistry.register('overwrite-icon', '<svg>first</svg>');
      KritzelIconRegistry.register('overwrite-icon', '<svg>second</svg>');

      expect(KritzelIconRegistry.get('overwrite-icon')).toBe('<svg>second</svg>');
      expect(spy).toHaveBeenCalledWith(
        '[IconRegistry] Icon "overwrite-icon" is already registered. It will be overwritten.'
      );

      spy.mockRestore();
    });
  });

  describe('get', () => {
    it('should return undefined for an unregistered icon', () => {
      expect(KritzelIconRegistry.get('nonexistent-icon')).toBeUndefined();
    });

    it('should return the SVG content for a registered icon', () => {
      KritzelIconRegistry.register('get-test', '<svg>get</svg>');

      expect(KritzelIconRegistry.get('get-test')).toBe('<svg>get</svg>');
    });
  });

  describe('has', () => {
    it('should return false for an unregistered icon', () => {
      expect(KritzelIconRegistry.has('does-not-exist')).toBe(false);
    });

    it('should return true for a registered icon', () => {
      KritzelIconRegistry.register('has-test', '<svg>has</svg>');

      expect(KritzelIconRegistry.has('has-test')).toBe(true);
    });
  });

  describe('registerIcons', () => {
    it('should register multiple icons at once', () => {
      KritzelIconRegistry.registerIcons({
        'batch-a': '<svg>a</svg>',
        'batch-b': '<svg>b</svg>',
        'batch-c': '<svg>c</svg>',
      });

      expect(KritzelIconRegistry.get('batch-a')).toBe('<svg>a</svg>');
      expect(KritzelIconRegistry.get('batch-b')).toBe('<svg>b</svg>');
      expect(KritzelIconRegistry.get('batch-c')).toBe('<svg>c</svg>');
    });

    it('should not register inherited properties', () => {
      const icons = Object.create({ inherited: '<svg>no</svg>' });
      icons['own'] = '<svg>yes</svg>';

      KritzelIconRegistry.registerIcons(icons);

      expect(KritzelIconRegistry.has('own')).toBe(true);
      expect(KritzelIconRegistry.has('inherited')).toBe(false);
    });
  });
});
