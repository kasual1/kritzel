export interface KritzelEmbeddedObject {
  isInteractive: boolean;
  isSelected: boolean;

  mount(element: HTMLElement): void;
  unmount(): void;
  setIsInteractive(isInteractive: boolean): void;
  hasFocusedInputElement(): boolean;
  getEmbeddedContentRoots(): HTMLElement[];
}