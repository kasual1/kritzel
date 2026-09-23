import { KritzelFontFamily } from './kritzel-font-family';

jest.mock('@stencil/core', () => ({
  ...jest.requireActual('@stencil/core/internal/testing'),
  Component: () => (cls: any) => cls,
  Prop: () => () => {},
  State: () => () => {},
  Watch: () => () => {},
  Event: () => () => {},
}));

describe('KritzelFontFamily', () => {
  let component: KritzelFontFamily;

  beforeEach(() => {
    component = new KritzelFontFamily();
  });

  it('uses provided fontOptions as-is', () => {
    component.fontOptions = [
      { value: 'Lora', label: 'Lora', cssFontFamily: "'Lora', serif" },
      { value: 'Inter', label: 'Inter', cssFontFamily: "'Inter', sans-serif" },
    ];

    const resolved = (component as any).resolveFontOptions();

    expect(resolved).toEqual(component.fontOptions);
  });

  it('selects first provided option when selectedFontFamily is invalid', () => {
    component.fontOptions = [
      { value: 'Lora', label: 'Lora' },
      { value: 'Inter', label: 'Inter' },
    ];
    component.selectedFontFamily = 'Unknown Font';

    component.handleFontOptionsChange();

    expect(component.selectedFontFamily).toBe('Lora');
  });

  it('does not modify selectedFontFamily when no options are provided', () => {
    component.fontOptions = [];
    component.selectedFontFamily = 'Still Selected';

    component.handleFontOptionsChange();

    expect(component.selectedFontFamily).toBe('Still Selected');
  });
});
