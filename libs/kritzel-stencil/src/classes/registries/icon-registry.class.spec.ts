import { KritzelIconRegistry } from './icon-registry.class';

describe('KritzelIconRegistry', () => {
  describe('built-in icons', () => {
    it('should have registered default icons on import', () => {
      expect(KritzelIconRegistry.has('cursor')).toBe(true);
      expect(KritzelIconRegistry.has('pen')).toBe(true);
      expect(KritzelIconRegistry.has('eraser')).toBe(true);
      expect(KritzelIconRegistry.has('pointer')).toBe(true);
      expect(KritzelIconRegistry.has('mouse-pointer')).toBe(true);
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
