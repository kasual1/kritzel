import { UpdrawIconRegistry } from './icon-registry.class';

describe('UpdrawIconRegistry', () => {
  describe('shared bundle state', () => {
    it('shares registered icons and notifications between module instances', () => {
      let otherRegistry: typeof UpdrawIconRegistry;
      jest.isolateModules(() => {
        otherRegistry = (require('./icon-registry.class') as typeof import('./icon-registry.class')).UpdrawIconRegistry;
      });

      const listener = jest.fn();
      const unsubscribe = UpdrawIconRegistry.subscribe(listener);
      try {
        expect(otherRegistry).not.toBe(UpdrawIconRegistry);
        otherRegistry.register('cross-bundle-icon', '<svg/>');
        expect(UpdrawIconRegistry.get('cross-bundle-icon')).toBe('<svg/>');
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
      const original = UpdrawIconRegistry.get('cursor')!;
      const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        UpdrawIconRegistry.register('cursor', '<svg id="custom-cursor"/>');
        jest.isolateModules(() => {
          const { UpdrawIconRegistry: otherRegistry } = require('./icon-registry.class') as typeof import('./icon-registry.class');
          expect(otherRegistry.get('cursor')).toBe('<svg id="custom-cursor"/>');
        });
      } finally {
        UpdrawIconRegistry.register('cursor', original);
        warning.mockRestore();
      }
    });
  });

  describe('built-in icons', () => {
    it('registers the chat submit and loading icons', () => {
      expect(UpdrawIconRegistry.get('arrowUp')).toContain('<path d="m5 12 7-7 7 7"/>');
      expect(UpdrawIconRegistry.get('square')).toContain('<rect width="18" height="18" x="3" y="3" rx="2"/>');
      for (const name of ['arrowUp', 'square']) {
        expect(UpdrawIconRegistry.get(name)).toContain('stroke-width="1.5"');
      }
    });

    it('should have registered default icons on import', () => {
      expect(UpdrawIconRegistry.has('cursor')).toBe(true);
      expect(UpdrawIconRegistry.has('pen')).toBe(true);
      expect(UpdrawIconRegistry.has('eraser')).toBe(true);
      expect(UpdrawIconRegistry.has('pointer')).toBe(true);
      expect(UpdrawIconRegistry.has('mousePointer')).toBe(true);
    });

    it('should return SVG content for registered built-in icons', () => {
      const svg = UpdrawIconRegistry.get('cursor');

      expect(svg).toBeDefined();
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    });
  });

  describe('register', () => {
    it('should register a new icon', () => {
      UpdrawIconRegistry.register('test-icon', '<svg>test</svg>');

      expect(UpdrawIconRegistry.has('test-icon')).toBe(true);
      expect(UpdrawIconRegistry.get('test-icon')).toBe('<svg>test</svg>');
    });

    it('should overwrite an existing icon and warn', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation();

      UpdrawIconRegistry.register('overwrite-icon', '<svg>first</svg>');
      UpdrawIconRegistry.register('overwrite-icon', '<svg>second</svg>');

      expect(UpdrawIconRegistry.get('overwrite-icon')).toBe('<svg>second</svg>');
      expect(spy).toHaveBeenCalledWith(
        '[IconRegistry] Icon "overwrite-icon" is already registered. It will be overwritten.'
      );

      spy.mockRestore();
    });
  });

  describe('get', () => {
    it('should return undefined for an unregistered icon', () => {
      expect(UpdrawIconRegistry.get('nonexistent-icon')).toBeUndefined();
    });

    it('should return the SVG content for a registered icon', () => {
      UpdrawIconRegistry.register('get-test', '<svg>get</svg>');

      expect(UpdrawIconRegistry.get('get-test')).toBe('<svg>get</svg>');
    });
  });

  describe('has', () => {
    it('should return false for an unregistered icon', () => {
      expect(UpdrawIconRegistry.has('does-not-exist')).toBe(false);
    });

    it('should return true for a registered icon', () => {
      UpdrawIconRegistry.register('has-test', '<svg>has</svg>');

      expect(UpdrawIconRegistry.has('has-test')).toBe(true);
    });
  });

  describe('registerIcons', () => {
    it('should register multiple icons at once', () => {
      UpdrawIconRegistry.registerIcons({
        'batch-a': '<svg>a</svg>',
        'batch-b': '<svg>b</svg>',
        'batch-c': '<svg>c</svg>',
      });

      expect(UpdrawIconRegistry.get('batch-a')).toBe('<svg>a</svg>');
      expect(UpdrawIconRegistry.get('batch-b')).toBe('<svg>b</svg>');
      expect(UpdrawIconRegistry.get('batch-c')).toBe('<svg>c</svg>');
    });

    it('should not register inherited properties', () => {
      const icons = Object.create({ inherited: '<svg>no</svg>' });
      icons['own'] = '<svg>yes</svg>';

      UpdrawIconRegistry.registerIcons(icons);

      expect(UpdrawIconRegistry.has('own')).toBe(true);
      expect(UpdrawIconRegistry.has('inherited')).toBe(false);
    });
  });
});
