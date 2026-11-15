import { UpmadeIconRegistry } from './icon-registry.class';

describe('UpmadeIconRegistry', () => {
  describe('shared bundle state', () => {
    it('shares registered icons and notifications between module instances', () => {
      let otherRegistry: typeof UpmadeIconRegistry;
      jest.isolateModules(() => {
        otherRegistry = (require('./icon-registry.class') as typeof import('./icon-registry.class')).UpmadeIconRegistry;
      });

      const listener = jest.fn();
      const unsubscribe = UpmadeIconRegistry.subscribe(listener);
      try {
        expect(otherRegistry).not.toBe(UpmadeIconRegistry);
        otherRegistry.register('cross-bundle-icon', '<svg/>');
        expect(UpmadeIconRegistry.get('cross-bundle-icon')).toBe('<svg/>');
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
      const original = UpmadeIconRegistry.get('cursor')!;
      const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        UpmadeIconRegistry.register('cursor', '<svg id="custom-cursor"/>');
        jest.isolateModules(() => {
          const { UpmadeIconRegistry: otherRegistry } = require('./icon-registry.class') as typeof import('./icon-registry.class');
          expect(otherRegistry.get('cursor')).toBe('<svg id="custom-cursor"/>');
        });
      } finally {
        UpmadeIconRegistry.register('cursor', original);
        warning.mockRestore();
      }
    });
  });

  describe('built-in icons', () => {
    it('registers the chat submit and loading icons', () => {
      expect(UpmadeIconRegistry.get('arrowUp')).toContain('<path d="m5 12 7-7 7 7"/>');
      expect(UpmadeIconRegistry.get('square')).toContain('<rect width="18" height="18" x="3" y="3" rx="2"/>');
      for (const name of ['arrowUp', 'square']) {
        expect(UpmadeIconRegistry.get(name)).toContain('stroke-width="1.5"');
      }
    });

    it('should have registered default icons on import', () => {
      expect(UpmadeIconRegistry.has('cursor')).toBe(true);
      expect(UpmadeIconRegistry.has('pen')).toBe(true);
      expect(UpmadeIconRegistry.has('eraser')).toBe(true);
      expect(UpmadeIconRegistry.has('pointer')).toBe(true);
      expect(UpmadeIconRegistry.has('mousePointer')).toBe(true);
    });

    it('should return SVG content for registered built-in icons', () => {
      const svg = UpmadeIconRegistry.get('cursor');

      expect(svg).toBeDefined();
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    });
  });

  describe('register', () => {
    it('should register a new icon', () => {
      UpmadeIconRegistry.register('test-icon', '<svg>test</svg>');

      expect(UpmadeIconRegistry.has('test-icon')).toBe(true);
      expect(UpmadeIconRegistry.get('test-icon')).toBe('<svg>test</svg>');
    });

    it('should overwrite an existing icon and warn', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation();

      UpmadeIconRegistry.register('overwrite-icon', '<svg>first</svg>');
      UpmadeIconRegistry.register('overwrite-icon', '<svg>second</svg>');

      expect(UpmadeIconRegistry.get('overwrite-icon')).toBe('<svg>second</svg>');
      expect(spy).toHaveBeenCalledWith(
        '[IconRegistry] Icon "overwrite-icon" is already registered. It will be overwritten.'
      );

      spy.mockRestore();
    });
  });

  describe('get', () => {
    it('should return undefined for an unregistered icon', () => {
      expect(UpmadeIconRegistry.get('nonexistent-icon')).toBeUndefined();
    });

    it('should return the SVG content for a registered icon', () => {
      UpmadeIconRegistry.register('get-test', '<svg>get</svg>');

      expect(UpmadeIconRegistry.get('get-test')).toBe('<svg>get</svg>');
    });
  });

  describe('has', () => {
    it('should return false for an unregistered icon', () => {
      expect(UpmadeIconRegistry.has('does-not-exist')).toBe(false);
    });

    it('should return true for a registered icon', () => {
      UpmadeIconRegistry.register('has-test', '<svg>has</svg>');

      expect(UpmadeIconRegistry.has('has-test')).toBe(true);
    });
  });

  describe('registerIcons', () => {
    it('should register multiple icons at once', () => {
      UpmadeIconRegistry.registerIcons({
        'batch-a': '<svg>a</svg>',
        'batch-b': '<svg>b</svg>',
        'batch-c': '<svg>c</svg>',
      });

      expect(UpmadeIconRegistry.get('batch-a')).toBe('<svg>a</svg>');
      expect(UpmadeIconRegistry.get('batch-b')).toBe('<svg>b</svg>');
      expect(UpmadeIconRegistry.get('batch-c')).toBe('<svg>c</svg>');
    });

    it('should not register inherited properties', () => {
      const icons = Object.create({ inherited: '<svg>no</svg>' });
      icons['own'] = '<svg>yes</svg>';

      UpmadeIconRegistry.registerIcons(icons);

      expect(UpmadeIconRegistry.has('own')).toBe(true);
      expect(UpmadeIconRegistry.has('inherited')).toBe(false);
    });
  });
});
