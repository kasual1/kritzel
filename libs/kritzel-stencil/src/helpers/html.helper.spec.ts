import { KritzelHTMLHelper } from "./html.helper";

describe('KritzelHTMLHelper', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  afterEach(() => {
    if (document.body.contains(element)) {
      document.body.removeChild(element);
    }
    jest.restoreAllMocks();
  });

  it('should return the numeric value for a pixel-based style', () => {
    jest.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (prop: any) => (prop === 'width' ? '100px' : ''),
    } as any);
    expect(KritzelHTMLHelper.getNumericValueFromStyle(element, 'width')).toBe(100);
  });

  it('should return the numeric value for a percentage-based style', () => {
    jest.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (prop: any) => (prop === 'width' ? '50%' : ''),
    } as any);
    expect(KritzelHTMLHelper.getNumericValueFromStyle(element, 'width')).toBe(50);
  });

  it('should return 0 for non-numeric style values like "auto"', () => {
    jest.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (prop: any) => (prop === 'display' ? 'flex' : ''),
    } as any);
    expect(KritzelHTMLHelper.getNumericValueFromStyle(element, 'display')).toBe(0);
  });

  it('should return 0 for a property that does not exist', () => {
    jest.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: () => '',
    } as any);
    expect(KritzelHTMLHelper.getNumericValueFromStyle(element, 'non-existent-property')).toBe(0);
  });

  it('should handle floating point values correctly', () => {
    jest.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (prop: any) => (prop === 'font-size' ? '12.5px' : ''),
    } as any);
    expect(KritzelHTMLHelper.getNumericValueFromStyle(element, 'font-size')).toBe(12.5);
  });

  it('should handle different units like "em"', () => {
    jest.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (prop: any) => (prop === 'margin-top' ? '2em' : ''),
    } as any);
    expect(KritzelHTMLHelper.getNumericValueFromStyle(element, 'margin-top')).toBe(2);
  });
});
