export type UpmadeDialogCloseReason = 'backdrop' | 'escape' | 'close-button' | 'programmatic';

export interface IUpmadeDialogCloseEvent {
  reason: UpmadeDialogCloseReason;
}
