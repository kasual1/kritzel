export class KritzelKeyboardHelper {
 static getNumericValueFromStyle(element: HTMLElement, property: string): number {
   const value = window.getComputedStyle(element).getPropertyValue(property);
   return parseFloat(value) || 0;
 }
}