export type KritzelDialogCloseReason = 'backdrop' | 'escape' | 'close-button' | 'programmatic';

export interface IKritzelDialogCloseEvent {
  reason: KritzelDialogCloseReason;
}
